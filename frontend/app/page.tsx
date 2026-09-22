import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <header className="stack" style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0 }}>VeeLion Frontend Assessment</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Tasks, activity, and reports built against the provided backend.
        </p>
      </header>

      <section className="stack" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <Link href="/tasks" className="card" style={{ padding: "1rem", display: "block" }}>
          <h2 style={{ marginTop: 0, marginBottom: "0.25rem" }}>Task Dashboard</h2>
          <p style={{ margin: 0, color: "var(--muted)" }}>Search, filter, and update tasks.</p>
        </Link>

        <Link href="/activity" className="card" style={{ padding: "1rem", display: "block" }}>
          <h2 style={{ marginTop: 0, marginBottom: "0.25rem" }}>Activity Feed</h2>
          <p style={{ margin: 0, color: "var(--muted)" }}>Browse recent activity logs.</p>
        </Link>

        <Link href="/reports" className="card" style={{ padding: "1rem", display: "block" }}>
          <h2 style={{ marginTop: 0, marginBottom: "0.25rem" }}>Reports</h2>
          <p style={{ margin: 0, color: "var(--muted)" }}>Totals and status breakdown.</p>
        </Link>
      </section>
    </main>
  );
}
