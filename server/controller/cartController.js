const Cart = require("../models/Cart");
const Product = require("../models/Product");

const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({
      user: req.user._id
    }).populate({
      path: "items.product",
      select: "name price image stock category"
    });

    // If user doesn't have a cart yet,
    // create an empty cart.
    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: []
      });
    }

    return res.status(200).json({
      cart
    });

  } catch (error) {
    console.error("Get cart error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    // 1. Validate input
    if (!productId) {
      return res.status(400).json({
        message: "Product ID is required"
      });
    }

    const requestedQuantity = Number(quantity);

    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({
        message: "Quantity must be a positive integer"
      });
    }

    // 2. Find product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // 3. Check stock
    if (product.stock < requestedQuantity) {
      return res.status(400).json({
        message: `Only ${product.stock} items available`
      });
    }

    // 4. Find user's cart
    let cart = await Cart.findOne({
      user: req.user._id
    });

    // 5. Create cart if it doesn't exist
    if (!cart) {
      cart = await Cart.create({
        user: req.user._id,
        items: []
      });
    }

    // 6. Check whether product already exists in cart
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      const newQuantity =
        existingItem.quantity + requestedQuantity;

      // Make sure combined quantity doesn't exceed stock
      if (newQuantity > product.stock) {
        return res.status(400).json({
          message: `Only ${product.stock} items available`
        });
      }

      existingItem.quantity = newQuantity;
    } else {
      // 7. Add new item
      cart.items.push({
        product: productId,
        quantity: requestedQuantity
      });
    }

    // 8. Save cart
    await cart.save();

    // 9. Return populated cart
    await cart.populate({
      path: "items.product",
      select: "name price image stock category"
    });

    return res.status(200).json({
      message: "Product added to cart",
      cart
    });

  } catch (error) {
    console.error("Add to cart error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};
const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    // 1. Validate quantity
    const requestedQuantity = Number(quantity);

    if (
      !Number.isInteger(requestedQuantity) ||
      requestedQuantity < 1
    ) {
      return res.status(400).json({
        message: "Quantity must be a positive integer"
      });
    }

    // 2. Find product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    // 3. Check stock
    if (requestedQuantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} items available`
      });
    }

    // 4. Find user's cart
    const cart = await Cart.findOne({
      user: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    // 5. Find product inside cart
    const cartItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (!cartItem) {
      return res.status(404).json({
        message: "Product is not in cart"
      });
    }

    // 6. Update quantity
    cartItem.quantity = requestedQuantity;

    // 7. Save
    await cart.save();

    // 8. Populate products
    await cart.populate({
      path: "items.product",
      select: "name price image stock category"
    });

    return res.status(200).json({
      message: "Cart updated successfully",
      cart
    });

  } catch (error) {
    console.error("Update cart error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem
};