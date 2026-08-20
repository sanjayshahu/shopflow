const express = require("express");

const {
  createPayment
} = require("../controller/paymentController");

const protect =
  require("../middleware/authMiddleware");

const router = express.Router();

router.post(
  "/create",
  protect,
  createPayment
);

module.exports = router;