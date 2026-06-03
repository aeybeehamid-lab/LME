"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchFinanceSummary, formatNairaFromKobo } from "../lib/api";

export default function OverviewPage() {
  const [summary, setSummary] = useState<Awaited<
    ReturnType<typeof fetchFinanceSummary>
  >["summary"] | null>(null);

  useEffect(() => {
    fetchFinanceSummary()
      .then((data) => setSummary(data.summary))
      .catch(() => setSummary(null));
  }, []);

  return (
    <section>
      <h1 style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
        Admin Overview
      </h1>
      <p className="muted">
        Web-first command center for orders, finance, riders, and escalations.
      </p>

      {summary ? (
        <div className="grid" style={{ marginTop: 20 }}>
          <article className="card">
            <span className="badge">Live</span>
            <h3>Revenue</h3>
            <p style={{ fontSize: 22 }}>{formatNairaFromKobo(summary.moneyInKobo)}</p>
            <p className="muted">Customer payments collected</p>
          </article>
          <article className="card">
            <h3>Active orders</h3>
            <p style={{ fontSize: 22 }}>{summary.activeOrders}</p>
            <p className="muted">
              {(summary.ordersByStatus.escalated ?? 0) > 0
                ? `${summary.ordersByStatus.escalated} escalated — needs action`
                : "No escalations right now"}
            </p>
          </article>
          <article className="card">
            <h3>Delivered</h3>
            <p style={{ fontSize: 22 }}>{summary.deliveredCount}</p>
            <p className="muted">Completed deliveries</p>
          </article>
        </div>
      ) : null}

      <div className="grid" style={{ marginTop: 20 }}>
        <article className="card">
          <span className="badge">Live</span>
          <h3>
            <Link href="/orders">Orders</Link>
          </h3>
          <p className="muted">Create orders, assign riders, manage escalations.</p>
        </article>
        <article className="card">
          <h3>
            <Link href="/finance">Money Flow</Link>
          </h3>
          <p className="muted">Track revenue, commissions, refunds, and transactions.</p>
        </article>
        <article className="card">
          <h3>
            <Link href="/riders">Rider Ops</Link>
          </h3>
          <p className="muted">Manage riders, bikes, and online status.</p>
        </article>
      </div>
    </section>
  );
}
