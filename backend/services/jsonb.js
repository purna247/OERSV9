function parseJsonbArray(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : null;
    } catch (_e) {
      return null;
    }
  }
  if (typeof value === 'object') {
    // pg can return jsonb as object; ensure it's an array
    return Array.isArray(value) ? value : null;
  }
  return null;
}

module.exports = { parseJsonbArray };

