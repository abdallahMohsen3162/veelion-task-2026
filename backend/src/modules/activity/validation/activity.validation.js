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

module.exports = {
  createActivityBodySchema,
};
