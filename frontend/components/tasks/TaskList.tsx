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
      <section className="card card-pad">
        <p className="muted" style={{ margin: 0 }}>
          {hasActiveFilter ? "No tasks match this filter." : "No tasks yet. Create your first task to get started."}
        </p>
      </section>
    );
  }

  return (
    <section aria-label="Task list">
      <ul className="list-reset">
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
