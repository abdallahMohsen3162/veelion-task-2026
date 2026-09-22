const express = require('express');

const asyncHandler = require('../../../middleware/asyncHandler');
const { validate } = require('../../../middleware/validate');
const tasksController = require('../controllers/tasks.controller');
const {
  taskIdParamsSchema,
  createTaskBodySchema,
  updateTaskBodySchema,
} = require('../validation/tasks.validation');

const tasksRouter = express.Router();

tasksRouter.get('/', asyncHandler(tasksController.listTasks));
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
