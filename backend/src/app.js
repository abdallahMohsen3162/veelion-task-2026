const express = require('express');

const tasksRouter = require('./modules/tasks/routes/tasks.routes');
const activityRouter = require('./modules/activity/routes/activity.routes');
const reportsRouter = require('./modules/reports/routes/reports.routes');
const errorHandler = require('./middleware/errorHandler');
const HttpError = require('./utils/httpError');

const app = express();

// The Next.js frontend calls this API directly from the browser, so allow
// cross-origin requests (dependency-free CORS: no new packages needed).
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.json());

app.use('/tasks', tasksRouter);
app.use('/activity', activityRouter);
app.use('/reports', reportsRouter);

app.use((req, res, next) => {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

app.use(errorHandler);

module.exports = app;
