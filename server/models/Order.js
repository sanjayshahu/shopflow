const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },

        name: {
          type: String,
          required: true
        },

        price: {
          type: Number,
          required: true
        },

        quantity: {
          type: Number,
          required: true,
          min: 1
        }
      }
    ],

    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled"
      ],
      default: "pending"
    }
  },
  {
    timestamps: true
  },
  paymentStatus:{
  type: String,
  enum: [
    "pending",
    "paid",
    "failed",
    "refunded"
  ],
  default: "pending"
},

paymentMethod: {
  type: String,
  enum: [
    "cod",
    "mock"
  ],
  default: "mock"
},

paymentId: {
  type: String,
  default: null
}
);

module.exports = mongoose.model("Order", orderSchema);