import { BACKEND_BASE_URL } from "@/lib/constants";
import type { ActivityLog, ErrorResponse, Task } from "@/types/api";
import {
  activityListResponseSchema,
  taskResponseSchema,
  tasksResponseSchema,
} from "@/lib/schemas";

export class BackendError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "BackendError";
    this.status = status;
  }
}

export function getUpstreamStatus(error: unknown, fallback = 500): number {
  if (error instanceof BackendError && Number.isInteger(error.status)) {
    return error.status;
  }
  const status = (error as { status?: unknown })?.status;
  if (typeof status === "number" && Number.isInteger(status)) {
    return status;
  }
  return fallback;
}

function buildBackendUrl(path: string): string {
  return `${BACKEND_BASE_URL}${path}`;
}

async function parseBackendError(response: Response): Promise<BackendError> {
  const fallback = `Request failed with status ${response.status}`;

  try {
    const body = (await response.json()) as ErrorResponse;
    return new BackendError(body.error?.message || fallback, response.status);
  } catch {
    return new BackendError(fallback, response.status);
  }
}

export async function getTasksFromBackend(): Promise<Task[]> {
  let response: Response;
  try {
    response = await fetch(buildBackendUrl("/tasks"), {
      cache: "no-store",
    });
  } catch (error) {
    throw new BackendError(
      error instanceof Error ? error.message : "Failed to load tasks.",
      502
    );
  }

  if (!response.ok) {
    throw await parseBackendError(response);
  }

  const parsed = tasksResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new BackendError("Upstream tasks shape changed.", 502);
  }
  return parsed.data.data;
}

export async function updateTaskInBackend(taskId: string, completed: boolean): Promise<Task> {
  const encodedTaskId = encodeURIComponent(taskId);
  let response: Response;
  try {
    response = await fetch(buildBackendUrl(`/tasks/${encodedTaskId}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ completed }),
      cache: "no-store",
    });
  } catch (error) {
    throw new BackendError(
      error instanceof Error ? error.message : "Failed to update task.",
      502
    );
  }

  if (!response.ok) {
    throw await parseBackendError(response);
  }

  const parsed = taskResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new BackendError("Upstream task shape changed.", 502);
  }
  return parsed.data.data;
}

export async function getActivityFromBackend(): Promise<ActivityLog[]> {
  let response: Response;
  try {
    response = await fetch(buildBackendUrl("/activity"), {
      cache: "no-store",
    });
  } catch (error) {
    throw new BackendError(
      error instanceof Error ? error.message : "Failed to load activity logs.",
      502
    );
  }

  if (!response.ok) {
    throw await parseBackendError(response);
  }

  const parsed = activityListResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new BackendError("Upstream activity shape changed.", 502);
  }
  return parsed.data;
}
