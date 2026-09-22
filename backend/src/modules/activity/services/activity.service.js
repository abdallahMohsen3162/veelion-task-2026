const fs = require('node:fs');
const path = require('node:path');

const ACTIVITY_FILE_PATH = path.join(process.cwd(), 'data', 'activity.json');

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

function listActivityLogs() {
  return readActivityStore();
}

function createActivity(payload) {
  const entries = readActivityStore();
  const entry = {
    id: String(Date.now()),
    action: payload.action,
    info: payload.info,
    when: new Date().toISOString(),
  };

  entries.push(entry);
  fs.writeFileSync(ACTIVITY_FILE_PATH, JSON.stringify(entries, null, 2));
  return entry;
}

module.exports = {
  listActivityLogs,
  createActivity,
};
