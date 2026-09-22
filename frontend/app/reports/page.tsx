"use client";

import { useCallback, useEffect, useState } from "react";
import { BackNav } from "@/components/common/BackNav";
import { CompletionDonut } from "@/components/reports/CompletionDonut";
import { StatCard } from "@/components/reports/StatCard";
import { StatusBars } from "@/components/reports/StatusBars";
import { BACKEND_BASE_URL } from "@/lib/constants";
import { tasksSummarySchema } from "@/lib/schemas";
import type { TasksSummary } from "@/types/api";

export default function ReportsPage() {
  const [summary, setSummary] = useState<TasksSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReports = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch(`${BACKEND_BASE_URL}/reports/tasks-summary`, { signal });
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
      <BackNav />

      <header className="card card-pad">
        <h1 className="page-title">Reports</h1>
        <p className="muted" style={{ margin: 0 }}>
          Task totals, status breakdown, and recent activity.
        </p>
      </header>

      {loading ? (
        <section className="card card-pad">
          <p role="status" className="muted" style={{ margin: 0 }}>
            Loading reports…
          </p>
        </section>
      ) : error ? (
        <section className="card card-pad">
          <div role="alert">
            <p className="error-text" style={{ marginTop: 0, marginBottom: "0.75rem" }}>{error}</p>
            <button type="button" className="button" onClick={handleRetry}>
              Retry
            </button>
          </div>
        </section>
      ) : summary && summary.total === 0 ? (
        <section className="card card-pad">
          <p className="muted" style={{ margin: 0 }}>
            No tasks yet. Create your first task to see reports.
          </p>
        </section>
      ) : summary ? (
        <>
          <section className="stats-grid">
            <StatCard label="Total tasks" value={summary.total} tone="info" />
            <StatCard label="Recent activity" value={summary.recentActivityCount} hint="Logged events" />
          </section>

          <section className="card card-pad">
            <h2 className="section-title">Completion overview</h2>
            <div className="analytics-grid">
              <CompletionDonut done={summary.byStatus.done} total={summary.total} />
              <StatusBars byStatus={summary.byStatus} total={summary.total} />
            </div>
          </section>

          <section className="card card-pad">
            <h2 className="section-title">
              Tasks by status
            </h2>
            <section className="stats-grid">
              <StatCard label="To do" value={summary.byStatus.todo} tone="todo" />
              <StatCard
                label="In progress"
                value={summary.byStatus["in-progress"]}
                hint="Always 0 — tasks only track completed"
                tone="info"
              />
              <StatCard label="Done" value={summary.byStatus.done} tone="done" />
            </section>
          </section>
        </>
      ) : null}
    </main>
  );
}
