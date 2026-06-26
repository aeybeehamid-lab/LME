"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Complaint,
  fetchComplaints,
  markComplaintInReview,
  resolveComplaint
} from "../../lib/api";
import { Toast } from "../../components/Toast";

const statusFilters = ["all", "open", "in_review", "resolved"] as const;

const statusColor: Record<string, string> = {
  open: "#c0392b",
  in_review: "#d68910",
  resolved: "#27ae60"
};

export default function ComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [filter, setFilter] = useState<string>("open");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [resolutionNote, setResolutionNote] = useState<Record<string, string>>({});

  async function load(status: string) {
    setLoading(true);
    setError("");
    try {
      const data = await fetchComplaints(status === "all" ? undefined : status);
      setComplaints(data.complaints);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load(filter);
  }, [filter]);

  async function onReview(id: string) {
    setBusy(id);
    setError("");
    try {
      await markComplaintInReview(id);
      setMessage("Marked as in review.");
      await load(filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update complaint");
    } finally {
      setBusy(null);
    }
  }

  async function onResolve(id: string) {
    const note = resolutionNote[id]?.trim();
    if (!note) {
      setError("Enter a resolution note before resolving.");
      return;
    }
    setBusy(id);
    setError("");
    try {
      await resolveComplaint(id, note);
      setMessage("Complaint resolved.");
      setResolutionNote((prev) => ({ ...prev, [id]: "" }));
      setExpanded(null);
      await load(filter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve complaint");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section>
      <h1>Complaints</h1>
      <p className="muted" style={{ marginTop: 0 }}>
        Customer complaints queue — review and resolve issues.
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

      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {statusFilters.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: `1px solid ${filter === s ? "var(--green-accent)" : "var(--border)"}`,
              background: filter === s ? "var(--green-accent)" : "transparent",
              color: filter === s ? "#000" : "var(--muted)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              textTransform: "capitalize"
            }}
          >
            {s.replace("_", " ")}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="muted">Loading complaints...</p>
      ) : !complaints.length ? (
        <p className="muted">No {filter === "all" ? "" : filter} complaints.</p>
      ) : (
        complaints.map((c) => (
          <div
            key={c.id}
            className="card"
            style={{
              marginBottom: 12,
              borderLeft: `3px solid ${statusColor[c.status] ?? "#555"}`
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12
              }}
            >
              <div>
                <strong>{c.subject}</strong>
                <p className="muted" style={{ margin: "4px 0 0" }}>
                  {c.customerName ?? c.customerId.slice(0, 8)} ·{" "}
                  <Link
                    href={`/orders/${c.orderId}`}
                    style={{ color: "var(--green-accent)" }}
                  >
                    Order {c.orderId.slice(0, 8)}...
                  </Link>{" "}
                  · {c.category} ·{" "}
                  {new Date(c.createdAt).toLocaleDateString("en-NG")}
                </p>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  padding: "3px 10px",
                  borderRadius: 999,
                  background: `${statusColor[c.status]}22`,
                  color: statusColor[c.status],
                  border: `1px solid ${statusColor[c.status]}55`,
                  whiteSpace: "nowrap",
                  textTransform: "capitalize"
                }}
              >
                {c.status.replace("_", " ")}
              </span>
            </div>

            <p style={{ margin: "10px 0 0", fontSize: 13, lineHeight: 1.6 }}>
              {c.description}
            </p>

            {c.resolutionNote ? (
              <p className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                <strong>Resolution:</strong> {c.resolutionNote}
              </p>
            ) : null}

            {c.status !== "resolved" ? (
              <div
                style={{
                  marginTop: 12,
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  alignItems: "flex-start"
                }}
              >
                {c.status === "open" ? (
                  <button
                    className="btn"
                    type="button"
                    disabled={busy === c.id}
                    onClick={() => onReview(c.id)}
                    style={{ fontSize: 12, padding: "6px 14px" }}
                  >
                    {busy === c.id ? "Working..." : "Mark in review"}
                  </button>
                ) : null}
                <button
                  className="btn"
                  type="button"
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  style={{
                    fontSize: 12,
                    padding: "6px 14px",
                    background: "transparent",
                    border: "1px solid var(--green-accent)",
                    color: "var(--green-accent)"
                  }}
                >
                  {expanded === c.id ? "Cancel" : "Resolve"}
                </button>
              </div>
            ) : null}

            {expanded === c.id ? (
              <div style={{ marginTop: 12 }}>
                <textarea
                  placeholder="Enter resolution note..."
                  value={resolutionNote[c.id] ?? ""}
                  onChange={(e) =>
                    setResolutionNote((prev) => ({
                      ...prev,
                      [c.id]: e.target.value
                    }))
                  }
                  rows={3}
                  style={{
                    width: "100%",
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--fg)",
                    padding: "10px 12px",
                    fontSize: 13,
                    resize: "vertical",
                    boxSizing: "border-box"
                  }}
                />
                <button
                  className="btn"
                  type="button"
                  disabled={busy === c.id}
                  onClick={() => onResolve(c.id)}
                  style={{ marginTop: 8, fontSize: 12, padding: "6px 14px" }}
                >
                  {busy === c.id ? "Resolving..." : "Submit resolution"}
                </button>
              </div>
            ) : null}
          </div>
        ))
      )}
    </section>
  );
}