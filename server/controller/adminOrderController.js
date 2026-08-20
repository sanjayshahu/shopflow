const Order = require("../models/Order");

const getAllOrders = async (req, res) => {
  try {
    console.log("\n========== ADMIN: GET ALL ORDERS ==========");

    const orders = await Order.find()
      .populate("user", "name email")
      .populate(
        "items.product",
        "name price image category"
      )
      .sort({ createdAt: -1 });

    console.log("Total orders:", orders.length);

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });

  } catch (error) {
    console.error("Get all orders error:", error);

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


const updateOrderStatus = async (req, res) => {
  try {
    console.log("\n========== ADMIN: UPDATE ORDER STATUS ==========");

    const { orderId } = req.params;
    const { status } = req.body;

    console.log("Order ID:", orderId);
    console.log("New status:", status);

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled"
    ];

    // Validate status
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status"
      });
    }

    // Find order
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    console.log("Current status:", order.status);

    // Allowed state transitions
    const transitions = {
      pending: ["confirmed", "cancelled"],

      confirmed: [
        "processing",
        "cancelled"
      ],

      processing: [
        "shipped"
      ],

      shipped: [
        "delivered"
      ],

      delivered: [],

      cancelled: []
    };

    const allowedNextStatuses =
      transitions[order.status];

    if (
      !allowedNextStatuses.includes(status)
    ) {
      return res.status(400).json({
        success: false,
        message:
          `Cannot change order status from ` +
          `"${order.status}" to "${status}"`
      });
    }

    // Update status
    order.status = status;

    await order.save();

    console.log(
      `✅ Order status changed: ${status}`
    );

    return res.status(200).json({
      success: true,
      message: "Order status updated",
      order
    });

  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
const getOrderStats = async (req, res) => {
  try {
    console.log(
      "\n========== ADMIN: ORDER STATS =========="
    );

    const stats = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid"
        }
      },

      {
        $group: {
          _id: null,

          totalOrders: {
            $sum: 1
          },

          totalRevenue: {
            $sum: "$totalAmount"
          },

          averageOrderValue: {
            $avg: "$totalAmount"
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0
    };

    return res.status(200).json({
      success: true,
      stats: result
    });

  } catch (error) {
    console.error(
      "Order stats error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
const getProductSales = async (req, res) => {
  try {
    const sales = await Order.aggregate([
      {
        $match: {
          paymentStatus: "paid"
        }
      },

      {
        $unwind: "$items"
      },

      {
        $group: {
          _id: "$items.product",

          totalQuantity: {
            $sum: "$items.quantity"
          },

          totalRevenue: {
            $sum: {
              $multiply: [
                "$items.price",
                "$items.quantity"
              ]
            }
          }
        }
      },

      {
        $sort: {
          totalRevenue: -1
        }
      },

      {
        $limit: 10
      }
    ]);

    return res.status(200).json({
      success: true,
      sales
    });

  } catch (error) {
    console.error(
      "Product sales error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


module.exports = {
  getAllOrders,
  updateOrderStatus,
   getOrderStats,
   getProductSales
};