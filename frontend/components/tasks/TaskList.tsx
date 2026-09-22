import type { Task } from "@/types/api";
import { TaskItem } from "@/components/tasks/TaskItem";

type TaskListProps = {
  tasks: Task[];
  updatingTaskIds: Set<string>;
  onToggle: (taskId: string, nextCompleted: boolean) => void;
  hasActiveFilter?: boolean;
};

export function TaskList({ tasks, updatingTaskIds, onToggle, hasActiveFilter = false }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <section className="card" style={{ padding: "1rem" }}>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          {hasActiveFilter ? "No tasks match this filter." : "No tasks yet. Create your first task to get started."}
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Task list">
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.7rem" }}>
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            busy={updatingTaskIds.has(task.id)}
            onToggle={onToggle}
          />
        ))}
      </ul>
    </section>
  );
}
