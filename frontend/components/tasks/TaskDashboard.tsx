"use client";

import { useCallback } from "react";
import { SortOrderToggle } from "@/components/common/SortOrderToggle";
import { useTasks } from "@/hooks/useTasks";
import { StatusFilter } from "@/components/tasks/StatusFilter";
import { TaskCreateForm } from "@/components/tasks/TaskCreateForm";
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
    creating,
    error,
    updatingTaskIds,
    setFilter,
    setSearch,
    setSort,
    setOrder,
    setPage,
    setLimit,
    fetchTasks,
    createTask,
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
      <header className="card card-pad">
        <h1 className="page-title">Task Dashboard</h1>
        {refreshing ? (
          <small role="status" className="muted">
            Refreshing…
          </small>
        ) : null}
      </header>

      <TaskCreateForm creating={creating} onCreate={createTask} />

      <section className="card card-pad form-grid">
        <div>
          <label htmlFor="task-search" className="form-label">
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

        <div className="controls-row">
          <div>
            <label htmlFor="task-sort" className="form-label">
              Sort by
            </label>
            <select
              id="task-sort"
              className="input"
              value={sort}
              onChange={(event) => setSort(event.target.value as "createdAt" | "updatedAt" | "title")}
            >
              <option value="updatedAt">Time (last updated)</option>
              <option value="createdAt">Time (created)</option>
              <option value="title">Title</option>
            </select>
          </div>

          <div>
            <label htmlFor="task-order" className="form-label">
              Order
            </label>
            <SortOrderToggle
              id="task-order"
              value={order}
              onChange={setOrder}
              ascLabel="Oldest first"
              descLabel="Newest first"
            />
          </div>

          <div>
            <label htmlFor="task-limit" className="form-label">
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
        <section className="card card-pad">
          <p role="status" style={{ margin: 0 }}>
            Loading tasks...
          </p>
        </section>
      ) : null}

      {error ? (
        <section className="card card-pad error-panel">
          <p role="alert" className="error-text" style={{ marginTop: 0, marginBottom: "0.75rem" }}>
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
        <section className="card card-pad pagination" aria-label="Tasks pagination">
          <button
            type="button"
            className="button"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <small className="muted">
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
