const crypto = require("crypto");
const mongoose = require("mongoose");

const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");

const razorpay = require("../config/razorpay");


// ==========================================
// CREATE RAZORPAY PAYMENT
// ==========================================

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

    // 3. Check if already paid
    if (order.paymentStatus === "paid") {
      return res.status(400).json({
        message: "Order is already paid"
      });
    }

    // 4. Don't create duplicate Razorpay order
    if (order.razorpayOrderId) {
      return res.status(200).json({
        message: "Payment order already exists",

        orderId: order._id,

        razorpayOrderId:
          order.razorpayOrderId,

        amount:
          order.totalAmount * 100,

        currency: "INR",

        key:
          process.env.RAZORPAY_KEY_ID
      });
    }

    // 5. Create Razorpay order
    const options = {
      amount: order.totalAmount * 100,
      currency: "INR",
      receipt: order._id.toString()
    };

    const paymentOrder =
      await razorpay.orders.create(options);

    // 6. Save Razorpay order ID
    order.razorpayOrderId =
      paymentOrder.id;

    await order.save();

    // 7. Send payment details
    return res.status(200).json({
      message: "Payment order created",

      orderId: order._id,

      razorpayOrderId:
        paymentOrder.id,

      amount:
        paymentOrder.amount,

      currency:
        paymentOrder.currency,

      key:
        process.env.RAZORPAY_KEY_ID
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

const handleWebhook = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    // ==========================================
    // 1. GET RAW BODY
    // ==========================================

    const rawBody = req.body;

    const webhookSignature =
      req.headers["x-razorpay-signature"];

    if (!webhookSignature) {
      return res.status(400).json({
        message: "Webhook signature missing"
      });
    }


    // ==========================================
    // 2. VERIFY WEBHOOK SIGNATURE
    // ==========================================

    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_WEBHOOK_SECRET
        )
        .update(rawBody)
        .digest("hex");

    if (
      expectedSignature !==
      webhookSignature
    ) {
      return res.status(400).json({
        message: "Invalid webhook signature"
      });
    }


    // ==========================================
    // 3. CONVERT RAW BODY TO JSON
    // ==========================================

    const event =
      JSON.parse(
        rawBody.toString()
      );

    console.log(
      "Razorpay webhook:",
      event.event
    );


    // ==========================================
    // 4. HANDLE PAYMENT CAPTURED
    // ==========================================

    if (
      event.event !==
      "payment.captured"
    ) {
      return res.status(200).json({
        message: "Event ignored"
      });
    }


    // ==========================================
    // 5. GET PAYMENT DATA
    // ==========================================

    const payment =
      event.payload.payment.entity;

    const razorpayOrderId =
      payment.order_id;

    const paymentId =
      payment.id;


    if (!razorpayOrderId) {
      return res.status(400).json({
        message:
          "Razorpay order ID missing"
      });
    }


    // ==========================================
    // 6. START TRANSACTION
    // ==========================================

    session.startTransaction();


    // ==========================================
    // 7. FIND ORDER
    // ==========================================

    const order =
      await Order.findOne({
        razorpayOrderId
      }).session(session);


    if (!order) {

      await session.abortTransaction();

      console.error(
        "Order not found:",
        razorpayOrderId
      );

      return res.status(404).json({
        message: "Order not found"
      });
    }


    // ==========================================
    // 8. IDEMPOTENCY CHECK
    // ==========================================

    if (
      order.paymentStatus === "paid"
    ) {

      await session.abortTransaction();

      console.log(
        "Payment already processed:",
        paymentId
      );

      return res.status(200).json({
        message:
          "Payment already processed"
      });
    }


    // ==========================================
    // 9. REDUCE STOCK
    // ==========================================

    for (const item of order.items) {

      const product =
        await Product.findById(
          item.product
        ).session(session);


      if (!product) {
        throw new Error(
          `Product not found: ${item.product}`
        );
      }


      // Check stock
      if (
        product.stock <
        item.quantity
      ) {
        throw new Error(
          `Insufficient stock for ${product.name}`
        );
      }


      // Reduce stock
      product.stock -=
        item.quantity;


      await product.save({
        session
      });
    }


    // ==========================================
    // 10. UPDATE ORDER
    // ==========================================

    order.paymentStatus =
      "paid";

    order.paymentId =
      paymentId;

    order.status =
      "processing";


    await order.save({
      session
    });


    // ==========================================
    // 11. CLEAR CART
    // ==========================================

    await Cart.findOneAndUpdate(
      {
        user: order.user
      },
      {
        $set: {
          items: []
        }
      },
      {
        session
      }
    );


    // ==========================================
    // 12. COMMIT TRANSACTION
    // ==========================================

    await session.commitTransaction();


    console.log(
      "Payment processed successfully:",
      paymentId
    );


    // ==========================================
    // 13. RESPOND TO RAZORPAY
    // ==========================================

    return res.status(200).json({
      message:
        "Webhook processed successfully"
    });


  } catch (error) {

    // ==========================================
    // ROLLBACK
    // ==========================================

    await session.abortTransaction();

    console.error(
      "Webhook processing error:",
      error
    );


    return res.status(500).json({
      message:
        "Webhook processing failed"
    });


  } finally {

    session.endSession();

  }
};


