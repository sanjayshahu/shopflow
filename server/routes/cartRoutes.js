const express = require("express");

const {
  getCart,
  addToCart,
  updateCartItem
} = require("../controller/cartController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();
router.post(
  "/items",
  protect,
  addToCart
);

router.get(
  "/",
  protect,
  getCart
);
router.patch(
  "/items/:productId",
  protect,
  updateCartItem
);

module.exports = router;