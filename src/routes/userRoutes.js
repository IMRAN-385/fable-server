const express = require("express");
const User = require("../models/User");
const Ebook = require("../models/Ebook");
const Purchase = require("../models/Purchase");
const verifyToken = require("../middleware/verifyToken");
const verifyRole = require("../middleware/verifyRole");

const router = express.Router();

const PURCHASE_MATCH = {
  $or: [
    { type: "purchase" },
    { type: { $exists: false } },
  ],
};

// ===============================
// TOP WRITERS (PUBLIC)
// ===============================
router.get("/top-writers", async (req, res) => {
  try {
    const topWriters = await Purchase.aggregate([
      { $match: PURCHASE_MATCH },

      {
        $lookup: {
          from: "ebooks",
          localField: "ebookId",
          foreignField: "_id",
          as: "ebook",
        },
      },

      { $unwind: "$ebook" },

      {
        $group: {
          _id: "$ebook.writerId",
          totalSales: { $sum: 1 },
          writerName: { $first: "$ebook.writerName" },
        },
      },

      { $sort: { totalSales: -1 } },

      { $limit: 3 },

      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "writer",
        },
      },

      {
        $unwind: {
          path: "$writer",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 1,
          writerName: 1,
          totalSales: 1,
          photo: "$writer.photo",
          email: "$writer.email",
        },
      },
    ]);

    if (topWriters.length > 0) {
      return res.json({
        success: true,
        writers: topWriters,
      });
    }

    const writers = await User.find({ role: "writer" })
      .select("name email photo")
      .limit(3);

    return res.json({
      success: true,
      writers: writers.map((writer) => ({
        _id: writer._id,
        writerName: writer.name,
        email: writer.email,
        photo: writer.photo || "",
        totalSales: 0,
      })),
    });
  } catch (error) {
    console.error("TOP WRITERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ===============================
// ALL USERS (ADMIN)
// ===============================
router.get(
  "/",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const users = await User.find()
        .select("-password")
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        users,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);
// ===============================
// ANALYTICS (ADMIN)
// ===============================
router.get(
  "/analytics",
  verifyToken,
  verifyRole("admin"),
  async (req, res) => {
    try {
      const totalUsers = await User.countDocuments({ role: "user" });
      const totalWriters = await User.countDocuments({ role: "writer" });
      const totalEbooks = await Ebook.countDocuments();

      const totalSold = await Purchase.countDocuments({
        $or: [
          { type: "purchase" },
          { type: { $exists: false } },
        ],
      });

      const revenueAgg = await Purchase.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: "$amount" },
          },
        },
      ]);

      const totalRevenue = revenueAgg[0]?.total || 0;

      res.json({
        success: true,
        stats: {
          totalUsers,
          totalWriters,
          totalEbooks,
          totalSold,
          totalRevenue,
        },
        monthlySales: {},
        genreCount: {},
      });
    } catch (error) {
      console.error("ANALYTICS ERROR:", error);

      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
);

module.exports = router;