const validate = (schema) => {
  return (req, res, next) => {
    console.log("\n========== VALIDATION ==========");
    console.log("Request body:", req.body);

    const { error } = schema.validate(req.body);

    if (error) {
      console.log("❌ VALIDATION FAILED:");
      console.log(error.details[0].message);

      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    console.log("✅ VALIDATION PASSED");

    next();
  };
};

module.exports = validate;