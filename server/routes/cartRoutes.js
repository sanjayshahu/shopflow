const express = require("express");

const {
  getCart
} = require("../controller/cartController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/",
  protect,
  getCart
);

module.exports = router;