"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ActivityLog } from "@/types/api";

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

function filterActivityLogs(items: ActivityLog[], text: string) {
  const query = text.trim().toLowerCase();
  if (!query) {
    return items;
  }

  return items.filter(
    (item) =>
      (item.action || "").toLowerCase().includes(query) ||
      (item.info || "").toLowerCase().includes(query)
  );
}

async function fetchActivityLogs(signal: AbortSignal): Promise<ActivityLog[]> {
  const response = await fetch("/api/activity", { signal });

  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      if (body.error?.message) {
        message = body.error.message;
      }
    } catch {
      // keep fallback message when body is not JSON
    }
    throw new Error(message);
  }

  const logs = (await response.json()) as ActivityLog[];
  return Array.isArray(logs) ? logs : [];
}

export default function ActivityPage() {
  const [allActivity, setAllActivity] = useState<ActivityLog[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivity = useCallback(async (signal: AbortSignal) => {
    setLoading(true);
    try {
      const logs = await fetchActivityLogs(signal);
      if (!signal.aborted) {
        setAllActivity(logs);
        setError(null);
      }
    } catch (err) {
      if (!signal.aborted) {
        setAllActivity([]);
        setError(err instanceof Error ? err.message : "Failed to load activity.");
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadActivity(controller.signal);

    return () => {
      controller.abort();
    };
  }, [loadActivity]);

  const handleRetry = () => {
    const controller = new AbortController();
    loadActivity(controller.signal);
  };

  const shownActivity = useMemo(
    () => filterActivityLogs(allActivity, query),
    [allActivity, query]
  );

  return (
    <main className="stack">
      <nav>
        <Link href="/" className="button">
          Back
        </Link>
      </nav>

      <section className="card" style={{ padding: "1rem" }}>
        <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Activity Feed</h1>

        <label htmlFor="activity-search" style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600 }}>
          Search activity
        </label>
        <input
          id="activity-search"
          type="search"
          className="input"
          placeholder="Search by action or info"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </section>

      <section className="card" style={{ padding: "1rem" }}>
        <small style={{ color: "var(--muted)" }}>
          Total: {allActivity.length} | Visible: {shownActivity.length}
        </small>
      </section>

      <section className="card" style={{ padding: "1rem" }}>
        {loading ? (
          <p role="status" style={{ color: "var(--muted)", margin: 0 }}>
            Loading activity…
          </p>
        ) : error ? (
          <div role="alert">
            <p style={{ color: "#b42318", marginTop: 0, marginBottom: "0.75rem" }}>{error}</p>
            <button type="button" className="button" onClick={handleRetry}>
              Retry
            </button>
          </div>
        ) : shownActivity.length === 0 ? (
          <p style={{ color: "var(--muted)", margin: 0 }}>
            {query ? "No activity matches your search." : "No activity yet."}
          </p>
        ) : (
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
              display: "grid",
              gap: "0.7rem",
            }}
          >
            {shownActivity.map((item) => (
              <li
                key={item.id}
                style={{
                  borderBottom: "1px solid var(--border)",
                  paddingBottom: "0.6rem",
                }}
              >
                <div style={{ fontWeight: 600 }}>{item.action || "(no action)"}</div>
                <div>{item.info || "(no info)"}</div>
                <small style={{ color: "var(--muted)" }}>
                  {formatTimestamp(item.when)}
                </small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
