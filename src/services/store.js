'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

// Two backends:
//   - "memory":   process-local arrays. Used in serverless (VERCEL=1) or when
//                 STORE_BACKEND=memory is set. Data is lost on cold start —
//                 fine for catalogs (which come from seed JSON) and for the
//                 demo phase, but leads / projects need a real DB before going
//                 fully public. Switch to DATABASE_URL when ready.
//   - "file":     persists to data/runtime/<collection>.json. Default in dev.

const BACKEND =
  process.env.STORE_BACKEND ||
  (process.env.VERCEL || process.env.NOW_REGION ? 'memory' : 'file');

const RUNTIME_DIR = config.paths.runtime;
const memory = new Map(); // collection -> array

function readMemory(collection) {
  return memory.get(collection) || [];
}

function writeMemory(collection, items) {
  memory.set(collection, items);
}

function ensureRuntimeDir() {
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }
}

function filePathFor(collection) {
  return path.join(RUNTIME_DIR, `${collection}.json`);
}

function readFile(collection) {
  ensureRuntimeDir();
  const file = filePathFor(collection);
  if (!fs.existsSync(file)) return [];
  try {
    const raw = fs.readFileSync(file, 'utf8');
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn(`[store] could not read ${collection}.json:`, err.message);
    return [];
  }
}

function writeFile(collection, items) {
  ensureRuntimeDir();
  fs.writeFileSync(filePathFor(collection), JSON.stringify(items, null, 2), 'utf8');
}

function readCollection(collection) {
  return BACKEND === 'memory' ? readMemory(collection) : readFile(collection);
}

function writeCollection(collection, items) {
  return BACKEND === 'memory' ? writeMemory(collection, items) : writeFile(collection, items);
}

function newId(prefix) {
  return `${prefix}_${crypto.randomBytes(6).toString('hex')}`;
}

function list(collection, filter) {
  const items = readCollection(collection);
  if (!filter) return items;
  return items.filter((item) =>
    Object.entries(filter).every(([k, v]) => item[k] === v),
  );
}

function get(collection, id) {
  return readCollection(collection).find((it) => it.id === id) || null;
}

function create(collection, data, idPrefix = 'rec') {
  const items = readCollection(collection);
  const now = new Date().toISOString();
  const record = {
    id: newId(idPrefix),
    createdAt: now,
    updatedAt: now,
    ...data,
  };
  items.unshift(record);
  writeCollection(collection, items);
  return record;
}

function update(collection, id, patch) {
  const items = readCollection(collection);
  const idx = items.findIndex((it) => it.id === id);
  if (idx === -1) return null;
  const updated = {
    ...items[idx],
    ...patch,
    id: items[idx].id,
    createdAt: items[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };
  items[idx] = updated;
  writeCollection(collection, items);
  return updated;
}

function remove(collection, id) {
  const items = readCollection(collection);
  const next = items.filter((it) => it.id !== id);
  if (next.length === items.length) return false;
  writeCollection(collection, next);
  return true;
}

module.exports = {
  list,
  get,
  create,
  update,
  remove,
  newId,
  backend: BACKEND,
};
