const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  if (err.name === 'CastError') {
    err.message = 'Resource not found';
    err.statusCode = 404;
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err.message = `${field} already exists`;
    err.statusCode = 400;
  }

  if (err.name === 'ValidationError') {
    err.message = Object.values(err.errors).map(val => val.message).join(', ');
    err.statusCode = 400;
  }

  if (err.name === 'JsonWebTokenError') {
    err.message = 'Invalid token, please login again';
    err.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    err.message = 'Token expired, please login again';
    err.statusCode = 401;
  }

  if (err.statusCode >= 500) {
    logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}\n${err.stack}`);
  } else {
    logger.warn(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  }

  res.status(err.statusCode).json({
    success: false,
    message: err.message,
    ...(err.data || {})
  });
};

module.exports = errorHandler;