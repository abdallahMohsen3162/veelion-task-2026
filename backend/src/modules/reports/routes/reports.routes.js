const express = require('express');
const reportsRouter = express.Router();
const reportsController = require('../controllers/reports.controller');

reportsRouter.get('/tasks-summary', reportsController.getTasksSummary);

module.exports = reportsRouter;
