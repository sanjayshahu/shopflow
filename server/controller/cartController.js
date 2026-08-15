const Cart = require("../models/Cart");

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

module.exports = {
  getCart
};