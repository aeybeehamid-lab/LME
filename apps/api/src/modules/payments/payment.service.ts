import crypto from "crypto";
import { pool } from "../../db";
import { config } from "../../config";
import { AppError } from "../../middleware/errorHandler";
import { transitionOrderStatus } from "../orders/order.service";
import { initializePaystackCheckout } from "./paystack.client";

interface DbPayment {
  id: string;
  order_id: string;
  paystack_reference: string;
  amount_kobo: string;
  status: "pending" | "success" | "failed" | "refunded";
  idempotency_key: string;
}

function mapPaymentResponse(
  payment: DbPayment,
  paystack?: { authorizationUrl: string; accessCode: string } | null
) {
  return {
    id: payment.id,
    orderId: payment.order_id,
    paystackReference: payment.paystack_reference,
    amountKobo: Number(payment.amount_kobo),
    status: payment.status,
    authorizationUrl: paystack?.authorizationUrl ?? null,
    accessCode: paystack?.accessCode ?? null,
    paystackLive: Boolean(paystack?.authorizationUrl)
  };
}

export async function initializePayment(input: {
  orderId: string;
  amountKobo: number;
  idempotencyKey: string;
  customerEmail?: string;
}) {
  const existing = await pool.query<DbPayment>(
    `SELECT * FROM payments WHERE idempotency_key = $1`,
    [input.idempotencyKey]
  );
  if (existing.rows[0]) {
    return mapPaymentResponse(existing.rows[0], null);
  }

  const orderResult = await pool.query<{ status: string; phone: string }>(
    `SELECT o.status, u.phone
     FROM orders o
     INNER JOIN users u ON u.id = o.customer_id
     WHERE o.id = $1`,
    [input.orderId]
  );
  const orderRow = orderResult.rows[0];
  if (!orderRow) {
    throw new AppError(404, "Order not found.", "NOT_FOUND");
  }
  if (orderRow.status !== "created" && orderRow.status !== "payment_pending") {
    throw new AppError(
      400,
      "Payment can only be started for new or pending-payment orders.",
      "INVALID_STATE"
    );
  }

  const reference = `LME-${input.orderId.slice(0, 8)}-${Date.now()}`;
  const email =
    input.customerEmail ??
    `${orderRow.phone.replace(/\D/g, "") || "customer"}@lme.customer`;

  const paystack = await initializePaystackCheckout({
    email,
    amountKobo: input.amountKobo,
    reference,
    metadata: { order_id: input.orderId }
  });

  const inserted = await pool.query<DbPayment>(
    `INSERT INTO payments (order_id, paystack_reference, amount_kobo, status, idempotency_key)
     VALUES ($1, $2, $3, 'pending', $4)
     RETURNING *`,
    [input.orderId, reference, input.amountKobo, input.idempotencyKey]
  );

  const payment = inserted.rows[0];
  if (!payment) throw new AppError(500, "Failed to initialize payment.");

  if (orderRow.status === "created") {
    await transitionOrderStatus({
      orderId: input.orderId,
      toStatus: "payment_pending",
      reason: "Payment initialized"
    });
  }

  return mapPaymentResponse(payment, paystack);
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
