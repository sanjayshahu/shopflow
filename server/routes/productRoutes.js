const express = require("express");

const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require("../controller/productController");

const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");


const router = express.Router();

router.post(
  "/",
  protect,
  adminOnly,//middleares
  createProduct//method
);

router.get("/", getProducts);
router.get("/:id", getProductById);
router.patch(
  "/:id",
  protect,
  adminOnly,
  updateProduct
);
router.delete(
  "/:id",
  protect,
  adminOnly,
  deleteProduct
);
module.exports = router;