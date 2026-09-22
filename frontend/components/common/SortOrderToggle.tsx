import { memo, useCallback } from "react";

export type SortOrder = "asc" | "desc";

type SortOrderToggleProps = {
  value: SortOrder;
  onChange: (value: SortOrder) => void;
  id?: string;
  ascLabel?: string;
  descLabel?: string;
};

function SortOrderToggleView({
  value,
  onChange,
  id = "sort-order",
  ascLabel = "Ascending order",
  descLabel = "Descending order",
}: SortOrderToggleProps) {
  const handleClick = useCallback(() => {
    onChange(value === "desc" ? "asc" : "desc");
  }, [onChange, value]);

  const isDescending = value === "desc";

  return (
    <button
      id={id}
      type="button"
      className="button order-toggle"
      onClick={handleClick}
      aria-label={isDescending ? descLabel : ascLabel}
      title={isDescending ? descLabel : ascLabel}
      aria-pressed={!isDescending}
    >
      <span aria-hidden="true">{isDescending ? "↓" : "↑"}</span>
    </button>
  );
}

export const SortOrderToggle = memo(SortOrderToggleView);
