import crypto from "crypto";
import { pool } from "../../db";
import { config } from "../../config";
import { AppError } from "../../middleware/errorHandler";
import { transitionOrderStatus } from "../orders/order.service";

interface DbPayment {
  id: string;
  order_id: string;
  paystack_reference: string;
  amount_kobo: string;
  status: "pending" | "success" | "failed" | "refunded";
  idempotency_key: string;
}

export async function initializePayment(input: {
  orderId: string;
  amountKobo: number;
  idempotencyKey: string;
}) {
  const existing = await pool.query<DbPayment>(
    `SELECT * FROM payments WHERE idempotency_key = $1`,
    [input.idempotencyKey]
  );
  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const reference = `LME-${input.orderId.slice(0, 8)}-${Date.now()}`;

  const inserted = await pool.query<DbPayment>(
    `INSERT INTO payments (order_id, paystack_reference, amount_kobo, status, idempotency_key)
     VALUES ($1, $2, $3, 'pending', $4)
     RETURNING *`,
    [input.orderId, reference, input.amountKobo, input.idempotencyKey]
  );

  const payment = inserted.rows[0];
  if (!payment) throw new AppError(500, "Failed to initialize payment.");

  await transitionOrderStatus({
    orderId: input.orderId,
    toStatus: "payment_pending",
    reason: "Payment initialized"
  });

  return {
    id: payment.id,
    orderId: payment.order_id,
    paystackReference: payment.paystack_reference,
    amountKobo: Number(payment.amount_kobo),
    status: payment.status,
    checkoutUrl: `https://checkout.paystack.com/${payment.paystack_reference}`
  };
}

export function verifyPaystackSignature(rawBody: Buffer, signature?: string): boolean {
  if (!signature || !config.paystackSecretKey) return false;
  const hash = crypto
    .createHmac("sha512", config.paystackSecretKey)
    .update(rawBody)
    .digest("hex");
  return hash === signature;
}

export async function handlePaystackWebhook(input: {
  reference: string;
  status: "success" | "failed";
  idempotencyKey: string;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const paymentResult = await client.query<DbPayment>(
      `SELECT * FROM payments WHERE paystack_reference = $1 FOR UPDATE`,
      [input.reference]
    );
    const payment = paymentResult.rows[0];
    if (!payment) {
      throw new AppError(404, "Payment not found.", "NOT_FOUND");
    }

    if (payment.status === "success" || payment.status === "refunded") {
      await client.query("COMMIT");
      return { duplicate: true, paymentId: payment.id };
    }

    const nextStatus = input.status === "success" ? "success" : "failed";
    await client.query(
      `UPDATE payments
       SET status = $2, webhook_received_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [payment.id, nextStatus]
    );

    if (input.status === "success") {
      await transitionOrderStatus({
        orderId: payment.order_id,
        toStatus: "payment_confirmed",
        reason: "Paystack payment confirmed"
      });
      await transitionOrderStatus({
        orderId: payment.order_id,
        toStatus: "posted_to_job_board",
        reason: "Order posted to rider job board"
      });
    }

    await client.query("COMMIT");
    return { duplicate: false, paymentId: payment.id };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Dev-only: mark latest pending payment successful without Paystack. */
export async function devConfirmPayment(orderId: string) {
  if (config.env === "production") {
    throw new AppError(403, "Dev payment confirm is disabled in production.", "FORBIDDEN");
  }

  const result = await pool.query<DbPayment>(
    `SELECT * FROM payments
     WHERE order_id = $1 AND status = 'pending'
     ORDER BY created_at DESC
     LIMIT 1`,
    [orderId]
  );
  const payment = result.rows[0];
  if (!payment) {
    throw new AppError(404, "No pending payment for this order.", "NOT_FOUND");
  }

  return handlePaystackWebhook({
    reference: payment.paystack_reference,
    status: "success",
    idempotencyKey: `dev-confirm:${payment.id}`
  });
}
