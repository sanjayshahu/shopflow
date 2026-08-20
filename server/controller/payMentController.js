const Order = require("../models/Order");
const razorpay = require("../config/razorpay");

const createPayment = async (req, res) => {
  try {
    const { orderId } = req.body;

    // 1. Validate orderId
    if (!orderId) {
      return res.status(400).json({
        message: "Order ID is required"
      });
    }

    // 2. Find order belonging to logged-in user
    const order = await Order.findOne({
      _id: orderId,
      user: req.user._id
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found"
      });
    }

    // 3. Don't create another payment for already-paid order
    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Order is already paid"
      });
    }

    // 4. If Razorpay order already exists,
    // don't create another one
    if (order.razorpayOrderId) {
      return res.status(200).json({
        message: "Payment order already exists",

        orderId: order._id,

        razorpayOrderId: order.razorpayOrderId,

        amount: order.totalAmount * 100,

        currency: "INR",

        key: process.env.RAZORPAY_KEY_ID
      });
    }

    // 5. Create Razorpay order
    const options = {
      amount: order.totalAmount * 100,
      currency: "INR",

      // Your MongoDB Order ID
      receipt: order._id.toString()
    };

    const paymentOrder =
      await razorpay.orders.create(options);

    // 6. Save Razorpay Order ID
    order.razorpayOrderId = paymentOrder.id;

    await order.save();

    // 7. Send payment information to client
    return res.status(200).json({
      message: "Payment order created",

      // Your MongoDB Order ID
      orderId: order._id,

      // Razorpay Order ID
      razorpayOrderId: paymentOrder.id,

      // Amount in paise
      amount: paymentOrder.amount,

      currency: paymentOrder.currency,

      // Public key can be sent to frontend
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error(
      "Create payment error:",
      error
    );

    return res.status(500).json({
      message: "Payment creation failed"
    });
  }
};

module.exports = {
  createPayment
};