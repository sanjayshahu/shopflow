const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    // ==========================================
    // USER
    // ==========================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },


    // ==========================================
    // ORDER ITEMS
    // ==========================================

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },

        // Snapshot of product name
        name: {
          type: String,
          required: true
        },

        // Snapshot of price at time of purchase
        price: {
          type: Number,
          required: true,
          min: 0
        },

        quantity: {
          type: Number,
          required: true,
          min: 1
        }
      }
    ],


    // ==========================================
    // TOTAL
    // ==========================================

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },


    // ==========================================
    // ORDER STATUS
    // ==========================================

    status: {
      type: String,

      enum: [
        "pending",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
      ],

      default: "pending"
    },


    // ==========================================
    // PAYMENT STATUS
    // ==========================================

    paymentStatus: {
      type: String,

      enum: [
        "pending",
        "paid",
        "failed",
        "refunded"
      ],

      default: "pending"
    },


    // ==========================================
    // RAZORPAY ORDER ID
    // ==========================================

    razorpayOrderId: {
      type: String,
      default: null
    },


    // ==========================================
    // RAZORPAY PAYMENT ID
    // ==========================================

    paymentId: {
      type: String,
      default: null
    }
  },


  // ==========================================
  // TIMESTAMPS
  // ==========================================

  {
    timestamps: true
  }
);


// ==========================================
// MODEL
// ==========================================

module.exports = mongoose.model(
  "Order",
  orderSchema
);