const { z } = require('zod');

const taskIdParamsSchema = z.object({
  id: z.string().trim().min(1, 'Task id is required.').max(200),
});

const createTaskBodySchema = z
  .object({
    title: z
      .string({ required_error: 'title is required and must be string' })
      .trim()
      .min(1, 'title cannot be empty')
      .max(200, 'title is too long'),
    completed: z.boolean({ invalid_type_error: 'completed must be boolean' }).optional().default(false),
  })
  .strict();

const updateTaskBodySchema = z
  .object({
    title: z
      .string({ invalid_type_error: 'title should be string' })
      .trim()
      .min(1, 'title cannot be empty')
      .max(200, 'title is too long')
      .optional(),
    completed: z.boolean({ invalid_type_error: 'completed should be bool' }).optional(),
  })
  .strict()
  .refine((value) => value.title !== undefined || value.completed !== undefined, {
    message: 'nothing to update',
  });

module.exports = {
  taskIdParamsSchema,
  createTaskBodySchema,
  updateTaskBodySchema,
};
