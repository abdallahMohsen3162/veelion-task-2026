const express = require('express');

const activityController = require('../controllers/activity.controller');

const activityRouter = express.Router();

activityRouter.get('/', activityController.getActivity);
activityRouter.post('/', activityController.createActivity);

module.exports = activityRouter;
