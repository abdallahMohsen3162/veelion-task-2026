const express = require('express');

const asyncHandler = require('../../../middleware/asyncHandler');
const { cacheMiddleware } = require('../../../middleware/cache');
const { validate } = require('../../../middleware/validate');
const tasksController = require('../controllers/tasks.controller');
const {
  taskIdParamsSchema,
  createTaskBodySchema,
  updateTaskBodySchema,
  listTasksQuerySchema,
} = require('../validation/tasks.validation');

const tasksRouter = express.Router();

tasksRouter.use(cacheMiddleware);

tasksRouter.get(
  '/',
  validate({ query: listTasksQuerySchema }),
  asyncHandler(tasksController.listTasks)
);
tasksRouter.get(
  '/:id',
  validate({ params: taskIdParamsSchema }),
  asyncHandler(tasksController.getTask)
);
tasksRouter.post(
  '/',
  validate({ body: createTaskBodySchema }),
  asyncHandler(tasksController.createTask)
);
tasksRouter.patch(
  '/:id',
  validate({ params: taskIdParamsSchema, body: updateTaskBodySchema }),
  asyncHandler(tasksController.patchTask)
);
tasksRouter.delete(
  '/:id',
  validate({ params: taskIdParamsSchema }),
  asyncHandler(tasksController.deleteTask)
);

module.exports = tasksRouter;
