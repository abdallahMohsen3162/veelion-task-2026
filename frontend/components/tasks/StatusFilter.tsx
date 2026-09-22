import { memo, useCallback } from "react";
import type { TaskFilter } from "@/types/api";

const FILTERS: Array<{ label: string; value: TaskFilter }> = [
  { label: "All", value: "all" },
  { label: "Completed", value: "completed" },
  { label: "Pending", value: "pending" },
];

type StatusFilterProps = {
  value: TaskFilter;
  onChange: (value: TaskFilter) => void;
};

type FilterButtonProps = {
  label: string;
  filterValue: TaskFilter;
  active: boolean;
  onChange: (value: TaskFilter) => void;
};

const FilterButton = memo(function FilterButton({ label, filterValue, active, onChange }: FilterButtonProps) {
  const handleClick = useCallback(() => {
    onChange(filterValue);
  }, [onChange, filterValue]);

  return (
    <button
      type="button"
      className={active ? "button primary" : "button"}
      onClick={handleClick}
      aria-pressed={active}
    >
      {label}
    </button>
  );
});

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <section aria-label="Filter tasks by status" className="card card-pad">
      <div className="controls-row">
        {FILTERS.map((filter) => (
          <FilterButton
            key={filter.value}
            label={filter.label}
            filterValue={filter.value}
            active={filter.value === value}
            onChange={onChange}
          />
        ))}
      </div>
    </section>
  );
}
