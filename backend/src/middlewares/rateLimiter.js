const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const config = require('../configs/config');
const { RATE_LIMITS } = require('../configs/designConfig');

const isDev = config.NODE_ENV !== 'production';

const authLimiter = rateLimit({
  windowMs: isDev ? 1 * 1000 : 15 * 60 * 1000, // dev: 1 sec | prod: 15 min
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit hit (authLimiter) — IP: ${req.ip}, Route: ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      message: "Too many attempts. Please try again after 15 minutes."
    });
  }
});

const looseLimiter = rateLimit({
  windowMs: isDev ? 1 * 1000 : 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit hit (looseLimiter) — IP: ${req.ip}, Route: ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      message: "Too many requests. Please slow down."
    });
  }
});

const messageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit hit (messageLimiter) — IP: ${req.ip}, Route: ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      message: "You're sending too many messages. Please wait a moment and try again."
    });
  }
});

const contactLimiter = rateLimit({
  windowMs: isDev ? 1 * 1000 : 15 * 60 * 1000, // dev: 1 sec | prod: 15 min
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit hit (contactLimiter) — IP: ${req.ip}, Route: ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      message: "Too many contact requests. Please try again later."
    });
  }
});

const deleteAccountLimiter = rateLimit({
  windowMs: isDev ? 1 * 1000 : 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => `delete:u:${req.user?.id}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit hit (deleteAccountLimiter) — User: ${req.user?.id}, Route: ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      message: "Too many attempts. Please try again after 15 minutes."
    });
  }
});

/* ------------------------- AI limiters ------------------------- */

// Chatbot: per IP (guest + logged-in dono)
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit hit (chatbotLimiter) — IP: ${req.ip}, Route: ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      message: "You're sending messages too fast. Please wait a moment."
    });
  }
});

// Poore app ki chatbot traffic ka cap (free tier quota bachane ke liye).
// Number apne AI Studio ke rate-limit page ke hisaab se rakhein.
// In-memory hai, isliye sirf single server instance par sahi kaam karta hai.
const chatbotGlobalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: () => "chatbot-global",
  standardHeaders: false,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Rate limit hit (chatbotGlobalLimiter)");
    res.status(429).json({
      success: false,
      message: "The assistant is busy right now. Please try again in a minute."
    });
  }
});

// Logged-in seller/admin ke AI endpoints (autofill, test, recheck): per user
// NOTE: authMiddleware ke BAAD lagana hai (req.user chahiye)
const aiUserLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  keyGenerator: (req) => `u:${req.user?.id}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit hit (aiUserLimiter) — User: ${req.user?.id}, Route: ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      message: "Too many AI requests. Please wait a minute."
    });
  }
});

/* ------------------------- Design Studio limiters ------------------------- */

// Per user (authMiddleware ke BAAD lagana hai)
const designUserLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: RATE_LIMITS.USER_PER_MINUTE,
  keyGenerator: (req) => `design:u:${req.user?.id}`,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit hit (designUserLimiter) — User: ${req.user?.id}, Route: ${req.originalUrl}`);
    res.status(429).json({
      success: false,
      message: "Too many design requests. Please wait a minute."
    });
  }
});

// Poore app ki Design Studio traffic ka cap (Gemini quota bachane ke liye); single instance par sahi
const designGlobalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: RATE_LIMITS.GLOBAL_PER_MINUTE,
  keyGenerator: () => "design-global",
  standardHeaders: false,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn("Rate limit hit (designGlobalLimiter)");
    res.status(429).json({
      success: false,
      message: "Design Studio is busy right now. Please try again in a minute."
    });
  }
});

module.exports = {
  authLimiter,
  looseLimiter,
  messageLimiter,
  contactLimiter,
  deleteAccountLimiter,
  chatbotLimiter,
  chatbotGlobalLimiter,
  aiUserLimiter,
  designUserLimiter,
  designGlobalLimiter,
};