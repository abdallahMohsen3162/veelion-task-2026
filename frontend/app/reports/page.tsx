"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { StatCard } from "@/components/reports/StatCard";
import { tasksSummarySchema } from "@/lib/schemas";
import type { TasksSummary } from "@/types/api";

export default function ReportsPage() {
  const [summary, setSummary] = useState<TasksSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch("/api/reports", { signal });
      if (!response.ok) {
        let message = `Request failed with ${response.status}`;
        try {
          const body = (await response.json()) as { error?: { message?: string } };
          if (body.error?.message) {
            message = body.error.message;
          }
        } catch {
          // keep fallback
        }
        throw new Error(message);
      }

      const parsed = tasksSummarySchema.safeParse(await response.json());
      if (!parsed.success) {
        throw new Error("Reports response changed shape.");
      }

      if (!signal.aborted) {
        setSummary(parsed.data);
        setError(null);
      }
    } catch (err) {
      if (!signal.aborted) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        setSummary(null);
        setError(err instanceof Error ? err.message : "Failed to load reports.");
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadReports(controller.signal);
    return () => {
      controller.abort();
    };
  }, [loadReports]);

  const handleRetry = () => {
    const controller = new AbortController();
    loadReports(controller.signal);
  };

  return (
    <main className="stack">
      <nav>
        <Link href="/" className="button">
          Back
        </Link>
      </nav>

      <header className="card" style={{ padding: "1rem" }}>
        <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Reports</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Task totals, status breakdown, and recent activity.
        </p>
      </header>

      {loading ? (
        <section className="card" style={{ padding: "1rem" }}>
          <p role="status" style={{ margin: 0, color: "var(--muted)" }}>
            Loading reports…
          </p>
        </section>
      ) : error ? (
        <section className="card" style={{ padding: "1rem" }}>
          <div role="alert">
            <p style={{ color: "#b42318", marginTop: 0, marginBottom: "0.75rem" }}>{error}</p>
            <button type="button" className="button" onClick={handleRetry}>
              Retry
            </button>
          </div>
        </section>
      ) : summary && summary.total === 0 ? (
        <section className="card" style={{ padding: "1rem" }}>
          <p style={{ margin: 0, color: "var(--muted)" }}>
            No tasks yet. Create your first task to see reports.
          </p>
        </section>
      ) : summary ? (
        <>
          <section
            style={{
              display: "grid",
              gap: "0.75rem",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
            }}
          >
            <StatCard label="Total tasks" value={summary.total} />
            <StatCard label="Recent activity" value={summary.recentActivityCount} hint="Logged events" />
          </section>

          <section className="card" style={{ padding: "1rem" }}>
            <h2 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1.05rem" }}>
              Tasks by status
            </h2>
            <section
              style={{
                display: "grid",
                gap: "0.75rem",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              }}
            >
              <StatCard label="To do" value={summary.byStatus.todo} />
              <StatCard
                label="In progress"
                value={summary.byStatus["in-progress"]}
                hint="Always 0 — tasks only track completed"
              />
              <StatCard label="Done" value={summary.byStatus.done} />
            </section>
          </section>
        </>
      ) : null}
    </main>
  );
}
