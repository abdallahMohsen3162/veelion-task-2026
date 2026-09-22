const express = require('express');
const { cacheMiddleware } = require('../../../middleware/cache');
const reportsController = require('../controllers/reports.controller');

const reportsRouter = express.Router();

reportsRouter.use(cacheMiddleware);

reportsRouter.get('/tasks-summary', reportsController.getTasksSummary);

module.exports = reportsRouter;
