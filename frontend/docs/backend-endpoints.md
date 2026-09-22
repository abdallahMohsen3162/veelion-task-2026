# Backend API Endpoints

Base URL: `http://localhost:4000`

## Shared Error Shape

```ts
type ErrorResponse = {
  error: {
    message: string;
  };
};
```

## Task Endpoints

### GET /tasks

Fetch tasks with searching, filtering, sorting, and pagination.

Query params (all optional):

```ts
type ListTasksQuery = {
  search?: string; // case-insensitive match on title, max 200
  status?: "all" | "completed" | "pending" | "todo" | "done"; // default "all" ("todo" = pending, "done" = completed)
  sort?: "createdAt" | "updatedAt" | "title"; // default "updatedAt" (time)
  order?: "asc" | "desc"; // default "desc"
  page?: number; // >= 1, default 1
  limit?: number; // 1-100, default 20
};
```

```ts
type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string; // ISO datetime
  updatedAt: string; // ISO datetime
};

type PaginationMeta = {
  page: number;
  limit: number;
  total: number; // total after filtering, before pagination
  totalPages: number; // 0 when total is 0
};

type GetTasksResponse = {
  data: Task[];
  meta: PaginationMeta;
};
```

Notes:
- Contract changed from `{ data: Task[] }` to `{ data, meta }` to support pagination.
- Validation is Zod-based: unknown query values return `400` with `{ error: { message, details } }`.
- GET responses are cached in-memory by `METHOD + originalUrl`; `POST/PATCH/DELETE` clear the cache on success.

### GET /tasks/:id

Fetch one task by ID.

```ts
type GetTaskResponse = {
  data: Task;
};
```

Possible errors:
- `404` when task does not exist.

### POST /tasks

Create a task.

```ts
type CreateTaskRequest = {
  title: string; // required, trimmed, non-empty
  completed?: boolean; // default false
};

type CreateTaskResponse = {
  data: Task;
};
```

Possible errors:
- `400` when body is not an object.
- `400` when title is missing/invalid/empty.
- `400` when completed is not a boolean.

### PATCH /tasks/:id

Update task title or status.

```ts
type PatchTaskRequest = {
  title?: string; // if provided, must be string and long enough after trim
  completed?: boolean;
};

type PatchTaskResponse = {
  data: Task;
};
```

Possible errors:
- `400` when body is invalid.
- `400` when no supported fields are provided.
- `404` when task does not exist.

### DELETE /tasks/:id

Delete task by ID.

```ts
type DeleteTaskResponse = void; // status 204
```

Possible errors:
- `404` when task does not exist.

## Activity Endpoints

### GET /activity

Fetch activity logs with searching, sorting, and pagination.

Query params (all optional):

```ts
type ListActivityQuery = {
  search?: string; // case-insensitive match on action + info, max 200
  sort?: "when" | "action"; // default "when"
  order?: "asc" | "desc"; // default "desc"
  page?: number; // >= 1, default 1
  limit?: number; // 1-100, default 20
};
```

```ts
type ActivityLog = {
  id: string;
  action?: string;
  info?: string;
  when: string; // ISO datetime
};

type GetActivityResponse = {
  data: ActivityLog[];
  meta: PaginationMeta;
};
```

Notes:
- Contract changed from bare `ActivityLog[]` to `{ data, meta }` for consistency with tasks.

### POST /activity

Create activity log entry.

```ts
type CreateActivityRequest = {
  action?: string;
  info?: string;
};

type CreateActivityResponse = ActivityLog;
```

Notes:
- `POST /activity` bodies are Zod-validated (`action`/`info` optional trimmed strings, strict — unknown keys return `400`).
- `GET /activity` returns `{ data, meta }`; `POST /activity` returns the raw created log.

## Reports Endpoints

### GET /reports/tasks-summary

Fetch summary statistics for tasks and activity.

```ts
type TasksSummary = {
  total: number;
  byStatus: {
    todo: number;
    "in-progress": number;
    done: number;
  };
  recentActivityCount: number;
};

type GetTasksSummaryResponse = TasksSummary;
```

Notes:
- `in-progress` is currently returned as `0` because task data only includes boolean `completed`.
- Response shape is raw object.
