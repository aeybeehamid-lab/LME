import { riderCommissionKobo } from "@lme/types";
import { pool } from "../../db";

interface DbPaymentRow {
  id: string;
  order_id: string;
  paystack_reference: string;
  amount_kobo: string;
  status: string;
  created_at: Date;
}

export async function getFinanceSummary() {
  const [paymentsAgg, deliveredAgg, orderCounts] = await Promise.all([
    pool.query<{
      money_in_kobo: string;
      refunded_kobo: string;
      pending_count: string;
      success_count: string;
    }>(
      `SELECT
         COALESCE(SUM(CASE WHEN status = 'success' THEN amount_kobo ELSE 0 END), 0) as money_in_kobo,
         COALESCE(SUM(CASE WHEN status = 'refunded' THEN amount_kobo ELSE 0 END), 0) as refunded_kobo,
         COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
         COUNT(*) FILTER (WHERE status = 'success') as success_count
       FROM payments`
    ),
    pool.query<{ total_fee_kobo: string; delivery_count: string }>(
      `SELECT
         COALESCE(SUM(delivery_fee_kobo), 0) as total_fee_kobo,
         COUNT(*)::text as delivery_count
       FROM orders
       WHERE status = 'delivered'`
    ),
    pool.query<{ status: string; count: string }>(
      `SELECT status, COUNT(*)::text as count
       FROM orders
       GROUP BY status`
    )
  ]);

  const pay = paymentsAgg.rows[0];
  const del = deliveredAgg.rows[0];
  const moneyInKobo = Number(pay?.money_in_kobo ?? 0);
  const refundedKobo = Number(pay?.refunded_kobo ?? 0);
  const deliveredFeeKobo = Number(del?.total_fee_kobo ?? 0);
  const riderCommissionsKobo = riderCommissionKobo(deliveredFeeKobo);
  const lmeShareFromDeliveredKobo = deliveredFeeKobo - riderCommissionsKobo;
  const netKobo = moneyInKobo - riderCommissionsKobo - refundedKobo;

  const ordersByStatus: Record<string, number> = {};
  for (const row of orderCounts.rows) {
    ordersByStatus[row.status] = Number(row.count);
  }

  return {
    moneyInKobo,
    riderCommissionsKobo,
    refundedKobo,
    netKobo,
    lmeShareFromDeliveredKobo,
    deliveredCount: Number(del?.delivery_count ?? 0),
    payments: {
      pending: Number(pay?.pending_count ?? 0),
      success: Number(pay?.success_count ?? 0)
    },
    ordersByStatus,
    activeOrders:
      (ordersByStatus.posted_to_job_board ?? 0) +
      (ordersByStatus.rider_assigned ?? 0) +
      (ordersByStatus.picked_up ?? 0) +
      (ordersByStatus.en_route ?? 0) +
      (ordersByStatus.escalated ?? 0)
  };
}

export async function listRecentTransactions(limit = 50) {
  const result = await pool.query<DbPaymentRow>(
    `SELECT id, order_id, paystack_reference, amount_kobo, status, created_at
     FROM payments
     ORDER BY created_at DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    orderId: row.order_id,
    paystackReference: row.paystack_reference,
    amountKobo: Number(row.amount_kobo),
    status: row.status,
    createdAt: row.created_at.toISOString()
  }));
}

export async function getRiderStats(riderUserId: string) {
  const result = await pool.query<{
    delivery_count: string;
    total_fee_kobo: string;
    avg_rating: string | null;
  }>(
    `SELECT
       COUNT(*)::text as delivery_count,
       COALESCE(SUM(delivery_fee_kobo), 0)::text as total_fee_kobo,
       NULL::text as avg_rating
     FROM orders
     WHERE rider_id = $1 AND status = 'delivered'`,
    [riderUserId]
  );

  const row = result.rows[0];
  const totalFeeKobo = Number(row?.total_fee_kobo ?? 0);
  const deliveryCount = Number(row?.delivery_count ?? 0);

  return {
    riderUserId,
    deliveryCount,
    totalEarningsKobo: riderCommissionKobo(totalFeeKobo),
    totalDeliveryFeesKobo: totalFeeKobo
  };
}
