const { z } = require('zod');

const createActivityBodySchema = z
  .object({
    action: z
      .string({ invalid_type_error: 'action must be string' })
      .trim()
      .max(200, 'action is too long')
      .optional(),
    info: z
      .string({ invalid_type_error: 'info must be string' })
      .trim()
      .max(1000, 'info is too long')
      .optional(),
  })
  .strict();

const listActivityQuerySchema = z.object({
  search: z.string().trim().max(200).optional().default(''),
  sort: z.enum(['when', 'action']).optional().default('when'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

module.exports = {
  createActivityBodySchema,
  listActivityQuerySchema,
};
