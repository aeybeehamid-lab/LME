import { OrderStatus, UserRole } from "@lme/types";
import { AppError } from "../../middleware/errorHandler";

const RIDER_FULFILLMENT: OrderStatus[] = ["picked_up", "en_route", "delivered"];

/** Ops and admin can move orders within the global state machine. */
const OPS_ALLOWED: OrderStatus[] = [
  "payment_pending",
  "payment_confirmed",
  "posted_to_job_board",
  "rider_assigned",
  "picked_up",
  "en_route",
  "delivered",
  "escalated",
  "cancelled",
  "refunded"
];

export function assertRoleCanTransition(
  role: UserRole | undefined,
  from: OrderStatus,
  to: OrderStatus,
  context: {
    actorUserId?: string;
    orderRiderId?: string | null;
    assignRiderId?: string;
  }
): void {
  if (!role) return;

  if (role === "executive" || role === "ops_assistant") {
    if (!OPS_ALLOWED.includes(to)) {
      throw new AppError(403, `Role cannot set status to ${to}.`, "FORBIDDEN");
    }
    return;
  }

  if (role === "rider") {
    if (!context.actorUserId) {
      throw new AppError(403, "Rider identity required.", "FORBIDDEN");
    }

    if (to === "rider_assigned" && from === "posted_to_job_board") {
      if (context.orderRiderId) {
        throw new AppError(409, "Order already has a rider.", "CONFLICT");
      }
      if (context.assignRiderId && context.assignRiderId !== context.actorUserId) {
        throw new AppError(403, "Riders can only accept jobs for themselves.", "FORBIDDEN");
      }
      return;
    }

    if (RIDER_FULFILLMENT.includes(to)) {
      const assigned = context.orderRiderId ?? context.assignRiderId;
      if (assigned !== context.actorUserId) {
        throw new AppError(
          403,
          "Only the assigned rider can update delivery progress.",
          "FORBIDDEN"
        );
      }
      return;
    }

    throw new AppError(
      403,
      `Riders cannot transition orders from ${from} to ${to}.`,
      "FORBIDDEN"
    );
  }

  if (role === "customer") {
    if (to === "cancelled" && (from === "created" || from === "payment_pending")) {
      return;
    }
    throw new AppError(403, "Customers cannot perform this status update.", "FORBIDDEN");
  }

  throw new AppError(403, "Insufficient permissions.", "FORBIDDEN");
}
