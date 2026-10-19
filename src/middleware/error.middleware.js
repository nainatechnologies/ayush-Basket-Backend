'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Middleware: Global Error Handler
 * Purpose: Formats consistent JSON error responses, handles ORM/JWT errors, and prevents stack trace leakage
 */

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || 'An unexpected server error occurred.';

  // Handle Sequelize validation errors
  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    message = err.errors ? err.errors.map(e => e.message).join(', ') : err.message;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired.';
  }

  // Log server-side 5xx errors
  if (statusCode >= 500) {
    console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err.message);
  }

  const responsePayload = {
    success: false,
    message
  };

  if (err.details) {
    responsePayload.details = err.details;
  }

  return res.status(statusCode).json(responsePayload);
};

module.exports = errorHandler;
