const express = require("express");
const Purchase = require("../models/Purchase");
const User = require("../models/User");
const router = express.Router();

// Top 3 Writers by sales
router.get("/top-writers", async (req, res) => {
  try {
    const Ebook = require("../models/Ebook");

    const topWriters = await Purchase.aggregate([
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
          as: "writerInfo",
        },
      },
      { $unwind: "$writerInfo" },
      {
        $project: {
          _id: 1,
          writerName: 1,
          totalSales: 1,
          photo: "$writerInfo.photo",
          email: "$writerInfo.email",
        },
      },
    ]);

    res.json({ success: true, writers: topWriters });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;