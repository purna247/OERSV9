function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function toInt(v, fallback = null) {
  if (v === null || v === undefined || v === '') return fallback;
  const n = Number.parseInt(String(v).replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

function normaliseHeader(str) {
  return String(str || '')
    .toUpperCase()
    .replace(/[\s\-_]/g, '');
}

function makeError(status, message, code) {
  const err = new Error(message);
  err.status = status;
  if (code) err.code = code;
  return err;
}

module.exports = {
  isNonEmptyString,
  toInt,
  normaliseHeader,
  makeError,
};

