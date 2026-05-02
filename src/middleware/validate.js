'use strict';

const { HttpError } = require('./error');

function requireFields(body, fields) {
  const missing = fields.filter((f) => {
    const v = body?.[f];
    return v === undefined || v === null || (typeof v === 'string' && !v.trim());
  });
  if (missing.length) {
    throw new HttpError(400, 'Missing required fields', { missing });
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isEmail(v) {
  return typeof v === 'string' && EMAIL_RE.test(v.trim());
}

function pick(obj, keys) {
  const out = {};
  for (const k of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, k)) {
      out[k] = obj[k];
    }
  }
  return out;
}

module.exports = { requireFields, isEmail, pick };
