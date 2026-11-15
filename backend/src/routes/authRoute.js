const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authValidator = require('../validators/authValidator');
const { authLimiter, looseLimiter } = require('../middlewares/rateLimiter');
const authMiddleware = require('../middlewares/authMiddleware');
const passport = require('../configs/passport')

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


//* ============================ GOOGLE AUTHENTICATION ============================

router.get( "/google", authLimiter,
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
    prompt: "select_account",
  }),
);

router.get( "/google/callback", authLimiter,
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user) => {
      req.user = err || !user ? null : user;
      next();
    })(req, res, next);
  },
  authController.googleCallback,
);

//* ===============================================================================

module.exports = router;