require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");


const errorHandler = require("./middleware/errorMiddleware");
const paymentRoutes =
  require("./routes/paymentRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

// -------------------------
// Global middleware
// -------------------------

app.use(express.json());

// -------------------------
// Database
// -------------------------

connectDB();

// -------------------------
// Health
// -------------------------

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ShopFlow API is running"
  });
});

// -------------------------
// Routes
// -------------------------

app.use("/api/auth", authRoutes);

app.use("/api/products", productRoutes);

app.use("/api/cart", cartRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/admin/orders", adminOrderRoutes);

app.use(
  "/api/payments",
  paymentRoutes
);

// -------------------------
// 404 handler
// -------------------------

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// -------------------------
// Error handler
// MUST be LAST
// -------------------------

app.use(errorHandler);

// -------------------------
// Server
// -------------------------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});