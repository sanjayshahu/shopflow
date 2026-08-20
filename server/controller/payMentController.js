const Order = require("../models/Order");

const createPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        success: false,
        message: "Order is already paid"
      });
    }

    // Simulated payment ID
    const paymentId =
      `MOCK_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    order.paymentId = paymentId;
    order.paymentStatus = "paid";

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Payment successful",
      paymentId,
      order
    });

  } catch (error) {
    console.error("Create payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Payment failed"
    });
  }
};

module.exports = {
  createPayment
};