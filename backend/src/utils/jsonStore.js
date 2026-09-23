const fs = require('node:fs/promises');
const path = require('node:path');

const mutationQueues = new Map();

function getDataFilePath(fileName) {
  return path.join(__dirname, '../../data', fileName);
}

async function readJsonArray(filePath) {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    if (!raw.trim()) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(filePath, '[]\n', 'utf-8');
      return [];
    }

    throw error;
  }
}

async function writeJsonArray(filePath, data) {
  const temporaryPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8');
  await fs.rename(temporaryPath, filePath);
}

async function mutateJsonArray(filePath, mutation) {
  const previousMutation = mutationQueues.get(filePath) || Promise.resolve();
  const nextMutation = previousMutation.then(async () => {
    const data = await readJsonArray(filePath);
    const result = await mutation(data);
    await writeJsonArray(filePath, data);
    return result;
  });

  mutationQueues.set(filePath, nextMutation.catch(() => {}));
  return nextMutation;
}

module.exports = {
  getDataFilePath,
  readJsonArray,
  writeJsonArray,
  mutateJsonArray,
};
