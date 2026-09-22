import { BACKEND_BASE_URL } from "@/lib/constants";
import type {
  ActivityLog,
  ActivityQueryParams,
  ErrorResponse,
  PaginatedActivityResponse,
  PaginatedTasksResponse,
  Task,
  TasksQueryParams,
  TasksSummary,
} from "@/types/api";
import {
  activityPaginatedResponseSchema,
  taskResponseSchema,
  tasksPaginatedResponseSchema,
  tasksSummarySchema,
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

function buildBackendUrl(path: string, params?: Record<string, string | number | undefined>): string {
  if (!params) {
    return `${BACKEND_BASE_URL}${path}`;
  }
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      search.set(key, String(value));
    }
  }
  const query = search.toString();
  return query ? `${BACKEND_BASE_URL}${path}?${query}` : `${BACKEND_BASE_URL}${path}`;
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

export async function getTasksFromBackend(
  params?: TasksQueryParams
): Promise<PaginatedTasksResponse> {
  let response: Response;
  try {
    response = await fetch(buildBackendUrl("/tasks", params as Record<string, string | number | undefined>), {
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

  const parsed = tasksPaginatedResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new BackendError("Upstream tasks shape changed.", 502);
  }
  return parsed.data;
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

export async function getActivityFromBackend(
  params?: ActivityQueryParams
): Promise<PaginatedActivityResponse> {
  let response: Response;
  try {
    response = await fetch(
      buildBackendUrl("/activity", params as Record<string, string | number | undefined>),
      {
        cache: "no-store",
      }
    );
  } catch (error) {
    throw new BackendError(
      error instanceof Error ? error.message : "Failed to load activity logs.",
      502
    );
  }

  if (!response.ok) {
    throw await parseBackendError(response);
  }

  const parsed = activityPaginatedResponseSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new BackendError("Upstream activity shape changed.", 502);
  }
  return parsed.data;
}

export async function getReportsSummaryFromBackend(): Promise<TasksSummary> {
  let response: Response;
  try {
    response = await fetch(buildBackendUrl("/reports/tasks-summary"), {
      cache: "no-store",
    });
  } catch (error) {
    throw new BackendError(
      error instanceof Error ? error.message : "Failed to load reports.",
      502
    );
  }

  if (!response.ok) {
    throw await parseBackendError(response);
  }

  const parsed = tasksSummarySchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new BackendError("Upstream reports shape changed.", 502);
  }
  return parsed.data;
}

export type { ActivityLog, Task };