// ==========================================
// VERIFY PAYMENT
// ==========================================

const verifyPayment = async (req, res) => {

  // Start MongoDB session
  const session =
    await mongoose.startSession();

  try {

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;


    // ======================================
    // 1. Validate payment data
    // ======================================

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        message:
          "Payment verification data is required"
      });
    }


    // ======================================
    // 2. Verify Razorpay signature
    // ======================================

    const body =
      razorpay_order_id +
      "|" +
      razorpay_payment_id;


    const expectedSignature =
      crypto
        .createHmac(
          "sha256",
          process.env.RAZORPAY_KEY_SECRET
        )
        .update(body)
        .digest("hex");


    if (
      expectedSignature !==
      razorpay_signature
    ) {

      return res.status(400).json({
        message:
          "Invalid payment signature"
      });

    }


    // ======================================
    // 3. Start MongoDB transaction
    // ======================================

    session.startTransaction();


    // ======================================
    // 4. Find user's order
    // ======================================

    const order =
      await Order.findOne({
        razorpayOrderId:
          razorpay_order_id,

        user:
          req.user._id
      }).session(session);


    if (!order) {

      await session.abortTransaction();

      return res.status(404).json({
        message:
          "Order not found"
      });
    }


    // ======================================
    // 5. Prevent duplicate payment
    // ======================================

    if (
      order.paymentStatus === "paid"
    ) {

      await session.abortTransaction();

      return res.status(400).json({
        message:
          "Payment already verified"
      });
    }


    // ======================================
    // 6. Reduce product stock
    // ======================================

    for (const item of order.items) {

      const product =
        await Product.findById(
          item.product
        ).session(session);


      if (!product) {

        throw new Error(
          `Product not found: ${item.product}`
        );

      }


      // Check stock
      if (
        product.stock <
        item.quantity
      ) {

        throw new Error(
          `Insufficient stock for ${product.name}`
        );

      }


      // Reduce stock
      product.stock -=
        item.quantity;


      await product.save({
        session
      });

    }


    // ======================================
    // 7. Update order payment
    // ======================================

    order.paymentStatus =
      "paid";

    order.paymentId =
      razorpay_payment_id;


    // ======================================
    // 8. Update order status
    // ======================================

    order.status =
      "processing";


    await order.save({
      session
    });


    // ======================================
    // 9. Clear user's cart
    // ======================================

    await Cart.findOneAndUpdate(
      {
        user:
          req.user._id
      },

      {
        $set: {
          items: []
        }
      },

      {
        session
      }
    );


    // ======================================
    // 10. Commit transaction
    // ======================================

    await session.commitTransaction();


    // ======================================
    // 11. Send response
    // ======================================

    return res.status(200).json({

      message:
        "Payment verified successfully",

      orderId:
        order._id,

      paymentStatus:
        order.paymentStatus,

      status:
        order.status,

      paymentId:
        order.paymentId

    });


  } catch (error) {

    // ======================================
    // Rollback everything if something fails
    // ======================================

    await session.abortTransaction();


    console.error(
      "Verify payment error:",
      error
    );


    return res.status(500).json({
      message:
        error.message ||
        "Payment verification failed"
    });


  } finally {

    // Close session
    session.endSession();

  }
};


// ==========================================
// EXPORT
// ==========================================

module.exports = {
  createPayment,
  verifyPayment,
  handleWebhook
};