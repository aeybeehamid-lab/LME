import {
  OrderCategory,
  OrderStatus,
  UserRole,
  lmeRevenueKobo,
  riderCommissionKobo
} from "@lme/types";
import { pool } from "../../db";
import { AppError } from "../../middleware/errorHandler";
import { assertValidTransition } from "./order.state-machine";
import { assertRoleCanTransition } from "./order.transition-policy";

interface DbOrder {
  id: string;
  customer_id: string;
  rider_id: string | null;
  customer_name?: string | null;
  rider_name?: string | null;
  category: OrderCategory;
  status: OrderStatus;
  delivery_fee_kobo: string;
  urgent_multiplier: string;
  pickup_address: string;
  dropoff_address: string;
  item_description: string | null;
  escalated_at: Date | null;
  delivered_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface DbOrderStatusEvent {
  id: string;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  actor_user_id: string | null;
  reason: string | null;
  created_at: Date;
}

function mapOrder(row: DbOrder) {
  const fee = Number(row.delivery_fee_kobo);
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name ?? undefined,
    riderId: row.rider_id ?? undefined,
    riderName: row.rider_name ?? undefined,
    category: row.category,
    status: row.status,
    deliveryFeeKobo: fee,
    urgentMultiplier: Number(row.urgent_multiplier),
    pickupAddress: row.pickup_address,
    dropoffAddress: row.dropoff_address,
    itemDescription: row.item_description ?? undefined,
    escalatedAt: row.escalated_at ? row.escalated_at.toISOString() : undefined,
    deliveredAt: row.delivered_at ? row.delivered_at.toISOString() : undefined,
    riderCommissionKobo: riderCommissionKobo(fee),
    lmeRevenueKobo: lmeRevenueKobo(fee),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function createOrder(input: {
  customerId: string;
  category: OrderCategory;
  deliveryFeeKobo: number;
  urgentMultiplier?: number;
  pickupAddress: string;
  dropoffAddress: string;
  itemDescription?: string;
}) {
  const result = await pool.query<DbOrder>(
    `INSERT INTO orders (
      customer_id, category, status, delivery_fee_kobo, urgent_multiplier,
      pickup_address, dropoff_address, item_description
    ) VALUES ($1, $2, 'created', $3, $4, $5, $6, $7)
    RETURNING *`,
    [
      input.customerId,
      input.category,
      input.deliveryFeeKobo,
      input.urgentMultiplier ?? 1,
      input.pickupAddress,
      input.dropoffAddress,
      input.itemDescription ?? null
    ]
  );

  const order = result.rows[0];
  if (!order) throw new AppError(500, "Failed to create order.");

  await recordStatusEvent(order.id, null, "created", input.customerId, "Order created");
  return mapOrder(order);
}

export async function listOrders(filters?: {
  status?: OrderStatus;
  customerId?: string;
  riderId?: string;
}) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (filters?.status) {
    values.push(filters.status);
    clauses.push(`o.status = $${values.length}`);
  }
  if (filters?.customerId) {
    values.push(filters.customerId);
    clauses.push(`o.customer_id = $${values.length}`);
  }
  if (filters?.riderId) {
    values.push(filters.riderId);
    clauses.push(`o.rider_id = $${values.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const result = await pool.query<DbOrder>(
    `SELECT
       o.*,
       cu.name as customer_name,
       ru.name as rider_name
     FROM orders o
     INNER JOIN users cu ON cu.id = o.customer_id
     LEFT JOIN users ru ON ru.id = o.rider_id
     ${where}
     ORDER BY o.created_at DESC
     LIMIT 100`,
    values
  );

  return result.rows.map(mapOrder);
}

export async function listOpenJobBoardOrders() {
  return listOrders({ status: "posted_to_job_board" });
}

export async function getOrderById(orderId: string) {
  const result = await pool.query<DbOrder>(
    `SELECT
       o.*,
       cu.name as customer_name,
       ru.name as rider_name
     FROM orders o
     INNER JOIN users cu ON cu.id = o.customer_id
     LEFT JOIN users ru ON ru.id = o.rider_id
     WHERE o.id = $1`,
    [orderId]
  );
  const row = result.rows[0];
  if (!row) throw new AppError(404, "Order not found.", "NOT_FOUND");
  return mapOrder(row);
}

export async function getOrderEvents(orderId: string) {
  const result = await pool.query<DbOrderStatusEvent>(
    `SELECT id, order_id, from_status, to_status, actor_user_id, reason, created_at
     FROM order_status_events
     WHERE order_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [orderId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    orderId: row.order_id,
    fromStatus: row.from_status ?? undefined,
    toStatus: row.to_status,
    actorUserId: row.actor_user_id ?? undefined,
    reason: row.reason ?? undefined,
    createdAt: row.created_at.toISOString()
  }));
}

export async function transitionOrderStatus(input: {
  orderId: string;
  toStatus: OrderStatus;
  actorUserId?: string;
  actorRole?: UserRole;
  riderId?: string;
  reason?: string;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const current = await client.query<DbOrder>(
      `SELECT * FROM orders WHERE id = $1 FOR UPDATE`,
      [input.orderId]
    );
    const order = current.rows[0];
    if (!order) throw new AppError(404, "Order not found.", "NOT_FOUND");

    const fromStatus = order.status;
    assertValidTransition(fromStatus, input.toStatus);
    assertRoleCanTransition(input.actorRole, fromStatus, input.toStatus, {
      actorUserId: input.actorUserId,
      orderRiderId: order.rider_id,
      assignRiderId: input.riderId
    });

    const escalatedAt =
      input.toStatus === "escalated" ? new Date() : order.escalated_at ?? null;
    const deliveredAt =
      input.toStatus === "delivered" ? new Date() : order.delivered_at ?? null;

    const updated = await client.query<DbOrder>(
      `UPDATE orders
       SET status = $2,
           rider_id = COALESCE($3, rider_id),
           escalated_at = COALESCE($4, escalated_at),
           delivered_at = COALESCE($5, delivered_at),
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [
        input.orderId,
        input.toStatus,
        input.riderId ?? null,
        escalatedAt,
        deliveredAt
      ]
    );

    await client.query(
      `INSERT INTO order_status_events (order_id, from_status, to_status, actor_user_id, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        input.orderId,
        fromStatus,
        input.toStatus,
        input.actorUserId ?? null,
        input.reason ?? null
      ]
    );

    await client.query("COMMIT");
    const row = updated.rows[0];
    if (!row) throw new AppError(500, "Failed to update order.");
    return mapOrder(row);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function recordStatusEvent(
  orderId: string,
  fromStatus: OrderStatus | null,
  toStatus: OrderStatus,
  actorUserId: string,
  reason: string
) {
  await pool.query(
    `INSERT INTO order_status_events (order_id, from_status, to_status, actor_user_id, reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [orderId, fromStatus, toStatus, actorUserId, reason]
  );
}
