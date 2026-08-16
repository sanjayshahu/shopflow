const Product = require("../models/Product");

const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      image,
      stock
    } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({
        message: "Name, description, price and category are required"
      });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      image,
      stock,
      createdBy: req.user._id
    });

    return res.status(201).json({
      message: "Product created successfully",
      product
    });

  } catch (error) {
    console.error("Create product error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    return res.status(200).json({
      product
    });

  } catch (error) {
    console.error("Get product error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};
//important
const getProducts = async (req, res) => {
  try {
    console.log("\n========== GET PRODUCTS ==========");

    const {
      search,
      category,
      minPrice,
      maxPrice,
      sort,
      page = 1,
      limit = 10
    } = req.query;

    console.log("Query:", req.query);

    // -------------------------
    // Build filter
    // -------------------------

    const filter = {};

    // Search
    if (search) {
      filter.name = {
        $regex: search,
        $options: "i"
      };
    }

    // Category
    if (category) {
      filter.category = category;
    }

    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }

      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    console.log("MongoDB filter:", filter);

    // -------------------------
    // Pagination
    // -------------------------

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(
      Math.max(Number(limit), 1),
      100
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    // -------------------------
    // Sorting
    // -------------------------

    let sortOption = {
      createdAt: -1
    };

    if (sort === "price_asc") {
      sortOption = {
        price: 1
      };
    }

    if (sort === "price_desc") {
      sortOption = {
        price: -1
      };
    }

    if (sort === "newest") {
      sortOption = {
        createdAt: -1
      };
    }

    if (sort === "oldest") {
      sortOption = {
        createdAt: 1
      };
    }

    // -------------------------
    // Database queries
    // -------------------------

    const products = await Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    const totalProducts =
      await Product.countDocuments(filter);

    // -------------------------
    // Pagination information
    // -------------------------

    const totalPages = Math.ceil(
      totalProducts / limitNumber
    );

    console.log("Products found:", products.length);
    console.log("Total products:", totalProducts);

    return res.status(200).json({
      success: true,

      count: products.length,

      pagination: {
        currentPage: pageNumber,
        limit: limitNumber,
        totalProducts,
        totalPages,
        hasNextPage:
          pageNumber < totalPages,
        hasPreviousPage:
          pageNumber > 1
      },

      products
    });

  } catch (error) {
    console.error(
      "Get products error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const allowedFields = [
      "name",
      "description",
      "price",
      "category",
      "image",
      "stock"
    ];//impbecause on this fields are alowed to be updated field whitelisting.

    const updates = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No valid fields provided for update"
      });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      updates,
      {
        new: true,
        runValidators: true
      }
    );

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    return res.status(200).json({
      message: "Product updated successfully",
      product
    });

  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    return res.status(200).json({
      message: "Product deleted successfully"
    });

  } catch (error) {
    console.error("Delete product error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};
module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
};