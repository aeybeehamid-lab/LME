import { afterEach, describe, expect, it, vi } from "vitest";
import { pool } from "../../db";
import { getOrderEvents } from "./order.service";

describe("order event timeline", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps database status events into API shape", async () => {
    vi.spyOn(pool, "query").mockResolvedValue({
      rows: [
        {
          id: "evt-1",
          order_id: "ord-1",
          from_status: "posted_to_job_board",
          to_status: "escalated",
          actor_user_id: null,
          reason: "Auto-escalated after 10 minutes without rider acceptance",
          created_at: new Date("2026-06-02T12:00:00.000Z")
        }
      ]
    } as never);

    const events = await getOrderEvents("ord-1");
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: "evt-1",
      orderId: "ord-1",
      fromStatus: "posted_to_job_board",
      toStatus: "escalated",
      reason: "Auto-escalated after 10 minutes without rider acceptance"
    });
    expect(events[0]?.createdAt).toBe("2026-06-02T12:00:00.000Z");
  });
});

