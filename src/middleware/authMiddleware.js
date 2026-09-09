const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Add user info to request object
      req.user = decoded;

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token.' });
  }
};

const admin = async (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  } else if (req.user && req.user.id) {
    try {
      const { User } = require('../models');
      const user = await User.findByPk(req.user.id);
      if (user && user.role === 'admin') {
        req.user.role = 'admin'; // update the req.user object
        return next();
      }
    } catch (error) {
      console.error('Error verifying admin role in DB:', error);
    }
  }
  
  res.status(403).json({ success: false, message: 'Not authorized as an admin.' });
};

module.exports = { protect, admin };
