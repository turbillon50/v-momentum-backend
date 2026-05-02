'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

const RUNTIME_DIR = config.paths.runtime;

function ensureRuntimeDir() {
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  }
}

function filePath(collection) {
  return path.join(RUNTIME_DIR, `${collection}.json`);
}

function readCollection(collection) {
  ensureRuntimeDir();
  const file = filePath(collection);
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

function writeCollection(collection, items) {
  ensureRuntimeDir();
  fs.writeFileSync(filePath(collection), JSON.stringify(items, null, 2), 'utf8');
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
};
