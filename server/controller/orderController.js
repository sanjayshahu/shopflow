const mongoose = require('mongoose');
const Cart = require("../models/Cart");
const Product = require("../models/Product");
const Order = require("../models/Order");

const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. Find user's cart
    const cart = await Cart.findOne({
      user: req.user._id
    })
      .populate("items.product")
      .session(session);

    if (!cart) {
      await session.abortTransaction();

      return res.status(404).json({
        message: "Cart not found"
      });
    }

    // 2. Check empty cart
    if (cart.items.length === 0) {
      await session.abortTransaction();

      return res.status(400).json({
        message: "Cannot create order with empty cart"
      });
    }

    // 3. Validate stock
    for (const item of cart.items) {
      const product = item.product;

      if (!product) {
        await session.abortTransaction();

        return res.status(400).json({
          message: "One of the products no longer exists"
        });
      }

      if (product.stock < item.quantity) {
        await session.abortTransaction();

        return res.status(400).json({
          message: `Insufficient stock for ${product.name}`
        });
      }
    }

    // 4. Calculate total
    let totalAmount = 0;

    for (const item of cart.items) {
      totalAmount += item.product.price * item.quantity;
    }

    // 5. Create order snapshot
    const orderItems = cart.items.map((item) => ({
      product: item.product._id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity
    }));

    // 6. Create order INSIDE transaction
    const orders = await Order.create(
      [
        {
          user: req.user._id,
          items: orderItems,
          totalAmount,
          status: "pending"
        }
      ],
      { session }
    );

    const order = orders[0];

    // 7. Reduce stock INSIDE transaction
    for (const item of cart.items) {
      const product = item.product;

      product.stock -= item.quantity;

      await product.save({ session });
    }

    // 8. Clear cart INSIDE transaction
    cart.items = [];

    await cart.save({ session });

    // 9. Everything succeeded
    await session.commitTransaction();

    return res.status(201).json({
      message: "Order created successfully",
      order
    });

  } catch (error) {

    // Something failed
    await session.abortTransaction();

    console.error("Create order error:", error);

    return res.status(500).json({
      message: "Order creation failed"
    });

  } finally {
    session.endSession();
  }
};
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      user: req.user._id
    })
      .populate("items.product", "name price image category")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error("Get orders error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id
    }).populate(
      "items.product",
      "name price image category"
    );

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    return res.status(200).json({
      order
    });

  } catch (error) {
    console.error("Get order error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};
module.exports = {
  createOrder,
  getMyOrders,
  getOrderById 
};