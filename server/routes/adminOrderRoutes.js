const express = require("express");

const {
  getAllOrders,
  updateOrderStatus,
  getOrderStats
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
router.get(
  "/stats",
  protect,
  admin,
  getOrderStats
);

module.exports = router;