const express = require("express");

const {
  createPayment,
  verifyPayment,
  handleWebhook
} = require("../controller/paymentController");

const protect =
  require("../middleware/authMiddleware");

const router = express.Router();


// ==========================================
// CREATE PAYMENT
// ==========================================

router.post(
  "/create",
  protect,
  createPayment
);


// ==========================================
// VERIFY PAYMENT
// ==========================================

router.post(
  "/verify",
  protect,
  verifyPayment
);


// ==========================================
// RAZORPAY WEBHOOK
// ==========================================

// No JWT authentication here.
// Razorpay calls this endpoint directly.
// Security is handled using webhook signature.

router.post(
  "/webhook",
  handleWebhook
);


module.exports = router;