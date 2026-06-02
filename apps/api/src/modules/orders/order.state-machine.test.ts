import { describe, expect, it } from "vitest";
import { assertValidTransition } from "./order.state-machine";
import { AppError } from "../../middleware/errorHandler";

describe("order state machine", () => {
  it("allows valid transitions", () => {
    expect(() =>
      assertValidTransition("payment_confirmed", "posted_to_job_board")
    ).not.toThrow();
    expect(() => assertValidTransition("escalated", "refunded")).not.toThrow();
  });

  it("rejects invalid transitions", () => {
    let thrown: unknown;
    try {
      assertValidTransition("created", "delivered");
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(AppError);
    const appError = thrown as AppError;
    expect(appError.code).toBe("INVALID_TRANSITION");
    expect(appError.statusCode).toBe(400);
  });
});

