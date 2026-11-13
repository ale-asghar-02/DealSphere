const cron = require('node-cron');
const advertisementModel = require('../models/advertisementModel');
const productModel = require('../models/productModel');

const startFeatureExpiryCron = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();

      const adResult = await advertisementModel.updateMany(
        { isFeatured: true, featuredUntil: { $lte: now } },
        { $set: { isFeatured: false, featuredPlan: null, featuredUntil: null } }
      );

      const productResult = await productModel.updateMany(
        { 'featured.isFeatured': true, 'featured.until': { $lte: now } },
        { $set: { 'featured.isFeatured': false, 'featured.plan': null, 'featured.until': null } }
      );

      if (adResult.modifiedCount > 0) {
        console.log(`Featured expiry cron: ${adResult.modifiedCount} ads unfeatured`);
      }
      if (productResult.modifiedCount > 0) {
        console.log(`Featured expiry cron: ${productResult.modifiedCount} products unfeatured`);
      }
    } catch (error) {
      console.error('Featured expiry cron error:', error);
    }
  });
};

module.exports = startFeatureExpiryCron;