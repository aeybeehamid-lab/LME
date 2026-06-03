"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createRider,
  fetchRiderAdminList,
  fetchRiderStats,
  formatNairaFromKobo,
  updateRider
} from "../../lib/api";
import { Toast } from "../../components/Toast";

type RiderRow = {
  id: string;
  name: string;
  phone: string;
  bikeId?: string;
  isOnline: boolean;
  isActive: boolean;
  joinDate: string;
  strikeCount: number;
};

export default function RidersPage() {
  const [riders, setRiders] = useState<RiderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [busyByRiderId, setBusyByRiderId] = useState<Record<string, boolean>>({});
  const [newRider, setNewRider] = useState({ name: "", phone: "+234", bikeId: "" });
  const [statsByRiderId, setStatsByRiderId] = useState<
    Record<string, { deliveryCount: number; totalEarningsKobo: number }>
  >({});

  const activeCount = useMemo(() => riders.filter((r) => r.isActive).length, [riders]);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchRiderAdminList();
      setRiders(data.riders as RiderRow[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load riders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      await createRider({
        name: newRider.name,
        phone: newRider.phone,
        bikeId: newRider.bikeId ? newRider.bikeId : undefined
      });
      setMessage("Rider created.");
      setNewRider({ name: "", phone: "+234", bikeId: "" });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create rider");
    } finally {
      setSubmitting(false);
    }
  }

  async function setOnline(riderId: string, isOnline: boolean) {
    setBusyByRiderId((p) => ({ ...p, [riderId]: true }));
    setError("");
    setMessage("");
    try {
      await updateRider(riderId, { isOnline });
      setMessage(`Rider ${riderId.slice(0, 8)} marked ${isOnline ? "online" : "offline"}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update rider");
    } finally {
      setBusyByRiderId((p) => ({ ...p, [riderId]: false }));
    }
  }

  async function saveBikeId(riderId: string, bikeId: string) {
    setBusyByRiderId((p) => ({ ...p, [riderId]: true }));
    setError("");
    setMessage("");
    try {
      await updateRider(riderId, { bikeId: bikeId.trim() ? bikeId.trim() : null });
      setMessage(`Bike ID updated for ${riderId.slice(0, 8)}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update rider");
    } finally {
      setBusyByRiderId((p) => ({ ...p, [riderId]: false }));
    }
  }

  async function loadStats(riderId: string) {
    setBusyByRiderId((p) => ({ ...p, [riderId]: true }));
    try {
      const data = await fetchRiderStats(riderId);
      setStatsByRiderId((prev) => ({
        ...prev,
        [riderId]: {
          deliveryCount: data.stats.deliveryCount,
          totalEarningsKobo: data.stats.totalEarningsKobo
        }
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load rider stats");
    } finally {
      setBusyByRiderId((p) => ({ ...p, [riderId]: false }));
    }
  }

  async function toggleActive(riderId: string, isActive: boolean) {
    const confirmed = window.confirm(
      isActive ? "Re-activate this rider?" : "Suspend this rider? They will lose access."
    );
    if (!confirmed) return;

    setBusyByRiderId((p) => ({ ...p, [riderId]: true }));
    setError("");
    setMessage("");
    try {
      await updateRider(riderId, { isActive });
      setMessage(`Rider ${riderId.slice(0, 8)} ${isActive ? "activated" : "suspended"}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update rider");
    } finally {
      setBusyByRiderId((p) => ({ ...p, [riderId]: false }));
    }
  }

  return (
    <section>
      <h1>Riders</h1>
      <p className="muted">
        Manage rider accounts (create, assign bike ID, online/offline, suspend). Active: {activeCount}
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
        <h3>Create Rider</h3>
        <form onSubmit={onCreate}>
          <div className="grid">
            <label>
              Name
              <input
                value={newRider.name}
                onChange={(e) => setNewRider((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </label>
            <label>
              Phone
              <input
                value={newRider.phone}
                onChange={(e) => setNewRider((p) => ({ ...p, phone: e.target.value }))}
                required
              />
            </label>
          </div>
          <label>
            Bike ID (optional)
            <input
              value={newRider.bikeId}
              onChange={(e) => setNewRider((p) => ({ ...p, bikeId: e.target.value }))}
            />
          </label>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "Creating..." : "Create Rider"}
          </button>
        </form>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Riders ({riders.length})</h3>
          <button className="btn" type="button" onClick={load} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Bike</th>
              <th>Online</th>
              <th>Active</th>
              <th>Join date</th>
              <th>Strikes</th>
              <th>Earnings</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {riders.map((r) => (
              <tr key={r.id}>
                <td>{r.id.slice(0, 8)}...</td>
                <td>{r.name}</td>
                <td>{r.phone}</td>
                <td>
                  <input
                    defaultValue={r.bikeId ?? ""}
                    placeholder="Bike ID"
                    disabled={Boolean(busyByRiderId[r.id])}
                    onBlur={(e) => saveBikeId(r.id, e.target.value)}
                  />
                </td>
                <td>{r.isOnline ? "online" : "offline"}</td>
                <td>{r.isActive ? "active" : "suspended"}</td>
                <td>{r.joinDate}</td>
                <td>{r.strikeCount}</td>
                <td>
                  {statsByRiderId[r.id] ? (
                    <span>
                      {formatNairaFromKobo(statsByRiderId[r.id].totalEarningsKobo)} (
                      {statsByRiderId[r.id].deliveryCount} trips)
                    </span>
                  ) : (
                    <button
                      className="btn"
                      type="button"
                      disabled={Boolean(busyByRiderId[r.id])}
                      onClick={() => loadStats(r.id)}
                    >
                      {busyByRiderId[r.id] ? "..." : "Load"}
                    </button>
                  )}
                </td>
                <td>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      className="btn"
                      type="button"
                      disabled={Boolean(busyByRiderId[r.id]) || !r.isActive}
                      onClick={() => setOnline(r.id, true)}
                    >
                      {busyByRiderId[r.id] ? "Working..." : "Online"}
                    </button>
                    <button
                      className="btn"
                      type="button"
                      disabled={Boolean(busyByRiderId[r.id]) || !r.isActive}
                      onClick={() => setOnline(r.id, false)}
                    >
                      {busyByRiderId[r.id] ? "Working..." : "Offline"}
                    </button>
                    <button
                      className="btn"
                      type="button"
                      disabled={Boolean(busyByRiderId[r.id])}
                      onClick={() => toggleActive(r.id, !r.isActive)}
                    >
                      {busyByRiderId[r.id] ? "Working..." : r.isActive ? "Suspend" : "Activate"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!riders.length && !error ? (
              <tr>
                <td colSpan={10} className="muted">
                  No riders yet. Create the first rider above.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
