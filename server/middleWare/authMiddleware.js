const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  console.log("\n========== AUTHENTICATION ==========");

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No Bearer token");

      return res.status(401).json({
        success: false,
        message: "Not authenticated"
      });
    }

    const token = authHeader.split(" ")[1];

    console.log("JWT received");

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("✅ JWT verified");
    console.log("JWT payload:", decoded);

    // Get current user from database
    const user = await User.findById(decoded.userId)
      .select("-password");

    if (!user) {
      console.log("❌ User not found");

      return res.status(401).json({
        success: false,
        message: "User no longer exists"
      });
    }

    // Attach current user to request
    req.user = user;

    console.log("✅ AUTHENTICATED USER:");
    console.log({
      id: user._id,
      email: user.email,
      role: user.role
    });

    next();

  } catch (error) {
    console.error("❌ AUTHENTICATION ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token"
    });
  }
};

module.exports = protect;