const userModel = require('../../models/userModel');
const AppError = require('../../utils/AppError');
const { sendNotification } = require("../../socket/notificationSocket");
const { banTemplate, suspendTemplate, restoreTemplate, sendEmail } = require('../../utils/mailor');
const { calculateSuspendUntil, hideSellerListings, restoreSellerListings } = require('../../utils/moderationHelper');

const getUsersModerationStatus = async (req, res, next) => {
  try {
    const users = await userModel
      .find()
      .select('username email userImage role accountType moderation deletion.isDeleted createdAt')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      status: 'success',
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

const banUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return next(new AppError('Ban reason is required', 400));
    }

    const user = await userModel.findById(id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    if (user.role === 'admin') {
      return next(new AppError('Admins cannot be banned', 400));
    }

    user.moderation.isBanned = true;
    user.moderation.reason = reason;
    user.moderation.bannedAt = new Date();
    user.moderation.bannedBy = req.user.id;
    user.moderation.suspendedUntil = null;
    user.moderation.suspendedDuration = null;
    await user.save();

    if (user.accountType === 'seller') {
      await hideSellerListings(user._id);
    }

    await sendEmail(user.email, banTemplate(user.username, reason));

    await sendNotification({
      userId: user._id,
      type: 'moderation',
      title: 'Account Banned',
      message: reason,
      metadata: { action: 'ban' },
    });

    return res.status(200).json({
      status: 'success',
      message: 'User banned successfully',
    });
  } catch (error) {
    next(error);
  }
};

const suspendUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, duration } = req.body;

    if (!reason || !duration) {
      return next(new AppError('Reason and duration are required', 400));
    }
    if (!['1m', '3m', '6m', '1y'].includes(duration)) {
      return next(new AppError('Invalid duration. Use 1m, 3m, 6m or 1y', 400));
    }

    const user = await userModel.findById(id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    if (user.role === 'admin') {
      return next(new AppError('Admins cannot be suspended', 400));
    }

    const suspendedUntil = calculateSuspendUntil(duration);

    user.moderation.isBanned = false;
    user.moderation.reason = reason;
    user.moderation.bannedAt = null;
    user.moderation.bannedBy = req.user.id;
    user.moderation.suspendedUntil = suspendedUntil;
    user.moderation.suspendedDuration = duration;
    await user.save();

    if (user.accountType === 'seller') {
      await hideSellerListings(user._id);
    }

    await sendEmail(user.email, suspendTemplate(user.username, reason, suspendedUntil));

    await sendNotification({
      userId: user._id,
      type: 'moderation',
      title: 'Account Suspended',
      message: reason,
      metadata: { action: 'suspend', suspendedUntil },
    });

    return res.status(200).json({
      status: 'success',
      message: 'User suspended successfully',
    });
  } catch (error) {
    next(error);
  }
};

const unbanUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await userModel.findById(id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }
    if (!user.moderation.isBanned && !user.moderation.suspendedUntil) {
      return next(new AppError('User is not banned or suspended', 400));
    }

    user.moderation.isBanned = false;
    user.moderation.reason = null;
    user.moderation.bannedAt = null;
    user.moderation.bannedBy = null;
    user.moderation.suspendedUntil = null;
    user.moderation.suspendedDuration = null;
    await user.save();

    if (user.accountType === 'seller') {
      await restoreSellerListings(user._id);
    }

    await sendEmail(user.email, restoreTemplate(user.username));

    await sendNotification({
      userId: user._id,
      type: 'moderation',
      title: 'Account Restored',
      message: 'Your account has been restored and is now fully active.',
      metadata: { action: 'restore' },
    });

    return res.status(200).json({
      status: 'success',
      message: 'User restored successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsersModerationStatus, banUser, suspendUser, unbanUser };