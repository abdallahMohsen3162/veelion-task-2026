"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { ActivityLog, PaginatedActivityResponse, PaginationMeta } from "@/types/api";
import { activityPaginatedResponseSchema } from "@/lib/schemas";

function formatTimestamp(value: string) {
  return new Date(value).toLocaleString();
}

type ActivitySort = "when" | "action";
type SortOrder = "asc" | "desc";

const DEFAULT_META: PaginationMeta = { page: 1, limit: 10, total: 0, totalPages: 0 };

async function fetchActivityLogs(
  params: { search: string; sort: ActivitySort; order: SortOrder; page: number; limit: number },
  signal: AbortSignal
): Promise<PaginatedActivityResponse> {
  const query = new URLSearchParams();
  if (params.search.trim()) {
    query.set("search", params.search.trim());
  }
  query.set("sort", params.sort);
  query.set("order", params.order);
  query.set("page", String(params.page));
  query.set("limit", String(params.limit));

  const response = await fetch(`/api/activity?${query.toString()}`, { signal });

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

  const parsed = activityPaginatedResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error("Activity response changed shape.");
  }
  return parsed.data;
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_META);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ActivitySort>("when");
  const [order, setOrder] = useState<SortOrder>("desc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivity = useCallback(
    async (signal: AbortSignal) => {
      setLoading(true);
      try {
        const result = await fetchActivityLogs({ search, sort, order, page, limit }, signal);
        if (!signal.aborted) {
          setLogs(result.data);
          setMeta(result.meta);
          setError(null);
        }
      } catch (err) {
        if (!signal.aborted) {
          if (err instanceof Error && err.name === "AbortError") {
            return;
          }
          setLogs([]);
          setError(err instanceof Error ? err.message : "Failed to load activity.");
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    },
    [search, sort, order, page, limit]
  );

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

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  return (
    <main className="stack">
      <nav>
        <Link href="/" className="button">
          Back
        </Link>
      </nav>

      <section className="card" style={{ padding: "1rem", display: "grid", gap: "0.75rem" }}>
        <h1 style={{ marginTop: 0, marginBottom: 0 }}>Activity Feed</h1>

        <div>
          <label htmlFor="activity-search" style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600 }}>
            Search activity
          </label>
          <input
            id="activity-search"
            type="search"
            className="input"
            placeholder="Search by action or info"
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <div>
            <label htmlFor="activity-sort" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>
              Sort by
            </label>
            <select
              id="activity-sort"
              className="input"
              value={sort}
              onChange={(event) => {
                setSort(event.target.value as ActivitySort);
                setPage(1);
              }}
            >
              <option value="when">Time</option>
              <option value="action">Action</option>
            </select>
          </div>

          <div>
            <label htmlFor="activity-order" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>
              Order
            </label>
            <select
              id="activity-order"
              className="input"
              value={order}
              onChange={(event) => {
                setOrder(event.target.value as SortOrder);
                setPage(1);
              }}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>

          <div>
            <label htmlFor="activity-limit" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>
              Per page
            </label>
            <select
              id="activity-limit"
              className="input"
              value={String(limit)}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card" style={{ padding: "1rem" }}>
        <small style={{ color: "var(--muted)" }}>
          Total: {meta.total} | Page {meta.page} of {Math.max(meta.totalPages, 1)}
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
        ) : logs.length === 0 ? (
          <p style={{ color: "var(--muted)", margin: 0 }}>
            {search ? "No activity matches your search." : "No activity yet."}
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
            {logs.map((item) => (
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

      {!loading && !error && meta.totalPages > 1 ? (
        <section
          className="card"
          style={{ padding: "0.8rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}
          aria-label="Activity pagination"
        >
          <button
            type="button"
            className="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <small style={{ color: "var(--muted)" }}>
            Page {meta.page} of {meta.totalPages}
          </small>
          <button
            type="button"
            className="button"
            disabled={page >= meta.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </section>
      ) : null}
    </main>
  );
}
