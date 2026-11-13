const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');

const adminStatsController = require('../controllers/admin/adminStatsController');
const adminSearchController = require('../controllers/admin/adminSearchController');
const userModerationController = require('../controllers/admin/userModerationController');
const categoryModerationController = require('../controllers/admin/categoryModerationController');
const reportModerationController = require('../controllers/admin/reportModerationController');
const contactModerationController = require("../controllers/admin/contactModerationController");
const advertisementModerationController = require("../controllers/admin/advertisementModerationController");
const productModerationController = require("../controllers/admin/productModerationController");
const featurePlanModerationController = require("../controllers/admin/featurePlanModerationController");
const subscriptionModerationController = require("../controllers/admin/subscriptionModerationController");
const designSubscriptionModerationController = require('../controllers/admin/designSubscriptionModerationController');
const withdrawalModerationController = require("../controllers/admin/withdrawalModerationController");
const adminTransactionController = require("../controllers/admin/adminTransactionController");
const articleModerationController = require("../controllers/admin/articleModerationController");
const adminAnnouncementController = require("../controllers/admin/adminAnnouncementController");

// Every route below requires a logged-in user who is also an admin
router.use(authMiddleware, authMiddleware.isAdmin);

//* ========================================= STATS / ANALYTICS (Dashboard) =========================================

router.get("/stats/overview", adminStatsController.getOverview);
router.get("/stats/users-growth", adminStatsController.getUsersGrowth);
router.get("/stats/orders-revenue", adminStatsController.getOrdersRevenue);
router.get("/stats/listings-growth", adminStatsController.getListingsGrowth);
router.get("/stats/category-distribution", adminStatsController.getCategoryDistribution);
router.get("/stats/subscription-distribution", adminStatsController.getSubscriptionDistribution);
router.get("/stats/design-overview", adminStatsController.getDesignOverview);
router.get("/stats/recent-activity", adminStatsController.getRecentActivity);
router.get("/stats/revenue-chart", adminStatsController.getRevenueChart);

//* =================================================================================================================


//* ================================================= GLOBAL SEARCH =================================================

router.get("/search", adminSearchController.adminSearch)

//* =================================================================================================================


//* ================================================ USER MODERATION ================================================

router.get('/users/moderation', userModerationController.getUsersModerationStatus);
router.post('/user/ban/:id', userModerationController.banUser);
router.post('/user/suspend/:id', userModerationController.suspendUser);
router.post('/user/unban/:id', userModerationController.unbanUser);

//* =================================================================================================================


//* ============================================== CATEGORY MANAGEMENT ==============================================

router.get("/cat/all", categoryModerationController.getAllCategories);
router.post("/cat/create", categoryModerationController.createCategory);
router.post("/cat/update/:id", categoryModerationController.updateCategory);
router.post("/cat/toggle/:id", categoryModerationController.toggleCategory);
router.post("/cat/delete/:id", categoryModerationController.deleteCategory);

//* =================================================================================================================


//* ================================================== USER REPORTS =================================================

router.get("/reports", reportModerationController.getAllReports);
router.get("/report/:id", reportModerationController.getReportDetails);
router.post("/report/review/:id", reportModerationController.reviewReport);

//* =================================================================================================================


//* ======================================= CONTACT REQUESTS (Guests & Users) =======================================

router.get('/contact', contactModerationController.getAllContacts);
router.get('/contact/:id', contactModerationController.getContactById);
router.post('/contact/reply/:id', contactModerationController.replyToContact);
router.post('/contact/:id', contactModerationController.deleteContact);

//* =================================================================================================================


//* ============================================= SELLER ADVERTISEMENTS =============================================

router.get("/ad/read", advertisementModerationController.adminReadAds);
router.get("/ad/read/:id", advertisementModerationController.adminReadAdById);
router.post("/ad/approve/:id", advertisementModerationController.adminApproveAd);
router.post("/ad/reject/:id", advertisementModerationController.adminRejectAd);
router.post("/ad/delete/:id", advertisementModerationController.adminDeleteAd);

router.post("/ad/ban/:id", advertisementModerationController.adminBanAd);
router.post("/ad/unban/:id", advertisementModerationController.adminUnbanAd);

