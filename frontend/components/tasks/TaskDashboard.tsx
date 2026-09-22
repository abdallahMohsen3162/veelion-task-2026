"use client";

import { useCallback } from "react";
import { useTasks } from "@/hooks/useTasks";
import { StatusFilter } from "@/components/tasks/StatusFilter";
import { TaskList } from "@/components/tasks/TaskList";

export function TaskDashboard() {
  const {
    tasks,
    filteredTasks,
    filter,
    loading,
    refreshing,
    error,
    updatingTaskIds,
    setFilter,
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
          tasks={filteredTasks}
          updatingTaskIds={updatingTaskIds}
          onToggle={handleToggle}
          hasActiveFilter={filter !== "all"}
        />
      ) : null}
    </section>
  );
}
