const express = require("express");
const multer = require("multer");
const AppError = require("../utils/AppError");

const router = express.Router();

const authMiddleware = require("../middlewares/authMiddleware");
const designController = require("../controllers/aiControllers/designController");
const designSubscriptionController = require("../controllers/aiControllers/designSubscriptionController");
const { designUserLimiter, designGlobalLimiter, looseLimiter } = require("../middlewares/rateLimiter");
const { validate, schemas } = require("../validators/designValidator");
const { IMAGE } = require("../configs/designConfig");

/* ------------------------------------------------------------------ */
/* Reference image upload (sirf JPG / PNG / WebP, memory mein)         */
/* ------------------------------------------------------------------ */
const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: IMAGE.MAX_REF_IMAGE_BYTES, files: 1 },
  fileFilter: (req, file, cb) => {
    if (["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) return cb(null, true);
    cb(new AppError("Only JPG, PNG or WebP images are allowed.", 400), false);
  },
}).single("image");

const uploadImage = (req, res, next) => {
  imageUpload(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? `Image is too large. Maximum size is ${IMAGE.MAX_REF_IMAGE_BYTES / (1024 * 1024)}MB.`
          : "Invalid image upload.";
      return next(new AppError(message, 400));
    }
    next(err);
  });
};

// Jo endpoints Gemini ko call karte hain unpar dono limiter lagte hain
const aiLimits = [designGlobalLimiter, designUserLimiter];

//* ================================================= PUBLIC ROUTES =================================================

router.get("/config", looseLimiter, designController.getConfig);
router.get("/plans", looseLimiter, designSubscriptionController.readPlans);

//* =================================================================================================================


//* ================================================= LOGIN REQUIRED ================================================

router.use(authMiddleware);

//* =================================================================================================================


//* ============================================== DESIGN SUBSCRIPTION ==============================================

router.get("/subscription", designSubscriptionController.getMySubscription);
router.post("/subscription/purchase", looseLimiter, validate({ body: schemas.purchaseBody }), designSubscriptionController.purchaseDesignPlan);

//* =================================================================================================================


//* ================================================== DESIGN USAGE =================================================

router.get("/usage", designController.getUsage);

//* =================================================================================================================


//* ================================================ DESIGN SESSIONS ================================================

router.get("/sessions", validate({ query: schemas.listQuery }), designController.listSessions);

router.post("/sessions", ...aiLimits, designController.requireVerified, uploadImage, validate({ body: schemas.createSessionBody }), designController.createSession);

router.get("/sessions/:id", validate({ params: schemas.idParams }), designController.getSession);
router.post("/sessions/delete/:id", validate({ params: schemas.idParams }), designController.deleteSession);

router.post("/sessions/:id/answers", ...aiLimits, designController.requireVerified, validate({ params: schemas.idParams, body: schemas.answerBody }), designController.submitAnswer);

router.post("/sessions/:id/generate", ...aiLimits, designController.requireVerified, validate({ params: schemas.idParams }), designController.generate);

router.post("/sessions/:id/edit", ...aiLimits, designController.requireVerified, validate({ params: schemas.idParams, body: schemas.editBody }), designController.editDesign);

router.get("/sessions/:id/versions/:versionId/download", validate({ params: schemas.versionParams }), designController.downloadVersion);

//* =================================================================================================================

module.exports = router;