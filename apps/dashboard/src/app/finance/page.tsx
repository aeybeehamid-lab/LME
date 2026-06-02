export default function FinancePage() {
  return (
    <section>
      <h1>Finance</h1>
      <p className="muted">
        Sprint 2 will connect Paystack transactions, rider commissions, and net profit.
      </p>
      <div className="grid" style={{ marginTop: 16 }}>
        <article className="card">
          <h3>Money In</h3>
          <p className="muted">Customer payments via Paystack.</p>
        </article>
        <article className="card">
          <h3>Money Out</h3>
          <p className="muted">Rider commissions (25%) and operating costs.</p>
        </article>
        <article className="card">
          <h3>Net</h3>
          <p className="muted">Revenue minus commissions and refunds.</p>
        </article>
      </div>
    </section>
  );
}
