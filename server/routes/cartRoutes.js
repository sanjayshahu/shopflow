const express = require("express");

const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
} = require("../controller/cartController");

const validate = require("../middleware/validate");
const protect = require("../middleware/authMiddleware");

const {
  addToCartSchema
} = require("../validators/cartValidator");

const router = express.Router();

// Get cart
router.get(
  "/",
  protect,
  getCart
);

// Add product to cart
router.post(
  "/items",
  protect,
  validate(addToCartSchema),
  addToCart
);

// Update cart item
router.patch(
  "/items/:productId",
  protect,
  updateCartItem
);

// Delete cart item
router.delete(
  "/items/:productId",
  protect,
  removeCartItem
);

// Clear cart
router.delete(
  "/",
  protect,
  clearCart
);

module.exports = router;