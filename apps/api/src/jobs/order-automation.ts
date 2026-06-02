import { pool } from "../db";
import { transitionOrderStatus } from "../modules/orders/order.service";

const TEN_MINUTES_MS = 10 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

type OpenBoardOrder = {
  id: string;
  created_at: Date;
  rider_id: string | null;
};

type EscalatedOrder = {
  id: string;
  escalated_at: Date | null;
};

export function startOrderAutomation(intervalMs = 60_000): NodeJS.Timeout {
  const run = async () => {
    try {
      await escalateUnacceptedOrders();
      await refundStaleEscalatedOrders();
    } catch (error) {
      console.error("Order automation cycle failed", error);
    }
  };

  // Fire once at startup, then on interval.
  void run();
  return setInterval(run, intervalMs);
}

async function escalateUnacceptedOrders() {
  const result = await pool.query<OpenBoardOrder>(
    `SELECT id, created_at, rider_id
     FROM orders
     WHERE status = 'posted_to_job_board'`
  );

  const now = Date.now();
  for (const order of result.rows) {
    if (order.rider_id) continue;
    const ageMs = now - new Date(order.created_at).getTime();
    if (ageMs < TEN_MINUTES_MS) continue;

    await transitionOrderStatus({
      orderId: order.id,
      toStatus: "escalated",
      reason: "Auto-escalated after 10 minutes without rider acceptance"
    });
  }
}

async function refundStaleEscalatedOrders() {
  const result = await pool.query<EscalatedOrder>(
    `SELECT id, escalated_at
     FROM orders
     WHERE status = 'escalated'`
  );

  const now = Date.now();
  for (const order of result.rows) {
    if (!order.escalated_at) continue;
    const escalatedAgeMs = now - new Date(order.escalated_at).getTime();
    if (escalatedAgeMs < THIRTY_MINUTES_MS) continue;

    await transitionOrderStatus({
      orderId: order.id,
      toStatus: "refunded",
      reason: "Auto-refunded after 30 minutes unresolved escalation"
    });

    await pool.query(
      `UPDATE payments
       SET status = 'refunded', updated_at = NOW()
       WHERE order_id = $1 AND status IN ('pending', 'success')`,
      [order.id]
    );
  }
}

