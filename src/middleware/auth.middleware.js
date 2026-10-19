'use strict';

/**
 * AyushBasket E-Commerce Backend
 * Copyright (c) 2026 AyushBasket
 * SPDX-License-Identifier: UNLICENSED
 *
 * Middleware: Authentication & Authorization Guard
 * Purpose: Validates JWT bearer tokens and checks role-based access permissions
 */

const jwt = require('jsonwebtoken');

/**
 * Validates JWT in Authorization: Bearer <token>
 */
const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (error) {
      console.error('[Auth Middleware] Invalid token:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token.' });
  }
};

/**
 * Verifies that the authenticated user possesses admin privileges
 */
const admin = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  } else if (req.user && req.user.id) {
    try {
      const { User } = require('../models');
      const user = await User.findByPk(req.user.id);
      if (user && user.role === 'admin') {
        req.user.role = 'admin';
        return next();
      }
    } catch (error) {
      console.error('[Auth Middleware] Error verifying admin role in DB:', error.message);
    }
  }
  
  return res.status(403).json({ success: false, message: 'Not authorized as an admin.' });
};

module.exports = { protect, admin };
