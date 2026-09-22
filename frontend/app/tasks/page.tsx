import { BackNav } from "@/components/common/BackNav";
import { TaskDashboard } from "@/components/tasks/TaskDashboard";

export default function TasksPage() {
  return (
    <main className="stack">
      <BackNav />
      <TaskDashboard />
    </main>
  );
}
