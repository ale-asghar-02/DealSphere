const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const withdrawalController = require("../controllers/withdrawalController");

//* ====================================== WITHDRAWALS (Request & My Requests) ======================================

router.post("/request", authMiddleware, withdrawalController.requestWithdrawal);
router.get("/my-requests", authMiddleware, withdrawalController.getMyWithdrawals);

//* =================================================================================================================

module.exports = router;