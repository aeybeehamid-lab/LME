import { canTransition, OrderStatus } from "@lme/types";
import { AppError } from "../../middleware/errorHandler";

export function assertValidTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) {
    throw new AppError(
      400,
      `Invalid status transition from ${from} to ${to}.`,
      "INVALID_TRANSITION"
    );
  }
}
