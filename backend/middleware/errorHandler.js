function errorHandler(err, req, res, _next) {
  const status = Number.isInteger(err.status) ? err.status : 500;
  const message = err.message || 'Internal Server Error';
  const payload = { error: true, message };
  if (err.code) payload.code = err.code;

  if (status >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }
  res.status(status).json(payload);
}

module.exports = errorHandler;

