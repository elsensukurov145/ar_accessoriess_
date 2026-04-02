/**
 * Global error handler middleware
 * Catches all errors and returns consistent JSON responses
 */
exports.errorHandler = (err, req, res, next) => {
  console.error('[ERROR]', {
    message: err.message,
    code: err.code,
    status: err.statusCode,
    stack: err.stack,
  });

  // Default error response
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Server Error';
  let details = undefined;

  // Handle specific error types
  if (err.code === 'ECONNREFUSED') {
    statusCode = 503;
    message = 'Database connection failed';
    details = 'Server temporarily unavailable';
  } else if (err.code === '42703') {
    statusCode = 500;
    message = 'Database schema error';
    details = err.detail || `Column not found: ${err.column}`;
  } else if (err.code === '23505') {
    statusCode = 409;
    message = 'Duplicate entry';
    details = err.detail || 'This record already exists';
  } else if (err.code === '23503') {
    statusCode = 400;
    message = 'Invalid reference';
    details = err.detail || 'Referenced record does not exist';
  } else if (err.isValidationError) {
    statusCode = 400;
    message = 'Validation error';
    details = err.details;
  }

  // Don't expose internal details in production
  const isDevelopment = process.env.NODE_ENV !== 'production';

  res.status(statusCode).json({
    success: false,
    message,
    ...(isDevelopment && details && { details }),
    ...(isDevelopment && err.code && { code: err.code }),
  });
};
