import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pool } from "../../db";
import { app } from "../../app";

async function devLogin(phone: string, role: "customer" | "executive") {
  const res = await request(app).post("/api/v1/auth/dev-login").send({
    phone,
    role,
    name: role === "executive" ? "LME Admin" : "Test Customer"
  });
  expect(res.status).toBe(200);
  return res.body as { token: string; user: { id: string } };
}

describe("orders integration", () => {
  beforeAll(async () => {
    // Smoke check DB connectivity early to fail fast.
    await pool.query("SELECT 1");
  });

  afterAll(async () => {
    await pool.end();
  });

  it("transitions order status and records an order_status_event", async () => {
    const unique = Math.floor(Math.random() * 900000 + 100000); // 6 digits
    const admin = await devLogin(`+234800${unique}`, "executive");
    const customer = await devLogin(`+234811${unique}`, "customer");

    const createRes = await request(app)
      .post("/api/v1/orders")
      .set("Authorization", `Bearer ${customer.token}`)
      .send({
        category: "gadgets",
        deliveryFeeKobo: 1200 * 100,
        pickupAddress: "Terminus Market, Jos",
        dropoffAddress: "Rwang Pam, Jos",
        itemDescription: "Test device"
      });

    expect(createRes.status).toBe(201);
    const orderId = createRes.body.order.id as string;
    expect(orderId).toBeTruthy();

    const transitionRes = await request(app)
      .patch(`/api/v1/orders/${orderId}/status`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ toStatus: "payment_pending", reason: "Integration test" });
    expect(transitionRes.status).toBe(200);
    expect(transitionRes.body.order.status).toBe("payment_pending");

    const eventsRes = await request(app)
      .get(`/api/v1/orders/${orderId}/events`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(eventsRes.status).toBe(200);

    const events = eventsRes.body.events as Array<{ toStatus: string; reason?: string }>;
    expect(events.some((e) => e.toStatus === "payment_pending" && e.reason === "Integration test")).toBe(
      true
    );
  });
});

