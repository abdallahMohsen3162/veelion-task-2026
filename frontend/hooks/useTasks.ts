"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BACKEND_BASE_URL } from "@/lib/constants";
import type {
  ErrorResponse,
  PaginatedTasksResponse,
  PaginationMeta,
  Task,
  TaskFilter,
  TaskResponse,
} from "@/types/api";
import {
  taskResponseSchema,
  tasksPaginatedResponseSchema,
  updateTaskPayloadSchema,
} from "@/lib/schemas";

export type TasksSortField = "createdAt" | "updatedAt" | "title";
export type SortOrder = "asc" | "desc";

const DEFAULT_META: PaginationMeta = { page: 1, limit: 10, total: 0, totalPages: 0 };

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    try {
      const errorBody = (await response.json()) as ErrorResponse;
      const upstream = new Error(
        errorBody.error?.message || `Request failed with ${response.status}`
      );
      (upstream as Error & { status?: number }).status = response.status;
      throw upstream;
    } catch (error) {
      if (error instanceof Error && "status" in error) {
        throw error;
      }
      throw new Error(getErrorMessage(error, `Request failed with ${response.status}`));
    }
  }

  return (await response.json()) as T;
}

function buildTasksUrl(
  filter: TaskFilter,
  search: string,
  sort: TasksSortField,
  order: SortOrder,
  page: number,
  limit: number
): string {
  const params = new URLSearchParams();
  if (search.trim()) {
    params.set("search", search.trim());
  }
  params.set("status", filter);
  params.set("sort", sort);
  params.set("order", order);
  params.set("page", String(page));
  params.set("limit", String(limit));
  return `${BACKEND_BASE_URL}/tasks?${params.toString()}`;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>(DEFAULT_META);
  const [filter, setFilterState] = useState<TaskFilter>("all");
  const [search, setSearchState] = useState("");
  const [sort, setSortState] = useState<TasksSortField>("updatedAt");
  const [order, setOrderState] = useState<SortOrder>("desc");
  const [page, setPageState] = useState(1);
  const [limit, setLimitState] = useState(10);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set());

  const fetchControllerRef = useRef<AbortController | null>(null);
  const fetchSequenceRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const isMountedRef = useRef(true);
  const queryRef = useRef({ filter, search, sort, order, page, limit });
  queryRef.current = { filter, search, sort, order, page, limit };

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      fetchControllerRef.current?.abort();
    };
  }, []);

  const fetchTasks = useCallback(async () => {
    const current = queryRef.current;
    fetchControllerRef.current?.abort();
    const controller = new AbortController();
    fetchControllerRef.current = controller;
    const sequence = ++fetchSequenceRef.current;
    const isInitialLoad = !hasLoadedRef.current;

    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      if (isMountedRef.current) {
        setError("");
      }

      const url = buildTasksUrl(
        current.filter,
        current.search,
        current.sort,
        current.order,
        current.page,
        current.limit
      );
      const rawTasks = await requestJson<PaginatedTasksResponse>(url, {
        method: "GET",
        signal: controller.signal,
      });

      const parsedTasks = tasksPaginatedResponseSchema.safeParse(rawTasks);
      if (!parsedTasks.success) {
        throw new Error("Tasks response changed shape.");
      }

      if (!isMountedRef.current || controller.signal.aborted) {
        return;
      }
      if (sequence !== fetchSequenceRef.current) {
        return;
      }

      setTasks(parsedTasks.data.data);
      setMeta(parsedTasks.data.meta);
      hasLoadedRef.current = true;
    } catch (error) {
      if (!isMountedRef.current || controller.signal.aborted || isAbortError(error)) {
        return;
      }
      if (sequence !== fetchSequenceRef.current) {
        return;
      }
      setError(getErrorMessage(error, "Could not load tasks right now."));
    } finally {
      if (!isMountedRef.current || controller.signal.aborted) {
        return;
      }
      if (sequence !== fetchSequenceRef.current) {
        return;
      }
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks, filter, search, sort, order, page, limit]);

  const setFilter = useCallback((value: TaskFilter) => {
    setFilterState(value);
    setPageState(1);
  }, []);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
    setPageState(1);
  }, []);

  const setSort = useCallback((value: TasksSortField) => {
    setSortState(value);
    setPageState(1);
  }, []);

  const setOrder = useCallback((value: SortOrder) => {
    setOrderState(value);
    setPageState(1);
  }, []);

  const setPage = useCallback((value: number) => {
    setPageState(Math.max(1, value));
  }, []);

  const setLimit = useCallback((value: number) => {
    setLimitState(Math.min(100, Math.max(1, value)));
    setPageState(1);
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, completed: boolean) => {
    const parsedPayload = updateTaskPayloadSchema.safeParse({ completed });
    if (!parsedPayload.success) {
      if (isMountedRef.current) {
        setError(parsedPayload.error.issues[0]?.message || "Invalid update.");
      }
      return;
    }

    setUpdatingTaskIds((previous) => new Set(previous).add(taskId));
    if (isMountedRef.current) {
      setError("");
    }

    try {
      const rawTask = await requestJson<TaskResponse>(
        `${BACKEND_BASE_URL}/tasks/${encodeURIComponent(taskId)}`,
        {
          method: "PATCH",
          body: JSON.stringify(parsedPayload.data),
        }
      );

      const parsedTask = taskResponseSchema.safeParse(rawTask);
      if (!parsedTask.success) {
        throw new Error("Task response changed shape.");
      }

      if (!isMountedRef.current) {
        return;
      }

      setTasks((previous) =>
        previous.map((task) => (task.id === taskId ? parsedTask.data.data : task))
      );
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }
      if (isAbortError(error)) {
        return;
      }
      setError(getErrorMessage(error, "Could not update task status."));
    } finally {
      if (isMountedRef.current) {
        setUpdatingTaskIds((previous) => {
          const next = new Set(previous);
          next.delete(taskId);
          return next;
        });
      }
    }
  }, []);

  return {
    tasks,
    filteredTasks: tasks,
    meta,
    filter,
    search,
    sort,
    order,
    page,
    limit,
    loading,
    refreshing,
    error,
    updatingTaskIds,
    setFilter,
    setSearch,
    setSort,
    setOrder,
    setPage,
    setLimit,
    fetchTasks,
    updateTaskStatus,
  };
}
