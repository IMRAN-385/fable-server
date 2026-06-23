const express = require("express");
const Purchase = require("../models/Purchase");
const User = require("../models/User");
const verifyToken = require("../middleware/verifyToken");
const verifyRole = require("../middleware/verifyRole");
const router = express.Router();

router.get("/top-writers", async (req, res) => {
  try {
    const topWriters = await Purchase.aggregate([
      { $lookup: { from: "ebooks", localField: "ebookId", foreignField: "_id", as: "ebook" } },
      { $unwind: "$ebook" },
      { $group: { _id: "$ebook.writerId", totalSales: { $sum: 1 }, writerName: { $first: "$ebook.writerName" } } },
      { $sort: { totalSales: -1 } },
      { $limit: 3 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "writerInfo" } },
      { $unwind: "$writerInfo" },
      { $project: { _id: 1, writerName: 1, totalSales: 1, photo: "$writerInfo.photo", email: "$writerInfo.email" } },
    ]);
    res.json({ success: true, writers: topWriters });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/analytics", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const Ebook = require("../models/Ebook");
    const [totalUsers, totalWriters, totalEbooks, purchases] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "writer" }),
      Ebook.countDocuments(),
      Purchase.find().populate("ebookId", "price genre"),
    ]);
    const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    const monthlySales = {};
    purchases.forEach((p) => {
      const month = new Date(p.createdAt).toLocaleString("default", { month: "short", year: "2-digit" });
      monthlySales[month] = (monthlySales[month] || 0) + 1;
    });
    const genreCount = {};
    purchases.forEach((p) => {
      const genre = p.ebookId?.genre;
      if (genre) genreCount[genre] = (genreCount[genre] || 0) + 1;
    });
    res.json({
      success: true,
      stats: { totalUsers, totalWriters, totalEbooks, totalRevenue, totalSold: purchases.length },
      monthlySales,
      genreCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch("/:id/role", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;