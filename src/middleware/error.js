'use strict';

class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

function notFound(req, res) {
  res.status(404).json({
    error: 'not_found',
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
  });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error('[error]', err);
  }
  res.status(status).json({
    error: err.code || (status >= 500 ? 'internal_error' : 'bad_request'),
    message: err.message || 'Unexpected error',
    details: err.details,
  });
}

module.exports = { HttpError, notFound, errorHandler };
