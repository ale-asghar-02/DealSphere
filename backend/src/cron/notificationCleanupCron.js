const cron = require('node-cron');
const notificationModel = require('../models/notificationModel');
const logger = require('../utils/logger');

const startNotificationCleanupCron = () => {
  // Har roz raat 2 baje chalega
  cron.schedule('0 2 * * *', async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await notificationModel.deleteMany({
        isRead: true,
        createdAt: { $lt: thirtyDaysAgo },
      });

      logger.info(`Notification cleanup: ${result.deletedCount} old notifications removed`);
    } catch (error) {
      logger.error(`Notification cleanup failed: ${error.message}`);
    }
  });
};

module.exports = startNotificationCleanupCron;