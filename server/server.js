require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminOrderRoutes = require("./routes/adminOrderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const errorHandler =
  require("./middleware/errorMiddleware");

const app = express();

const PORT = process.env.PORT || 5000;


// ==========================================
// DATABASE
// ==========================================

connectDB();


// ==========================================
// PAYMENT WEBHOOK
// ==========================================

// IMPORTANT:
// This MUST come before express.json().
//
// Razorpay webhook signature verification
// requires the original raw request body.

app.use(
  "/api/payments/webhook",
  express.raw({
    type: "application/json"
  })
);


// ==========================================
// GLOBAL JSON MIDDLEWARE
// ==========================================

app.use(express.json());


// ==========================================
// HEALTH
// ==========================================

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "ShopFlow API is running"
  });
});


// ==========================================
// ROUTES
// ==========================================

app.use(
  "/api/auth",
  authRoutes
);

app.use(
  "/api/products",
  productRoutes
);

app.use(
  "/api/cart",
  cartRoutes
);

app.use(
  "/api/orders",
  orderRoutes
);

app.use(
  "/api/admin/orders",
  adminOrderRoutes
);

app.use(
  "/api/payments",
  paymentRoutes
);


// ==========================================
// 404 HANDLER
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message:
      `Route not found: ${req.method} ${req.originalUrl}`
  });
});


// ==========================================
// ERROR HANDLER
// MUST BE LAST
// ==========================================

app.use(errorHandler);


// ==========================================
// SERVER
// ==========================================

app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT}`
  );
});