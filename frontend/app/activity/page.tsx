"use client";

import { useCallback, useEffect, useState } from "react";
import { BackNav } from "@/components/common/BackNav";
import { SortOrderToggle } from "@/components/common/SortOrderToggle";
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
      <BackNav />

      <section className="card card-pad form-grid">
        <h1 className="page-title" style={{ marginBottom: 0 }}>Activity Feed</h1>

        <div>
          <label htmlFor="activity-search" className="form-label">
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

        <div className="controls-row">
          <div>
            <label htmlFor="activity-sort" className="form-label">
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
            <label htmlFor="activity-order" className="form-label">
              Order
            </label>
            <SortOrderToggle
              id="activity-order"
              value={order}
              onChange={(value) => {
                setOrder(value);
                setPage(1);
              }}
              ascLabel="Oldest first"
              descLabel="Newest first"
            />
          </div>

          <div>
            <label htmlFor="activity-limit" className="form-label">
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

      <section className="card card-pad">
        <small className="muted">
          Total: {meta.total} | Page {meta.page} of {Math.max(meta.totalPages, 1)}
        </small>
      </section>

      <section className="card card-pad">
        {loading ? (
          <p role="status" className="muted" style={{ margin: 0 }}>
            Loading activity…
          </p>
        ) : error ? (
          <div role="alert">
            <p className="error-text" style={{ marginTop: 0, marginBottom: "0.75rem" }}>{error}</p>
            <button type="button" className="button" onClick={handleRetry}>
              Retry
            </button>
          </div>
        ) : logs.length === 0 ? (
          <p className="muted" style={{ margin: 0 }}>
            {search ? "No activity matches your search." : "No activity yet."}
          </p>
        ) : (
          <ul className="list-reset">
            {logs.map((item) => (
              <li key={item.id} className="row-divider">
                <div style={{ fontWeight: 600 }}>{item.action || "(no action)"}</div>
                <div>{item.info || "(no info)"}</div>
                <small className="muted">
                  {formatTimestamp(item.when)}
                </small>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!loading && !error && meta.totalPages > 1 ? (
        <section className="card card-pad pagination" aria-label="Activity pagination">
          <button
            type="button"
            className="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <small className="muted">
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
