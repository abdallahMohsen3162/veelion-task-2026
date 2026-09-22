const path = require('node:path');

const { createId } = require('../../../utils/id');
const { readJsonArray, writeJsonArray } = require('../../../utils/jsonStore');
const HttpError = require('../../../utils/httpError');

const TASKS_FILE_PATH = path.join(process.cwd(), 'data', 'tasks.json');

function buildTaskRecord(payload) {
  const now = new Date().toISOString();

  return {
    id: createId(),
    title: payload.title,
    completed: payload.completed ?? false,
    createdAt: now,
    updatedAt: now,
  };
}

function matchesTaskStatus(task, status) {
  if (status === 'all') {
    return true;
  }
  if (status === 'completed' || status === 'done') {
    return task.completed === true;
  }
  if (status === 'pending' || status === 'todo') {
    return task.completed === false;
  }
  return true;
}

function compareTasksByField(a, b, sort, order) {
  let result = 0;

  if (sort === 'title') {
    result = String(a.title || '').localeCompare(String(b.title || ''));
  } else if (sort === 'updatedAt') {
    result = String(a.updatedAt || '').localeCompare(String(b.updatedAt || ''));
  } else {
    result = String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
  }

  return order === 'asc' ? result : -result;
}

async function getAllTasks() {
  return readJsonArray(TASKS_FILE_PATH);
}

async function queryTasks(options) {
  const search = (options.search || '').trim().toLowerCase();
  const status = options.status || 'all';
  const sort = options.sort || 'updatedAt';
  const order = options.order || 'desc';
  const page = options.page || 1;
  const limit = options.limit || 20;

  let tasks = await readJsonArray(TASKS_FILE_PATH);

  const filtered = tasks.filter((task) => {
    if (!matchesTaskStatus(task, status)) {
      return false;
    }

    if (search) {
      const title = String(task.title || '').toLowerCase();
      if (!title.includes(search)) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => compareTasksByField(a, b, sort, order));

  const total = sorted.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = sorted.slice(start, start + limit);

  return {
    data,
    meta: { page, limit, total, totalPages },
  };
}

async function getTaskById(taskId) {
  const tasks = await readJsonArray(TASKS_FILE_PATH);
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    throw new HttpError(404, 'Task not found.');
  }

  return task;
}

async function createTask(payload) {
  const tasks = await readJsonArray(TASKS_FILE_PATH);
  const newTask = buildTaskRecord(payload);

  tasks.push(newTask);
  await writeJsonArray(TASKS_FILE_PATH, tasks);

  return newTask;
}

async function updateTask(taskId, updates) {
  const tasks = await readJsonArray(TASKS_FILE_PATH);
  const taskIndex = tasks.findIndex((item) => item.id === taskId);

  if (taskIndex === -1) {
    throw new HttpError(404, 'Task not found.');
  }

  const existingTask = tasks[taskIndex];
  const updatedTask = {
    ...existingTask,
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  tasks[taskIndex] = updatedTask;
  await writeJsonArray(TASKS_FILE_PATH, tasks);

  return updatedTask;
}

async function deleteTask(taskId) {
  const tasks = await readJsonArray(TASKS_FILE_PATH);
  const taskIndex = tasks.findIndex((item) => item.id === taskId);

  if (taskIndex === -1) {
    throw new HttpError(404, 'Task not found.');
  }

  const [removedTask] = tasks.splice(taskIndex, 1);
  await writeJsonArray(TASKS_FILE_PATH, tasks);

  return removedTask;
}

module.exports = {
  getAllTasks,
  queryTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};
