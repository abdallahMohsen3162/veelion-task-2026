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

export const tasksResponseSchema = z.object({
  data: z.array(taskSchema),
});

export const taskResponseSchema = z.object({
  data: taskSchema,
});

export const activityListResponseSchema = z.array(activityLogSchema);

export const updateTaskPayloadSchema = z
  .object({
    completed: z.boolean({ invalid_type_error: "completed must be boolean" }),
  })
  .strict();

export type TaskSchemaType = z.infer<typeof taskSchema>;
export type ActivityLogSchemaType = z.infer<typeof activityLogSchema>;
