const express = require('express');

const asyncHandler = require('../../../middleware/asyncHandler');
const { validate } = require('../../../middleware/validate');
const activityController = require('../controllers/activity.controller');
const { createActivityBodySchema } = require('../validation/activity.validation');

const activityRouter = express.Router();

activityRouter.get('/', activityController.getActivity);
activityRouter.post(
  '/',
  validate({ body: createActivityBodySchema }),
  asyncHandler(async (req, res) => activityController.createActivity(req, res))
);

module.exports = activityRouter;
