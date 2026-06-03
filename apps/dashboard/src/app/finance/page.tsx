"use client";

import { useEffect, useState } from "react";
import {
  fetchFinanceSummary,
  fetchFinanceTransactions,
  formatNairaFromKobo
} from "../../lib/api";
import { Toast } from "../../components/Toast";

export default function FinancePage() {
  const [summary, setSummary] = useState<Awaited<
    ReturnType<typeof fetchFinanceSummary>
  >["summary"] | null>(null);
  const [transactions, setTransactions] = useState<
    Awaited<ReturnType<typeof fetchFinanceTransactions>>["transactions"]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, txRes] = await Promise.all([
        fetchFinanceSummary(),
        fetchFinanceTransactions(30)
      ]);
      setSummary(summaryRes.summary);
      setTransactions(txRes.transactions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load finance data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <section>
      <h1>Finance</h1>
      <p className="muted">Money in, rider commissions (25%), refunds, and net from live data.</p>

      {error ? (
        <Toast variant="error" onDismiss={() => setError("")}>
          {error}
        </Toast>
      ) : null}

      <div style={{ marginTop: 12 }}>
        <button className="btn" type="button" onClick={load} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading && !summary ? (
        <p className="muted" style={{ marginTop: 16 }}>
          Loading...
        </p>
      ) : summary ? (
        <>
          <div className="grid" style={{ marginTop: 16 }}>
            <article className="card">
              <h3>Money In</h3>
              <p className="stat-value">{formatNairaFromKobo(summary.moneyInKobo)}</p>
              <p className="muted">
                {summary.payments.success} successful Paystack payments
              </p>
            </article>
            <article className="card">
              <h3>Rider Commissions</h3>
              <p className="stat-value">
                {formatNairaFromKobo(summary.riderCommissionsKobo)}
              </p>
              <p className="muted">
                25% of {summary.deliveredCount} delivered order fees
              </p>
            </article>
            <article className="card">
              <h3>Refunds</h3>
              <p className="stat-value">
                {formatNairaFromKobo(summary.refundedKobo)}
              </p>
              <p className="muted">Refunded payment volume</p>
            </article>
            <article className="card">
              <h3>Net (estimate)</h3>
              <p className="stat-value">
                {formatNairaFromKobo(summary.netKobo)}
              </p>
              <p className="muted">Money in − commissions − refunds</p>
            </article>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Operations snapshot</h3>
            <div className="grid">
              <div>
                <strong>Active deliveries</strong>
                <p className="muted">{summary.activeOrders}</p>
              </div>
              <div>
                <strong>Pending payments</strong>
                <p className="muted">{summary.payments.pending}</p>
              </div>
              <div>
                <strong>Escalated</strong>
                <p className="muted">{summary.ordersByStatus.escalated ?? 0}</p>
              </div>
              <div>
                <strong>On job board</strong>
                <p className="muted">{summary.ordersByStatus.posted_to_job_board ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3>Recent transactions</h3>
            {!transactions.length ? (
              <p className="muted">No payments yet. Initialize payment on an order to see entries.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Reference</th>
                    <th>Order</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>{tx.createdAt}</td>
                      <td>{tx.paystackReference}</td>
                      <td>{tx.orderId.slice(0, 8)}...</td>
                      <td>{formatNairaFromKobo(tx.amountKobo)}</td>
                      <td>{tx.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}
    </section>
  );
}
