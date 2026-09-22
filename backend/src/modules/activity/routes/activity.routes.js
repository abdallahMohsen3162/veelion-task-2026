const express = require('express');

const asyncHandler = require('../../../middleware/asyncHandler');
const { cacheMiddleware } = require('../../../middleware/cache');
const { validate } = require('../../../middleware/validate');
const activityController = require('../controllers/activity.controller');
const {
  createActivityBodySchema,
  listActivityQuerySchema,
} = require('../validation/activity.validation');

const activityRouter = express.Router();

activityRouter.use(cacheMiddleware);

activityRouter.get(
  '/',
  validate({ query: listActivityQuerySchema }),
  activityController.getActivity
);
activityRouter.post(
  '/',
  validate({ body: createActivityBodySchema }),
  asyncHandler(async (req, res) => activityController.createActivity(req, res))
);

module.exports = activityRouter;