//* =================================================================================================================


//* ================================================ SELLER PRODUCTS ================================================

router.get("/product/read", productModerationController.adminReadProducts);
router.get("/product/read/:id", productModerationController.adminReadProductById);
router.post("/product/approve/:id", productModerationController.adminApproveProduct);
router.post("/product/reject/:id", productModerationController.adminRejectProduct);
router.post("/product/delete/:id", productModerationController.adminDeleteProduct);

router.post("/product/ban/:id", productModerationController.adminBanProduct);
router.post("/product/unban/:id", productModerationController.adminUnbanProduct);

//* =================================================================================================================


//* ========================================= FEATURE PLANS (Ads & Products) ========================================

router.get("/feature-plan/read", featurePlanModerationController.adminReadFeaturePlans);
router.get("/feature-plan/read/:id", featurePlanModerationController.adminReadFeaturePlanById);
router.post("/feature-plan/update/:id", featurePlanModerationController.adminUpdateFeaturePlan);
router.post("/feature-plan/toggle-active/:id", featurePlanModerationController.adminTogglePlanActive);

router.post("/feature-plan/discount/apply/:id", featurePlanModerationController.adminApplyDiscount);
router.post("/feature-plan/discount/remove/:id", featurePlanModerationController.adminRemoveDiscount);

//* =================================================================================================================


//* =========================================== SELLER SUBSCRIPTION PLANS ===========================================

router.get("/subscription/read", subscriptionModerationController.adminReadPlans);
router.get("/subscription/read/:id", subscriptionModerationController.adminReadPlanById);
router.post("/subscription/update/:id", subscriptionModerationController.adminUpdatePlan);
router.post("/subscription/toggle-active/:id", subscriptionModerationController.adminTogglePlanActive);

router.post("/subscription/discount/apply/:id", subscriptionModerationController.adminApplyDiscount);
router.post("/subscription/discount/remove/:id", subscriptionModerationController.adminRemoveDiscount);

router.get("/subscription/sellers", subscriptionModerationController.adminReadSellerSubscriptions);

//* =================================================================================================================


//* =========================================== DESIGN SUBSCRIPTION PLANS ===========================================

router.get("/design-subscription/read", designSubscriptionModerationController.adminReadDesignPlans);
router.get("/design-subscription/read/:id", designSubscriptionModerationController.adminReadDesignPlanById);
router.post("/design-subscription/update/:id", designSubscriptionModerationController.adminUpdateDesignPlan);
router.post("/design-subscription/toggle-active/:id", designSubscriptionModerationController.adminToggleDesignPlanActive);

router.post("/design-subscription/discount/apply/:id", designSubscriptionModerationController.adminApplyDesignDiscount);
router.post("/design-subscription/discount/remove/:id", designSubscriptionModerationController.adminRemoveDesignDiscount);

router.get("/design-subscription/users", designSubscriptionModerationController.adminReadDesignSubscribers);

//* =================================================================================================================


//* ================================================== WITHDRAWALS ==================================================

router.get("/withdrawals", withdrawalModerationController.getAllWithdrawals);
router.post("/withdrawals/:withdrawalId/complete", withdrawalModerationController.completeWithdrawal);
router.post("/withdrawals/:withdrawalId/reject", withdrawalModerationController.rejectWithdrawal);

//* =================================================================================================================


//* ================================================== TRANSACTIONS =================================================

router.get("/transactions", adminTransactionController.getAllTransactions);

//* =================================================================================================================


//* ==================================================== ARTICLES ===================================================

router.post("/article/create", articleModerationController.createArticle);
router.post("/article/update/:id", articleModerationController.updateArticle);
router.post("/article/delete/:id", articleModerationController.deleteArticle);

//* =================================================================================================================


//* ================================================= ANNOUNCEMENTS =================================================

router.post("/announcement/create", adminAnnouncementController.createAnnouncement);
router.get("/announcements", adminAnnouncementController.getAllAnnouncements);
router.post("/announcement/update/:id", adminAnnouncementController.updateAnnouncement);
router.post("/announcement/delete/:id", adminAnnouncementController.deleteAnnouncement);

//* =================================================================================================================

module.exports = router;