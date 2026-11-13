const jwt = require('jsonwebtoken');
const config = require('../configs/config');
const AppError = require('../utils/AppError');
const userModel = require('../models/userModel');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

    if (!token) {
      return next(new AppError('Not authenticated', 401));
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_ACCESS_SECRET);
    } catch (err) {
      return next(new AppError('Access token invalid or expired', 401));
    }

    const user = await userModel
    .findById(decoded.id)
    .select('role accountType moderation deletion.isDeleted');

    if (!user || user.deletion?.isDeleted) {
      return next(new AppError('User not found', 401));
    }

    if (user.moderation.isBanned) {
      return next(new AppError(`Your account has been banned.`, 403));
    }

    if (user.moderation.suspendedUntil && user.moderation.suspendedUntil > new Date()) {
      return next(
        new AppError(
          `Your account is suspended until ${user.moderation.suspendedUntil.toDateString()}.`,
          403
        )
      );
    }

    req.user = {
      id: decoded.id,
      sessionId: decoded.sessionId,
      role: user.role,
      accountType: user.accountType,
    };

    next();
  } catch (error) {
    next(error);
  }
};

authMiddleware.isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new AppError('Access denied: admins only', 403));
  }
  next();
};

authMiddleware.isSeller = (req, res, next) => {
  if (req.user?.accountType !== 'seller') {
    return next(new AppError('Access denied: seller only', 403));
  }
  next();
};

module.exports = authMiddleware;