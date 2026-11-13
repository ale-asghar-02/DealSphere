const express = require('express')
const app = express();
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const config = require('./src/configs/config')
const mongooseConnection = require('./src/configs/mongooseConnection');
const errorHandler = require('./src/middlewares/errorHandler');
const logger = require('./src/utils/logger');
const { stripeWebhook } = require("./src/controllers/paymentWebhookController");
const { initializeSocket } = require('./src/socket/chatSocket');

//* Process-level safety nets (server crash se bachne ke liye)
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled Rejection: ${reason?.stack || reason}`);
});

process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err?.stack || err}`);
  process.exit(1);
});

// Hosting proxy ke peeche real client IP milne ke liye (rate limiter ko zaroori hai)
app.set('trust proxy', 1);

mongooseConnection();

//* Crons
const { startExpiryJob } = require("./src/cron/expiryJob");
const startFeatureExpiryCron = require('./src/cron/featureExpiryCron');
const startNotificationCleanupCron = require('./src/cron/notificationCleanupCron');
const startSubscriptionExpiryCron = require("./src/cron/subscriptionCron");
const startDesignSubscriptionCron = require("./src/cron/designSubscriptionCron");
const { type } = require('os');

startExpiryJob();
startFeatureExpiryCron();
startNotificationCleanupCron();
startSubscriptionExpiryCron();
startDesignSubscriptionCron();

app.get("/health", (req, res)=> {
  res.status(200).json({ message : "server is running"});
})

//* Middlewares
app.post("/payments/webhook", express.raw({ type: "application/json" }), stripeWebhook );
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({ origin: config.CLIENT_URL, credentials: true }));

//* Routes
app.use('/ai', require('./src/routes/aiRoute'));
app.use('/auth/user', require('./src/routes/authRoute'));
app.use('/user', require('./src/routes/userRoute'));
app.use('/admin', require('./src/routes/adminRoute'));
app.use('/category', require('./src/routes/categoryRoute'));
app.use('/ads', require('./src/routes/advertisementRoute'));
app.use('/chat', require('./src/routes/chatRoute'));
app.use('/feature', require('./src/routes/featureRoute'));
app.use('/notification', require('./src/routes/notificationRoute'));
app.use('/product', require('./src/routes/productRoute'));
app.use('/cart', require('./src/routes/cartRoute'));
app.use('/order', require('./src/routes/orderRoute'));
app.use('/wishlist', require('./src/routes/wishlistRoute'));
app.use('/subscription', require('./src/routes/subscriptionRoute'));
app.use('/design', require('./src/routes/designRoute'));
app.use('/search', require('./src/routes/searchRoute'));
app.use('/wallet', require('./src/routes/walletRoute'));
app.use('/withdrawal', require('./src/routes/withdrawalRoute'));
app.use('/article', require('./src/routes/articleRoutes'));

//* 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

//* Global error handler
app.use(errorHandler);

//* HTTP server banao Express app se, aur usi pe socket.io attach karo
const server = http.createServer(app);
initializeSocket(server);

server.listen(config.PORT, () => {
  logger.info(`Server is running on Port ${config.PORT}`);
});