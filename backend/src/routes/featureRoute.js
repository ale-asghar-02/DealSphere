const express = require('express');
const router = express.Router();
const featureController = require('../controllers/featureController');
const authMiddleware = require('../middlewares/authMiddleware');
const { looseLimiter } = require('../middlewares/rateLimiter');

//* ================================================= PUBLIC ROUTES =================================================

router.get('/plans', looseLimiter, featureController.getFeaturePlans);

//* =================================================================================================================


//* ======================================== FEATURE ROUTES (Login Required) ========================================

router.get('/status/:itemType/:itemId', authMiddleware, featureController.getFeatureStatus);
router.post('/checkout/:itemType/:itemId', authMiddleware, looseLimiter, featureController.createCheckoutSession);
router.post('/feature-with-subscription/:itemType/:itemId', authMiddleware, looseLimiter, featureController.featureWithSubscription);

//* =================================================================================================================

module.exports = router;