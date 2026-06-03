import { describe, expect, it } from "vitest";
import { assertRoleCanTransition } from "./order.transition-policy";
import { AppError } from "../../middleware/errorHandler";

describe("order transition policy", () => {
  it("allows rider to accept open job", () => {
    expect(() =>
      assertRoleCanTransition("rider", "posted_to_job_board", "rider_assigned", {
        actorUserId: "rider-1",
        orderRiderId: null,
        assignRiderId: "rider-1"
      })
    ).not.toThrow();
  });

  it("blocks rider from accepting for someone else", () => {
    expect(() =>
      assertRoleCanTransition("rider", "posted_to_job_board", "rider_assigned", {
        actorUserId: "rider-1",
        orderRiderId: null,
        assignRiderId: "rider-2"
      })
    ).toThrow(AppError);
  });

  it("blocks rider from marking delivered on unassigned order", () => {
    expect(() =>
      assertRoleCanTransition("rider", "rider_assigned", "delivered", {
        actorUserId: "rider-1",
        orderRiderId: "rider-2"
      })
    ).toThrow(AppError);
  });

  it("allows assigned rider fulfillment updates", () => {
    expect(() =>
      assertRoleCanTransition("rider", "picked_up", "en_route", {
        actorUserId: "rider-1",
        orderRiderId: "rider-1"
      })
    ).not.toThrow();
  });

  it("allows executive refund on escalated order", () => {
    expect(() =>
      assertRoleCanTransition("executive", "escalated", "refunded", {
        actorUserId: "admin-1"
      })
    ).not.toThrow();
  });
});
