const cron = require('node-cron');
const userModel = require('../models/userModel');
const { sendNotification } = require('../socket/notificationSocket');
const { restoreTemplate, sendEmail } = require('../utils/mailor');
const { restoreSellerListings } = require('../utils/moderationHelper');

cron.schedule('0 0 * * *', async () => {
  try {
    const expiredUsers = await userModel.find({
      'moderation.suspendedUntil': { $lte: new Date() },
      'moderation.isBanned': false,
    });

    for (const user of expiredUsers) {
      user.moderation.suspendedUntil = null;
      user.moderation.suspendedDuration = null;
      user.moderation.reason = null;
      await user.save();

      if (user.accountType === 'seller') {
        await restoreSellerListings(user._id);
      }

      await sendEmail(user.email, restoreTemplate(user.username));

      await sendNotification({
        userId: user._id,
        type: 'moderation',
        title: 'Account Restored',
        message: 'Your suspension period has ended. Your account is now fully active.',
        metadata: { action: 'auto-restore' },
      });
    }

    console.log(`Suspension cron: ${expiredUsers.length} users auto-restored`);
  } catch (error) {
    console.error('Suspension cron failed:', error.message);
  }
});