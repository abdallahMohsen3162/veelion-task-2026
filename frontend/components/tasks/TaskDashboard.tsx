"use client";

import { useCallback } from "react";
import { useTasks } from "@/hooks/useTasks";
import { StatusFilter } from "@/components/tasks/StatusFilter";
import { TaskList } from "@/components/tasks/TaskList";

export function TaskDashboard() {
  const {
    tasks,
    meta,
    filter,
    search,
    sort,
    order,
    page,
    limit,
    loading,
    refreshing,
    error,
    updatingTaskIds,
    setFilter,
    setSearch,
    setSort,
    setOrder,
    setPage,
    setLimit,
    fetchTasks,
    updateTaskStatus,
  } = useTasks();

  const handleToggle = useCallback(
    (taskId: string, nextCompleted: boolean) => {
      updateTaskStatus(taskId, nextCompleted);
    },
    [updateTaskStatus]
  );

  const isInitialFailure = !loading && error !== "" && tasks.length === 0;
  const showList = !loading && (tasks.length > 0 || !error);
  const hasActiveFilter = filter !== "all" || search.trim() !== "";

  return (
    <section className="stack">
      <header className="card" style={{ padding: "1rem" }}>
        <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Task Dashboard</h1>
        {refreshing ? (
          <small role="status" style={{ color: "var(--muted)" }}>
            Refreshing…
          </small>
        ) : null}
      </header>

      <section className="card" style={{ padding: "1rem", display: "grid", gap: "0.75rem" }}>
        <div>
          <label htmlFor="task-search" style={{ display: "block", marginBottom: "0.4rem", fontWeight: 600 }}>
            Search tasks
          </label>
          <input
            id="task-search"
            type="search"
            className="input"
            placeholder="Search by title"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <div>
            <label htmlFor="task-sort" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>
              Sort by
            </label>
            <select
              id="task-sort"
              className="input"
              value={sort}
              onChange={(event) => setSort(event.target.value as "createdAt" | "updatedAt" | "title")}
            >
              <option value="createdAt">Created</option>
              <option value="updatedAt">Updated</option>
              <option value="title">Title</option>
            </select>
          </div>

          <div>
            <label htmlFor="task-order" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>
              Order
            </label>
            <select
              id="task-order"
              className="input"
              value={order}
              onChange={(event) => setOrder(event.target.value as "asc" | "desc")}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>

          <div>
            <label htmlFor="task-limit" style={{ display: "block", marginBottom: "0.25rem", fontWeight: 600 }}>
              Per page
            </label>
            <select
              id="task-limit"
              className="input"
              value={String(limit)}
              onChange={(event) => setLimit(Number(event.target.value))}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="20">20</option>
            </select>
          </div>
        </div>
      </section>

      <StatusFilter value={filter} onChange={setFilter} />

      {loading ? (
        <section className="card" style={{ padding: "1rem" }}>
          <p role="status" style={{ margin: 0 }}>
            Loading tasks...
          </p>
        </section>
      ) : null}

      {error ? (
        <section
          className="card"
          style={{ padding: "1rem", borderColor: "#e3b4c0", background: "#fff8fa" }}
        >
          <p role="alert" style={{ marginTop: 0, marginBottom: "0.75rem", color: "var(--danger)" }}>
            {error}
          </p>
          <button type="button" className="button" onClick={fetchTasks}>
            Retry
          </button>
        </section>
      ) : null}

      {showList && !isInitialFailure ? (
        <TaskList
          tasks={tasks}
          updatingTaskIds={updatingTaskIds}
          onToggle={handleToggle}
          hasActiveFilter={hasActiveFilter}
        />
      ) : null}

      {!loading && meta.totalPages > 1 ? (
        <section
          className="card"
          style={{ padding: "0.8rem 1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}
          aria-label="Tasks pagination"
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
            Page {meta.page} of {meta.totalPages} · {meta.total} total
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
    </section>
  );
}
