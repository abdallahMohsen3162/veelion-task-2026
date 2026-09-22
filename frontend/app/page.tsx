import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <header className="stack" style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ margin: 0 }}>VeeLion Frontend Assessment</h1>
        <p className="muted" style={{ margin: 0 }}>
          Tasks, activity, and reports built against the provided backend.
        </p>
      </header>

      <section className="stats-grid">
        <Link href="/tasks" className="card card-pad">
          <h2 className="page-title">Task Dashboard</h2>
          <p className="muted" style={{ margin: 0 }}>Search, filter, and update tasks.</p>
        </Link>

        <Link href="/activity" className="card card-pad">
          <h2 className="page-title">Activity Feed</h2>
          <p className="muted" style={{ margin: 0 }}>Browse recent activity logs.</p>
        </Link>

        <Link href="/reports" className="card card-pad">
          <h2 className="page-title">Reports</h2>
          <p className="muted" style={{ margin: 0 }}>Totals and status breakdown.</p>
        </Link>
      </section>
    </main>
  );
}
