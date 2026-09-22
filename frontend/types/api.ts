export type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ActivityLog = {
  id: string;
  action?: string;
  info?: string;
  when: string;
};

export type TasksResponse = {
  data: Task[];
};

export type TaskResponse = {
  data: Task;
};

export type ErrorResponse = {
  error?: {
    message?: string;
    details?: unknown;
  };
};

export type TaskFilter = "all" | "completed" | "pending";

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedTasksResponse = {
  data: Task[];
  meta: PaginationMeta;
};

export type PaginatedActivityResponse = {
  data: ActivityLog[];
  meta: PaginationMeta;
};

export type TasksQueryParams = {
  search?: string;
  status?: TaskFilter;
  sort?: "createdAt" | "updatedAt" | "title";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type ActivityQueryParams = {
  search?: string;
  sort?: "when" | "action";
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
};

export type TasksSummary = {
  total: number;
  byStatus: {
    todo: number;
    "in-progress": number;
    done: number;
  };
  recentActivityCount: number;
};
