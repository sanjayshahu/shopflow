const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true
    },

    category: {
      type: String,
      required: true
    },

    image: {
      type: String
    },

    stock: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
productSchema.index({
  category: 1,
  price: 1
});

productSchema.index({
  createdAt: -1
});

module.exports = mongoose.model(
  "Product",
  productSchema
);