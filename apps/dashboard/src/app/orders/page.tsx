"use client";

import { useEffect, useState } from "react";
import { fetchOrders } from "../../lib/api";

type OrderRow = {
  id: string;
  category: string;
  status: string;
  deliveryFeeKobo: number;
  pickupAddress: string;
  dropoffAddress: string;
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchOrders()
      .then((data) => setOrders(data.orders as OrderRow[]))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load orders")
      );
  }, []);

  return (
    <section>
      <h1>Orders</h1>
      <p className="muted">Live order feed for executives and operations.</p>

      {error ? <p style={{ color: "#ff8f8f" }}>{error}</p> : null}

      <div className="card" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Status</th>
              <th>Fee (NGN)</th>
              <th>Pickup</th>
              <th>Dropoff</th>
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
              </tr>
            ))}
            {!orders.length && !error ? (
              <tr>
                <td colSpan={6} className="muted">
                  No orders yet. Create one via API to populate this table.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
