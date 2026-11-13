const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authValidator = require('../validators/authValidator');
const { authLimiter, looseLimiter } = require('../middlewares/rateLimiter');
const authMiddleware = require('../middlewares/authMiddleware');

//* ================================================= AUTHENTICATION ================================================

router.post('/register', authLimiter, authValidator.validateRegister, authController.register);
router.post('/login', authLimiter, authValidator.validateLogin, authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.post('/logout/all-devices', authMiddleware, authController.logoutAllDevices)
router.post('/refresh-token', looseLimiter, authController.refreshToken);

//* =================================================================================================================


//* ============================================== ACCOUNT VERIFICATION =============================================

router.post('/send-verify-otp', authLimiter, authController.sendVerifyOtp);
router.post('/verify-account', authLimiter, authValidator.validateVerifyOtp, authController.verifyAccount);

//* =================================================================================================================


//* ================================================= PASSWORD RESET ================================================

router.post('/reset-otp', authLimiter, authController.sendResetOtp);
router.post('/verify-reset-otp', authLimiter, authValidator.validateVerifyOtp, authController.verifyResetOtp);
router.post('/forgot-password', authLimiter, authValidator.validateResetPassword, authController.resetPassword);

//* =================================================================================================================


//* ============================================= GOOGLE AUTHENTICATION =============================================

router.post('/google-auth', authLimiter, authController.googleAuth);

//* =================================================================================================================

module.exports = router;