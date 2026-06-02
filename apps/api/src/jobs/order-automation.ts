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

type AutomationStatus = {
  lastRunAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  escalatedInLastRun: number;
  refundedInLastRun: number;
};

const automationStatus: AutomationStatus = {
  lastRunAt: null,
  lastSuccessAt: null,
  lastError: null,
  escalatedInLastRun: 0,
  refundedInLastRun: 0
};

export function getOrderAutomationStatus(): AutomationStatus {
  return automationStatus;
}

export function startOrderAutomation(intervalMs = 60_000): NodeJS.Timeout {
  const run = async () => {
    automationStatus.lastRunAt = new Date().toISOString();
    try {
      const escalatedInLastRun = await escalateUnacceptedOrders();
      const refundedInLastRun = await refundStaleEscalatedOrders();
      automationStatus.escalatedInLastRun = escalatedInLastRun;
      automationStatus.refundedInLastRun = refundedInLastRun;
      automationStatus.lastSuccessAt = new Date().toISOString();
      automationStatus.lastError = null;
    } catch (error) {
      automationStatus.lastError =
        error instanceof Error ? error.message : "Unknown automation error";
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

  let escalatedCount = 0;
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
    escalatedCount += 1;
  }
  return escalatedCount;
}

async function refundStaleEscalatedOrders() {
  const result = await pool.query<EscalatedOrder>(
    `SELECT id, escalated_at
     FROM orders
     WHERE status = 'escalated'`
  );

  let refundedCount = 0;
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
    refundedCount += 1;
  }
  return refundedCount;
}

