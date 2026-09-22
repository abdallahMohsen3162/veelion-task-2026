const activityService = require('../services/activity.service');

function getActivity(req, res) {
  const activityLogs = activityService.listActivityLogs();
  res.json(activityLogs);
}

function createActivity(req, res) {
  const createdLog = activityService.createActivity(req.body || {});
  res.status(201).json(createdLog);
}

module.exports = {
  getActivity,
  createActivity,
};
