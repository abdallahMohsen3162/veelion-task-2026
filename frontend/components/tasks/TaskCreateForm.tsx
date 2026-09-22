import { memo, useCallback, useState } from "react";
import type { Task } from "@/types/api";

type TaskCreateFormProps = {
  creating: boolean;
  onCreate: (title: string) => Promise<Task | null>;
};

function TaskCreateFormView({ creating, onCreate }: TaskCreateFormProps) {
  const [title, setTitle] = useState("");
  const [validationError, setValidationError] = useState("");

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (title.trim() === "") {
        setValidationError("Title cannot be empty.");
        return;
      }
      setValidationError("");
      const created = await onCreate(title.trim());
      if (created) {
        setTitle("");
      }
    },
    [onCreate, title]
  );

  return (
    <section className="card card-pad" aria-label="Add a new task">
      <form onSubmit={handleSubmit} className="form-grid">
        <div>
          <label htmlFor="task-title" className="form-label">
            Add a task
          </label>
          <input
            id="task-title"
            type="text"
            className="input"
            placeholder="What needs to be done?"
            value={title}
            maxLength={200}
            onChange={(event) => {
              setTitle(event.target.value);
              if (validationError) {
                setValidationError("");
              }
            }}
          />
        </div>
        {validationError ? (
          <p role="alert" className="error-text" style={{ margin: 0 }}>
            {validationError}
          </p>
        ) : null}
        <div>
          <button type="submit" className="button primary" disabled={creating}>
            {creating ? "Adding…" : "Add task"}
          </button>
        </div>
      </form>
    </section>
  );
}

export const TaskCreateForm = memo(TaskCreateFormView);
