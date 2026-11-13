const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const walletController = require("../controllers/walletController");

//* ======================================== WALLET (Balance & Transactions) ========================================

router.get("/balance", authMiddleware, walletController.getMyWallet);
router.get("/transactions", authMiddleware, walletController.getMyTransactions);

//* =================================================================================================================

module.exports = router;