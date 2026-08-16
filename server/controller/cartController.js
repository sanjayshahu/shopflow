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
  console.log("\n========== ADD TO CART CONTROLLER ==========");

  try {
    const { productId, quantity } = req.body;

    console.log("User ID:", req.user._id);
    console.log("Product ID:", productId);
    console.log("Quantity:", quantity);

    // 1. Find product
    console.log("Searching product in MongoDB...");

    const product = await Product.findById(productId);

    if (!product) {
      console.log("❌ Product not found");

      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    console.log("✅ Product found:", {
      id: product._id,
      name: product.name,
      price: product.price,
      stock: product.stock
    });

    // 2. Check stock
    if (product.stock < quantity) {
      console.log("❌ Insufficient stock");

      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} items available`
      });
    }

    // 3. Find user's cart
    console.log("Searching user's cart...");

    let cart = await Cart.findOne({
      user: req.user._id
    });

    // 4. Create cart if it doesn't exist
    if (!cart) {
      console.log("Cart doesn't exist. Creating new cart...");

      cart = await Cart.create({
        user: req.user._id,
        items: []
      });

      console.log("✅ Cart created:", cart._id);
    } else {
      console.log("✅ Existing cart found:", cart._id);
    }

    // 5. Check if product already exists in cart
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      console.log("Product already exists in cart");

      const newQuantity =
        existingItem.quantity + quantity;

      console.log("Existing quantity:", existingItem.quantity);
      console.log("Requested quantity:", quantity);
      console.log("New quantity:", newQuantity);

      // Check combined quantity against stock
      if (newQuantity > product.stock) {
        console.log("❌ Combined quantity exceeds stock");

        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} items available`
        });
      }

      existingItem.quantity = newQuantity;

      console.log("✅ Cart item quantity updated");

    } else {
      console.log("Product not in cart. Adding new item...");

      cart.items.push({
        product: productId,
        quantity
      });

      console.log("✅ Product added to cart");
    }

    // 6. Save cart
    console.log("Saving cart to MongoDB...");

    await cart.save();

    console.log("✅ Cart saved");

    // 7. Populate product information
    await cart.populate({
      path: "items.product",
      select: "name price image stock category"
    });

    console.log("✅ Cart populated");

    // 8. Send response
    return res.status(200).json({
      success: true,
      message: "Product added to cart",
      cart
    });

  } catch (error) {
    console.error("\n❌ ADD TO CART ERROR:");
    console.error(error);

    return res.status(500).json({
      success: false,
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
const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;

    // 1. Find the logged-in user's cart
    const cart = await Cart.findOne({
      user: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    // 2. Check whether product exists in cart
    const itemExists = cart.items.some(
      (item) => item.product.toString() === productId
    );

    if (!itemExists) {
      return res.status(404).json({
        message: "Product is not in cart"
      });
    }

    // 3. Remove the item
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    // 4. Save cart
    await cart.save();

    // 5. Populate products
    await cart.populate({
      path: "items.product",
      select: "name price image stock category"
    });

    return res.status(200).json({
      message: "Product removed from cart",
      cart
    });

  } catch (error) {
    console.error("Remove cart item error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({
      user: req.user._id
    });

    if (!cart) {
      return res.status(404).json({
        message: "Cart not found"
      });
    }

    cart.items = [];

    await cart.save();

    return res.status(200).json({
      message: "Cart cleared successfully",
      cart
    });

  } catch (error) {
    console.error("Clear cart error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};
module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart
};