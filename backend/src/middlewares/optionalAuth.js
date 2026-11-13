const jwt = require('jsonwebtoken');
const config = require('../configs/config');
const userModel = require('../models/userModel');

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) { return next() }

    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
    } catch (err) {
      return next();
    }

    const user = await userModel.findById(decoded.id).select('role accountType moderation');

    if (!user || user.moderation.isBanned) {
      return next();
    }

    if (user.moderation.suspendedUntil && user.moderation.suspendedUntil > new Date()) {
      return next();
    }

    req.user = {
      id: decoded.id,
      sessionId: decoded.sessionId,
      role: user.role,
      accountType: user.accountType,
    };

    next();
  } catch (error) {
    next();
  }
};

module.exports = optionalAuth;