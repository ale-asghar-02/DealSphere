const dotenv = require('dotenv').config();

if (!process.env.NODE_ENV) throw new Error('NODE_ENV environment variable is not set');
if (!process.env.CLIENT_URL) throw new Error('CLIENT_URL environment variable is not set');
if (!process.env.MONGO_URI) throw new Error('MONGO_URI environment variable is not set');
if (!process.env.JWT_ACCESS_SECRET) throw new Error('JWT_ACCESS_SECRET environment variable is not set');
if (!process.env.JWT_REFRESH_SECRET) throw new Error('JWT_REFRESH_SECRET environment variable is not set');
if (!process.env.RESET_PASSWORD_SECRET) throw new Error('RESET_PASSWORD_SECRET environment variable is not set');
if (!process.env.PORT) throw new Error('PORT environment variable is not set');
if (!process.env.SENDER_EMAIL) throw new Error('SENDER_EMAIL environment variable is not set');
if (!process.env.GOOGLE_CLIENT_ID) throw new Error('GOOGLE_CLIENT_ID environment variable is not set');
if (!process.env.COMPANY_NAME) throw new Error('COMPANY_NAME environment variable is not set');
if (!process.env.BREVO_API_KEY) throw new Error('BREVO_API_KEY environment variable is not set');
if (!process.env.CLOUDINARY_CLOUD_NAME) throw new Error('CLOUDINARY_CLOUD_NAME environment variable is not set');
if (!process.env.CLOUDINARY_API_KEY) throw new Error('CLOUDINARY_API_KEY environment variable is not set');
if (!process.env.CLOUDINARY_API_SECRET) throw new Error('CLOUDINARY_API_SECRET environment variable is not set');
if (!process.env.STRIPE_SECRET_KEY) throw new Error('STRIPE_SECRET_KEY environment variable is not set');
if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET environment variable is not set');
if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY environment variable is not set');
if (!process.env.GEMINI_MODEL) throw new Error('GEMINI_MODEL environment variable is not set');
if (!process.env.GEMINI_IMAGE_MODEL) throw new Error('GEMINI_IMAGE_MODEL environment variable is not set');

const config = {
    NODE_ENV: process.env.NODE_ENV,
    CLIENT_URL: process.env.CLIENT_URL,
    MONGO_URI: process.env.MONGO_URI,
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    RESET_PASSWORD_SECRET: process.env.RESET_PASSWORD_SECRET,
    PORT: process.env.PORT,
    SENDER_EMAIL: process.env.SENDER_EMAIL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    COMPANY_NAME: process.env.COMPANY_NAME,
    BREVO_API_KEY: process.env.BREVO_API_KEY,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    GEMINI_IMAGE_MODEL: process.env.GEMINI_IMAGE_MODEL,

    AI_TIMEOUT_MS: 15000,
    AI_MIN_COOLDOWN_SECONDS: 5,
};

module.exports = config;