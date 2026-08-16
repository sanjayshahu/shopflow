const errorHandler = (err, req, res, next) => {
  console.error("\n========== ERROR HANDLER ==========");
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Server error"
  });
};

module.exports = errorHandler;