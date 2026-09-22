import type { TasksSummary } from "@/types/api";

type StatusBarsProps = {
  byStatus: TasksSummary["byStatus"];
  total: number;
};

const ROWS = [
  { key: "todo", label: "To do" },
  { key: "in-progress", label: "In progress" },
  { key: "done", label: "Done" },
] as const;

export function StatusBars({ byStatus, total }: StatusBarsProps) {
  return (
    <div aria-label="Tasks by status, bar chart">
      {ROWS.map((row) => {
        const value = byStatus[row.key];
        const percent = total > 0 ? Math.round((value / total) * 100) : 0;
        return (
          <div key={row.key} className="bar-row">
            <div className="bar-meta">
              <span>{row.label}</span>
              <span className="muted">
                {value} ({percent}%)
              </span>
            </div>
            <div className="bar-track" aria-hidden="true">
              <div
                className={`bar-fill bar-fill-${row.key}`}
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
