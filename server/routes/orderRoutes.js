const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById
} = require("../controller/orderController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, createOrder);

router.get("/", protect, getMyOrders);

router.get("/:orderId", protect, getOrderById);

module.exports = router;