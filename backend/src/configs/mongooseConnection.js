const mongoose = require('mongoose');
const config = require('./config');
const logger = require('../utils/logger');

const mongooseConnection = async () => {
  try {
    await mongoose.connect(config.MONGO_URI);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

module.exports = mongooseConnection;