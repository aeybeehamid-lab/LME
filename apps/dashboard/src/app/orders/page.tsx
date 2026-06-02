"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createOrder,
  fetchAutomationStatus,
  fetchOrders,
  updateOrderStatus
} from "../../lib/api";

type OrderRow = {
  id: string;
  category: string;
  status: string;
  deliveryFeeKobo: number;
  pickupAddress: string;
  dropoffAddress: string;
  itemDescription?: string;
  escalatedAt?: string;
  createdAt: string;
};

const statusOptions = [
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
] as const;

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [newOrder, setNewOrder] = useState({
    category: "gadgets",
    deliveryFeeNaira: 1200,
    pickupAddress: "",
    dropoffAddress: "",
    itemDescription: ""
  });
  const [statusChoice, setStatusChoice] = useState<Record<string, string>>({});
  const [statusFilter, setStatusFilter] = useState("all");
  const [automation, setAutomation] = useState<{
    lastRunAt: string | null;
    lastSuccessAt: string | null;
    lastError: string | null;
    escalatedInLastRun: number;
    refundedInLastRun: number;
  } | null>(null);

  async function loadOrders(filter = statusFilter) {
    setLoading(true);
    setError("");
    try {
      const data = await fetchOrders(filter);
      setOrders(data.orders as OrderRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders(statusFilter);
    fetchAutomationStatus()
      .then((data) => setAutomation(data.automation))
      .catch(() => setAutomation(null));
  }, []);

  const orderCount = useMemo(() => orders.length, [orders.length]);

  async function onCreateOrder(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setStatusMessage("");
    try {
      const deliveryFeeKobo = Math.round(Number(newOrder.deliveryFeeNaira) * 100);
      await createOrder({
        category: newOrder.category as "gadgets" | "food" | "grocery" | "laundry" | "other",
        deliveryFeeKobo,
        pickupAddress: newOrder.pickupAddress,
        dropoffAddress: newOrder.dropoffAddress,
        itemDescription: newOrder.itemDescription || undefined
      });
      setStatusMessage("Order created successfully.");
      setNewOrder((prev) => ({
        ...prev,
        pickupAddress: "",
        dropoffAddress: "",
        itemDescription: ""
      }));
      await loadOrders();
      const statusData = await fetchAutomationStatus();
      setAutomation(statusData.automation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  }

  async function onUpdateStatus(orderId: string) {
    const next = statusChoice[orderId];
    if (!next) {
      setError("Select a status before updating.");
      return;
    }
    setError("");
    setStatusMessage("");
    try {
      await updateOrderStatus(orderId, {
        toStatus: next as
          | "payment_pending"
          | "payment_confirmed"
          | "posted_to_job_board"
          | "rider_assigned"
          | "picked_up"
          | "en_route"
          | "delivered"
          | "escalated"
          | "cancelled"
          | "refunded",
        reason: "Updated from dashboard"
      });
      setStatusMessage(`Order ${orderId.slice(0, 8)} updated to ${next}.`);
      await loadOrders();
      const statusData = await fetchAutomationStatus();
      setAutomation(statusData.automation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  return (
    <section>
      <h1>Orders</h1>
      <p className="muted">Create and manage orders from the admin dashboard.</p>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Automation Health</h3>
        <p className="muted" style={{ marginTop: 0 }}>
          Tracks the background 10-minute escalation and 30-minute refund cycles.
        </p>
        {!automation ? (
          <p className="muted">Automation status unavailable.</p>
        ) : (
          <div className="grid">
            <div>
              <strong>Last run</strong>
              <p className="muted">{automation.lastRunAt ?? "N/A"}</p>
            </div>
            <div>
              <strong>Last success</strong>
              <p className="muted">{automation.lastSuccessAt ?? "N/A"}</p>
            </div>
            <div>
              <strong>Escalated (last run)</strong>
              <p className="muted">{automation.escalatedInLastRun}</p>
            </div>
            <div>
              <strong>Refunded (last run)</strong>
              <p className="muted">{automation.refundedInLastRun}</p>
            </div>
            <div>
              <strong>Last error</strong>
              <p className="muted">{automation.lastError ?? "None"}</p>
            </div>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Create Order</h3>
        <form onSubmit={onCreateOrder}>
          <div className="grid">
            <label>
              Category
              <select
                value={newOrder.category}
                onChange={(event) =>
                  setNewOrder((prev) => ({ ...prev, category: event.target.value }))
                }
              >
                <option value="gadgets">gadgets</option>
                <option value="food">food</option>
                <option value="grocery">grocery</option>
                <option value="laundry">laundry</option>
                <option value="other">other</option>
              </select>
            </label>
            <label>
              Delivery Fee (NGN)
              <input
                type="number"
                min={1}
                value={newOrder.deliveryFeeNaira}
                onChange={(event) =>
                  setNewOrder((prev) => ({
                    ...prev,
                    deliveryFeeNaira: Number(event.target.value)
                  }))
                }
                required
              />
            </label>
          </div>
          <label>
            Pickup Address
            <input
              value={newOrder.pickupAddress}
              onChange={(event) =>
                setNewOrder((prev) => ({ ...prev, pickupAddress: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Dropoff Address
            <input
              value={newOrder.dropoffAddress}
              onChange={(event) =>
                setNewOrder((prev) => ({ ...prev, dropoffAddress: event.target.value }))
              }
              required
            />
          </label>
          <label>
            Item Description (optional)
            <input
              value={newOrder.itemDescription}
              onChange={(event) =>
                setNewOrder((prev) => ({ ...prev, itemDescription: event.target.value }))
              }
            />
          </label>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Order"}
          </button>
        </form>
      </div>

      {error ? <p style={{ color: "#ff8f8f" }}>{error}</p> : null}
      {statusMessage ? <p style={{ color: "#8fffaa" }}>{statusMessage}</p> : null}

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Orders ({orderCount})</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={statusFilter}
              onChange={async (event) => {
                const value = event.target.value;
                setStatusFilter(value);
                await loadOrders(value);
              }}
            >
              <option value="all">all</option>
              <option value="posted_to_job_board">posted_to_job_board</option>
              <option value="escalated">escalated</option>
              <option value="refunded">refunded</option>
              <option value="delivered">delivered</option>
            </select>
            <button
              className="btn"
              type="button"
              onClick={async () => {
                await loadOrders(statusFilter);
                const statusData = await fetchAutomationStatus();
                setAutomation(statusData.automation);
              }}
              disabled={loading}
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Status</th>
              <th>Fee (NGN)</th>
              <th>Pickup</th>
              <th>Dropoff</th>
              <th>Automation</th>
              <th>Update Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>{order.id.slice(0, 8)}...</td>
                <td>{order.category}</td>
                <td>{order.status}</td>
                <td>{(order.deliveryFeeKobo / 100).toLocaleString("en-NG")}</td>
                <td>{order.pickupAddress}</td>
                <td>{order.dropoffAddress}</td>
                <td>
                  {order.status === "escalated" || order.status === "refunded" ? (
                    <span className="badge">Auto-handled</span>
                  ) : (
                    <span className="muted">-</span>
                  )}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select
                      value={statusChoice[order.id] ?? ""}
                      onChange={(event) =>
                        setStatusChoice((prev) => ({
                          ...prev,
                          [order.id]: event.target.value
                        }))
                      }
                    >
                      <option value="">Select</option>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <button className="btn" type="button" onClick={() => onUpdateStatus(order.id)}>
                      Update
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!orders.length && !error ? (
              <tr>
                <td colSpan={8} className="muted">
                  No orders yet. Use the create form above to add the first order.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
