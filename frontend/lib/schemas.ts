import { z } from "zod";

export const taskSchema = z.object({
  id: z.string(),
  title: z.string(),
  completed: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const activityLogSchema = z.object({
  id: z.string(),
  action: z.string().optional(),
  info: z.string().optional(),
  when: z.string(),
});

export const paginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});

export const tasksResponseSchema = z.object({
  data: z.array(taskSchema),
});

export const tasksPaginatedResponseSchema = z.object({
  data: z.array(taskSchema),
  meta: paginationMetaSchema,
});

export const taskResponseSchema = z.object({
  data: taskSchema,
});

export const activityListResponseSchema = z.array(activityLogSchema);

export const activityPaginatedResponseSchema = z.object({
  data: z.array(activityLogSchema),
  meta: paginationMetaSchema,
});

export const updateTaskPayloadSchema = z
  .object({
    completed: z.boolean({ invalid_type_error: "completed must be boolean" }),
  })
  .strict();

export const tasksSummarySchema = z.object({
  total: z.number(),
  byStatus: z.object({
    todo: z.number(),
    "in-progress": z.number(),
    done: z.number(),
  }),
  recentActivityCount: z.number(),
});

export const tasksQuerySchema = z.object({
  search: z.string().max(200).optional(),
  status: z.enum(["all", "completed", "pending"]).optional(),
  sort: z.enum(["createdAt", "updatedAt", "title"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const activityQuerySchema = z.object({
  search: z.string().max(200).optional(),
  sort: z.enum(["when", "action"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type TaskSchemaType = z.infer<typeof taskSchema>;
export type ActivityLogSchemaType = z.infer<typeof activityLogSchema>;
export type PaginationMetaSchemaType = z.infer<typeof paginationMetaSchema>;
