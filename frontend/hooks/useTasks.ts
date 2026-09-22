"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ErrorResponse, Task, TaskFilter, TaskResponse, TasksResponse } from "@/types/api";

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

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [updatingTaskIds, setUpdatingTaskIds] = useState<Set<string>>(new Set());

  const fetchControllerRef = useRef<AbortController | null>(null);
  const fetchSequenceRef = useRef(0);
  const hasLoadedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      fetchControllerRef.current?.abort();
    };
  }, []);

  const fetchTasks = useCallback(async () => {
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

      const taskResponse = await requestJson<TasksResponse>("/api/tasks", {
        method: "GET",
        signal: controller.signal,
      });

      if (!isMountedRef.current || controller.signal.aborted) {
        return;
      }
      if (sequence !== fetchSequenceRef.current) {
        return;
      }

      setTasks(taskResponse.data);
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

  const updateTaskStatus = useCallback(async (taskId: string, completed: boolean) => {
    setUpdatingTaskIds((previous) => new Set(previous).add(taskId));
    if (isMountedRef.current) {
      setError("");
    }

    try {
      const taskResponse = await requestJson<TaskResponse>(
        `/api/tasks/${encodeURIComponent(taskId)}`,
        {
          method: "PATCH",
          body: JSON.stringify({ completed }),
        }
      );

      if (!isMountedRef.current) {
        return;
      }

      setTasks((previous) =>
        previous.map((task) => (task.id === taskId ? taskResponse.data : task))
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

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    if (filter === "completed") {
      return tasks.filter((task) => task.completed);
    }

    if (filter === "pending") {
      return tasks.filter((task) => !task.completed);
    }

    return tasks;
  }, [tasks, filter]);

  return {
    tasks,
    filteredTasks,
    filter,
    loading,
    refreshing,
    error,
    updatingTaskIds,
    setFilter,
    fetchTasks,
    updateTaskStatus,
  };
}
