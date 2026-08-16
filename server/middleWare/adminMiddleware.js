const admin = (req, res, next) => {
  console.log("\n========== AUTHORIZATION ==========");

  if (!req.user) {
    console.log("❌ No authenticated user");

    return res.status(401).json({
      success: false,
      message: "Not authenticated"
    });
  }

  console.log("User role:", req.user.role);

  if (req.user.role !== "admin") {
    console.log("❌ ADMIN ACCESS DENIED");

    return res.status(403).json({
      success: false,
      message: "Admin access required"
    });
  }

  console.log("✅ ADMIN AUTHORIZATION PASSED");

  next();
};

module.exports = admin;