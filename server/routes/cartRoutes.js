const express = require("express");

const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem
} = require("../controller/cartController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();
router.get(
  "/",
  protect,
  getCart
);

router.post(
  "/items",
  protect,
  addToCart
);


router.patch(
  "/items/:productId",
  protect,
  updateCartItem
);
router.delete(
  "/items/:productId",
  protect,
  removeCartItem
);
module.exports = router;