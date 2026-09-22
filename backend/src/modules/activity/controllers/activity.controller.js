const activityService = require('../services/activity.service');

function getActivity(req, res) {
  const query = req.validatedQuery || req.query || {};
  const result = activityService.queryActivityLogs(query);
  res.json(result);
}

function createActivity(req, res) {
  const createdLog = activityService.createActivity(req.body || {});
  res.status(201).json(createdLog);
}

module.exports = {
  getActivity,
  createActivity,
};
