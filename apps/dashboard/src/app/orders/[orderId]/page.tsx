"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  fetchOrderById,
  fetchOrderEvents,
  fetchRiders,
  updateOrderStatus
} from "../../../lib/api";
import { Toast } from "../../../components/Toast";

type OrderDetail = {
  id: string;
  category: string;
  status: string;
  customerId: string;
  customerName?: string;
  riderId?: string;
  riderName?: string;
  deliveryFeeKobo: number;
  urgentMultiplier: number;
  pickupAddress: string;
  dropoffAddress: string;
  itemDescription?: string;
  escalatedAt?: string;
  deliveredAt?: string;
  riderCommissionKobo?: number;
  lmeRevenueKobo?: number;
  createdAt: string;
  updatedAt: string;
};

type OrderEvent = {
  id: string;
  fromStatus?: string;
  toStatus: string;
  actorUserId?: string;
  reason?: string;
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

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [riders, setRiders] = useState<Array<{ id: string; name: string; isOnline: boolean }>>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedRiderId, setSelectedRiderId] = useState("");
  const [nextStatus, setNextStatus] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [orderRes, eventsRes] = await Promise.all([
        fetchOrderById(orderId),
        fetchOrderEvents(orderId)
      ]);
      const o = orderRes.order as OrderDetail;
      setOrder(o);
      setEvents(eventsRes.events as OrderEvent[]);
      if (o.riderId) setSelectedRiderId(o.riderId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load order");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    fetchRiders()
      .then((data) =>
        setRiders(
          data.riders.map((r) => ({ id: r.id, name: r.name, isOnline: r.isOnline }))
        )
      )
      .catch(() => setRiders([]));
  }, [orderId]);

  async function assignRider(reason: string) {
    if (!selectedRiderId) {
      setError("Select a rider before assigning.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await updateOrderStatus(orderId, {
        toStatus: "rider_assigned",
        riderId: selectedRiderId,
        reason
      });
      setMessage("Rider assigned.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assign failed");
    } finally {
      setBusy(false);
    }
  }

  async function applyStatus() {
    if (!nextStatus) {
      setError("Select a status.");
      return;
    }
    if (nextStatus === "rider_assigned" && !selectedRiderId) {
      setError("Select a rider before assigning.");
      return;
    }
    if (nextStatus === "refunded" || nextStatus === "cancelled") {
      const ok = window.confirm(`Confirm ${nextStatus} for this order?`);
      if (!ok) return;
    }

    setBusy(true);
    setError("");
    setMessage("");
    try {
      await updateOrderStatus(orderId, {
        toStatus: nextStatus as (typeof statusOptions)[number],
        reason: "Updated from order detail page",
        riderId: nextStatus === "rider_assigned" ? selectedRiderId : undefined
      });
      setMessage(`Status updated to ${nextStatus}.`);
      setNextStatus("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section>
        <p className="muted">Loading order...</p>
      </section>
    );
  }

  if (!order) {
    return (
      <section>
        <p className="muted">Order not found.</p>
        <Link href="/orders">Back to orders</Link>
      </section>
    );
  }

  const canDispatch =
    order.status === "posted_to_job_board" || order.status === "escalated";

  return (
    <section>
      <p>
        <Link href="/orders">← Back to orders</Link>
      </p>
      <h1>Order {order.id.slice(0, 8)}...</h1>
      <p className="muted">
        {order.category} · {order.status}
      </p>

      {error ? (
        <Toast variant="error" onDismiss={() => setError("")}>
          {error}
        </Toast>
      ) : null}
      {message ? (
        <Toast variant="success" onDismiss={() => setMessage("")}>
          {message}
        </Toast>
      ) : null}

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Details</h3>
        <div className="grid">
          <div>
            <strong>Customer</strong>
            <p className="muted">{order.customerName ?? order.customerId.slice(0, 8)}</p>
          </div>
          <div>
            <strong>Rider</strong>
            <p className="muted">
              {order.riderName ?? (order.riderId ? order.riderId.slice(0, 8) : "Unassigned")}
            </p>
          </div>
          <div>
            <strong>Fee (NGN)</strong>
            <p className="muted">{(order.deliveryFeeKobo / 100).toLocaleString("en-NG")}</p>
          </div>
          <div>
            <strong>Urgent multiplier</strong>
            <p className="muted">{order.urgentMultiplier}</p>
          </div>
          <div>
            <strong>Rider commission (NGN)</strong>
            <p className="muted">
              {order.riderCommissionKobo
                ? (order.riderCommissionKobo / 100).toLocaleString("en-NG")
                : "-"}
            </p>
          </div>
          <div>
            <strong>LME revenue (NGN)</strong>
            <p className="muted">
              {order.lmeRevenueKobo ? (order.lmeRevenueKobo / 100).toLocaleString("en-NG") : "-"}
            </p>
          </div>
        </div>
        <p style={{ marginTop: 12 }}>
          <strong>Pickup:</strong> {order.pickupAddress}
        </p>
        <p>
          <strong>Dropoff:</strong> {order.dropoffAddress}
        </p>
        {order.itemDescription ? (
          <p>
            <strong>Item:</strong> {order.itemDescription}
          </p>
        ) : null}
        <p className="muted" style={{ marginTop: 8 }}>
          Created {order.createdAt}
          {order.escalatedAt ? ` · Escalated ${order.escalatedAt}` : ""}
          {order.deliveredAt ? ` · Delivered ${order.deliveredAt}` : ""}
        </p>
      </div>

      {canDispatch ? (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Assign rider</h3>
          <p className="muted" style={{ marginTop: 0 }}>
            {order.status === "posted_to_job_board"
              ? "Dispatch this job from the open board."
              : "Manual assignment for escalated order."}
          </p>
          <select
            value={selectedRiderId}
            onChange={(e) => setSelectedRiderId(e.target.value)}
            disabled={busy}
          >
            <option value="">Select rider</option>
            {riders.map((rider) => (
              <option key={rider.id} value={rider.id}>
                {rider.name} {rider.isOnline ? "(online)" : "(offline)"}
              </option>
            ))}
          </select>
          <button
            className="btn"
            type="button"
            style={{ marginTop: 12 }}
            disabled={busy}
            onClick={() =>
              assignRider(
                order.status === "escalated"
                  ? "Assigned by admin from escalated queue"
                  : "Assigned by admin from job board"
              )
            }
          >
            {busy ? "Working..." : "Assign rider"}
          </button>
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Update status</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <select value={nextStatus} onChange={(e) => setNextStatus(e.target.value)} disabled={busy}>
            <option value="">Select status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {nextStatus === "rider_assigned" ? (
            <select
              value={selectedRiderId}
              onChange={(e) => setSelectedRiderId(e.target.value)}
              disabled={busy}
            >
              <option value="">Select rider</option>
              {riders.map((rider) => (
                <option key={rider.id} value={rider.id}>
                  {rider.name}
                </option>
              ))}
            </select>
          ) : null}
          <button className="btn" type="button" onClick={applyStatus} disabled={busy}>
            {busy ? "Updating..." : "Apply"}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3>Timeline</h3>
        {!events.length ? (
          <p className="muted">No events yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>From</th>
                <th>To</th>
                <th>Reason</th>
                <th>Actor</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>{event.createdAt}</td>
                  <td>{event.fromStatus ?? "-"}</td>
                  <td>{event.toStatus}</td>
                  <td>{event.reason ?? "-"}</td>
                  <td>{event.actorUserId?.slice(0, 8) ?? "system"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
