const fs = require('node:fs');

const { createId } = require('../../../utils/id');
const { getDataFilePath } = require('../../../utils/jsonStore');

const ACTIVITY_FILE_PATH = getDataFilePath('activity.json');

function readActivityStore() {
  if (!fs.existsSync(ACTIVITY_FILE_PATH)) {
    fs.writeFileSync(ACTIVITY_FILE_PATH, '[]');
  }

  let raw = fs.readFileSync(ACTIVITY_FILE_PATH, 'utf8');
  if (!raw) {
    raw = '[]';
  }

  return JSON.parse(raw);
}

function compareActivityLogs(a, b, sort, order) {
  let result = 0;

  if (sort === 'action') {
    result = String(a.action || '').localeCompare(String(b.action || ''));
  } else {
    result = String(a.when || '').localeCompare(String(b.when || ''));
  }

  return order === 'asc' ? result : -result;
}

function listActivityLogs() {
  return readActivityStore();
}

function queryActivityLogs(options) {
  const search = ((options && options.search) || '').trim().toLowerCase();
  const sort = (options && options.sort) || 'when';
  const order = (options && options.order) || 'desc';
  const page = (options && options.page) || 1;
  const limit = (options && options.limit) || 20;

  const entries = readActivityStore();

  const filtered = entries.filter((item) => {
    if (!search) {
      return true;
    }

    const action = String(item.action || '').toLowerCase();
    const info = String(item.info || '').toLowerCase();
    return action.includes(search) || info.includes(search);
  });

  const sorted = [...filtered].sort((a, b) => compareActivityLogs(a, b, sort, order));

  const total = sorted.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const data = sorted.slice(start, start + limit);

  return {
    data,
    meta: { page, limit, total, totalPages },
  };
}

function createActivity(payload) {
  const entries = readActivityStore();
  const entry = {
    id: createId(),
    action: payload.action,
    info: payload.info,
    when: new Date().toISOString(),
  };

  entries.push(entry);
  const temporaryPath = `${ACTIVITY_FILE_PATH}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temporaryPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
  fs.renameSync(temporaryPath, ACTIVITY_FILE_PATH);
  return entry;
}

module.exports = {
  listActivityLogs,
  queryActivityLogs,
  createActivity,
};
