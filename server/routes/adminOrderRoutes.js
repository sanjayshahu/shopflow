const express = require("express");

const {
  getAllOrders,
  updateOrderStatus
} = require("../controller/adminOrderController");

const protect = require("../middleware/authMiddleware");
const admin = require("../middleware/adminMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  admin,
  getAllOrders
);

router.patch(
  "/:orderId/status",
  protect,
  admin,
  updateOrderStatus
);

module.exports = router;