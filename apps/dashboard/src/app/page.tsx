export default function OverviewPage() {
  return (
    <section>
      <h1 style={{ fontFamily: "Georgia, serif", fontStyle: "italic" }}>
        Admin Overview
      </h1>
      <p className="muted">
        Web-first command center for orders, finance, riders, and escalations.
      </p>

      <div className="grid" style={{ marginTop: 20 }}>
        <article className="card">
          <span className="badge">Live</span>
          <h3>Orders Feed</h3>
          <p className="muted">Monitor active and escalated deliveries.</p>
        </article>
        <article className="card">
          <h3>Money Flow</h3>
          <p className="muted">Track revenue, commissions, and refunds.</p>
        </article>
        <article className="card">
          <h3>Rider Ops</h3>
          <p className="muted">Manage riders, assignments, and performance.</p>
        </article>
      </div>
    </section>
  );
}
