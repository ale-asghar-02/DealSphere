const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const optionalAuth = require('../middlewares/optionalAuth');
const userController = require('../controllers/userController');
const accountController = require('../controllers/accountController');
const paymentWebhookController = require('../controllers/paymentWebhookController');
const { deleteAccountLimiter, contactLimiter } = require("../middlewares/rateLimiter");
const { validateContact } = require("../validators/contactValidator");
const upload = require("../configs/multer");

//* ============================================= PUBLIC / GUEST ROUTES =============================================

router.get("/announcements/active", optionalAuth, userController.getActiveAnnouncements);
router.get("/profile/:usernameSlug", userController.getSellerProfile);

//* =================================================================================================================


//* ============================================= PRIVATE / USER ROUTES =============================================

router.get('/get-me', authMiddleware, userController.getMe);
router.post('/account/update', authMiddleware, upload.single("userImage"), userController.accountUpdate)

router.post("/account/delete/send-otp", authMiddleware, deleteAccountLimiter, accountController.sendDeleteOtp);
router.post("/account/delete/confirm", authMiddleware, deleteAccountLimiter, accountController.confirmAccountDelete);

//* =================================================================================================================


//* ================================================== USER REPORT ==================================================

router.post('/report', authMiddleware, userController.createReport);

//* =================================================================================================================


//* ======================================== CONTACT REQUEST (Guests & Users) =======================================

router.post('/submit/contact', contactLimiter, optionalAuth, upload.single("image"), validateContact, userController.submitContact);

//* =================================================================================================================


//* ============================================== PAYMENT VERIFICATION =============================================

router.get("/payments/verify-session", authMiddleware, paymentWebhookController.verifyCheckoutSession);

//* =================================================================================================================

module.exports = router;