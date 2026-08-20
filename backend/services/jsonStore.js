const fs = require('fs/promises');
const path = require('path');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createJsonStore({ filePath, seedData }) {
  const resolvedFilePath = path.resolve(filePath);

  async function ensureReady() {
    await fs.mkdir(path.dirname(resolvedFilePath), { recursive: true });

    try {
      await fs.access(resolvedFilePath);
    } catch {
      await write(clone(seedData));
    }
  }

  async function read() {
    await ensureReady();
    const raw = await fs.readFile(resolvedFilePath, 'utf8');
    const data = JSON.parse(raw);
    let changed = false;

    for (const [key, value] of Object.entries(seedData)) {
      if (!Object.prototype.hasOwnProperty.call(data, key)) {
        data[key] = clone(value);
        changed = true;
      }
    }

    if (changed) {
      await write(data);
    }

    return data;
  }

  async function write(data) {
    await fs.mkdir(path.dirname(resolvedFilePath), { recursive: true });
    await fs.writeFile(resolvedFilePath, JSON.stringify(data, null, 2));
    return data;
  }

  async function update(mutator) {
    const data = await read();
    const result = await mutator(data);
    await write(data);
    return result;
  }

  async function reset(nextSeed = seedData) {
    await write(clone(nextSeed));
  }

  return {
    filePath: resolvedFilePath,
    read,
    write,
    update,
    reset,
  };
}

module.exports = {
  clone,
  createJsonStore,
};
