import { OrderStatus } from "@lme/types";
import { pool } from "../../db";
import { sendPushToTokens } from "./fcm.service";

export async function registerPushToken(input: {
  userId: string;
  token: string;
  platform?: string;
}) {
  await pool.query(
    `INSERT INTO push_tokens (user_id, token, platform, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (user_id, token)
     DO UPDATE SET platform = EXCLUDED.platform, updated_at = NOW()`,
    [input.userId, input.token, input.platform ?? null]
  );
}

async function tokensForUsers(userIds: string[]): Promise<string[]> {
  if (!userIds.length) return [];
  const result = await pool.query<{ token: string }>(
    `SELECT token FROM push_tokens WHERE user_id = ANY($1::uuid[])`,
    [userIds]
  );
  return result.rows.map((r) => r.token);
}

async function onlineRiderUserIds(): Promise<string[]> {
  const result = await pool.query<{ user_id: string }>(
    `SELECT r.user_id
     FROM riders r
     INNER JOIN users u ON u.id = r.user_id
     WHERE u.is_active = TRUE AND r.is_online = TRUE`
  );
  return result.rows.map((r) => r.user_id);
}

async function allRiderUserIds(): Promise<string[]> {
  const result = await pool.query<{ user_id: string }>(
    `SELECT r.user_id
     FROM riders r
     INNER JOIN users u ON u.id = r.user_id
     WHERE u.is_active = TRUE`
  );
  return result.rows.map((r) => r.user_id);
}

async function executiveUserIds(): Promise<string[]> {
  const result = await pool.query<{ id: string }>(
    `SELECT id FROM users
     WHERE role IN ('executive', 'ops_assistant') AND is_active = TRUE`
  );
  return result.rows.map((r) => r.id);
}

async function pushToUsers(userIds: string[], payload: Parameters<typeof sendPushToTokens>[1]) {
  const uniqueIds = [...new Set(userIds)];
  const tokens = await tokensForUsers(uniqueIds);
  return sendPushToTokens(tokens, payload);
}

function orderData(orderId: string, status: OrderStatus) {
  return {
    orderId,
    status,
    type: "order_status"
  };
}

/** Fire-and-forget friendly: never throws to caller. */
export async function notifyOrderStatusChange(input: {
  orderId: string;
  customerId: string;
  riderId?: string;
  category: string;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
}) {
  const { orderId, customerId, riderId, category, toStatus } = input;
  const shortId = orderId.slice(0, 8).toUpperCase();
  const data = orderData(orderId, toStatus);

  try {
    switch (toStatus) {
      case "posted_to_job_board": {
        await pushToUsers([customerId], {
          title: "Order confirmed",
          body: `Order #${shortId} (${category}) is paid. We're finding a rider.`,
          data
        });
        const riders = await onlineRiderUserIds();
        const riderTargets = riders.length ? riders : await allRiderUserIds();
        await pushToUsers(riderTargets, {
          title: "New delivery job",
          body: `${category} · open on the job board. Be first to accept.`,
          data: { ...data, type: "new_job" }
        });
        await pushToUsers(await executiveUserIds(), {
          title: "New order",
          body: `Order #${shortId} (${category}) posted to job board.`,
          data
        });
        break;
      }
      case "rider_assigned":
        await pushToUsers([customerId], {
          title: "Rider assigned",
          body: `A rider accepted order #${shortId}.`,
          data
        });
        if (riderId) {
          await pushToUsers([riderId], {
            title: "Job locked to you",
            body: `You accepted order #${shortId}. Head to pickup.`,
            data
          });
        }
        await pushToUsers(await executiveUserIds(), {
          title: "Order assigned",
          body: `Order #${shortId} has a rider.`,
          data
        });
        break;
      case "picked_up":
        await pushToUsers([customerId], {
          title: "Picked up",
          body: `Your ${category} order #${shortId} was picked up.`,
          data
        });
        break;
      case "en_route":
        await pushToUsers([customerId], {
          title: "On the way",
          body: `Order #${shortId} is en route to you.`,
          data
        });
        break;
      case "delivered":
        await pushToUsers([customerId], {
          title: "Delivered",
          body: `Order #${shortId} was delivered. Thank you for using LME.`,
          data
        });
        if (riderId) {
          await pushToUsers([riderId], {
            title: "Delivery complete",
            body: `Commission added for order #${shortId}.`,
            data
          });
        }
        await pushToUsers(await executiveUserIds(), {
          title: "Order delivered",
          body: `Order #${shortId} completed.`,
          data
        });
        break;
      case "escalated":
        await pushToUsers(await allRiderUserIds(), {
          title: "Urgent job available",
          body: `Order #${shortId} needs a rider — open the job board.`,
          data: { ...data, type: "escalated_job" }
        });
        await pushToUsers(await executiveUserIds(), {
          title: "Order escalated",
          body: `Order #${shortId} has no rider after 10 minutes. Assign manually.`,
          data: { ...data, urgent: "true" }
        });
        break;
      case "refunded":
        await pushToUsers([customerId], {
          title: "Refund processed",
          body: `Order #${shortId} was refunded.`,
          data
        });
        break;
      case "cancelled":
        await pushToUsers([customerId], {
          title: "Order cancelled",
          body: `Order #${shortId} was cancelled.`,
          data
        });
        if (riderId) {
          await pushToUsers([riderId], {
            title: "Job cancelled",
            body: `Order #${shortId} is no longer active.`,
            data
          });
        }
        break;
      default:
        break;
    }
  } catch (err) {
    console.error("Push notification failed:", err);
  }
}
