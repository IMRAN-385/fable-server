const express  = require("express");
const User     = require("../models/User");
const Ebook    = require("../models/Ebook");
const Purchase = require("../models/Purchase");
const verifyToken = require("../middleware/verifyToken");
const verifyRole  = require("../middleware/verifyRole");
const router   = express.Router();

// Match real purchases, including legacy rows created before the `type`
// field existed (those have no `type` at all — don't drop them).
const PURCHASE_MATCH = { $or: [{ type: "purchase" }, { type: { $exists: false } }] };

// GET /api/users/top-writers  (public)
router.get("/top-writers", async (req, res) => {
  try {
    const topFromSales = await Purchase.aggregate([
      { $match: PURCHASE_MATCH },
      { $lookup: { from: "ebooks", localField: "ebookId", foreignField: "_id", as: "ebook" } },
      { $unwind: "$ebook" },
      { $group: { _id: "$ebook.writerId", totalSales: { $sum: 1 }, writerName: { $first: "$ebook.writerName" } } },
      { $sort: { totalSales: -1 } },
      { $limit: 3 },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "info" } },
      { $unwind: "$info" },
      { $project: { _id: 1, writerName: 1, totalSales: 1, photo: "$info.photo", email: "$info.email" } },
    ]);

    if (topFromSales.length === 3) {
      return res.json({ success: true, writers: topFromSales });
    }

    // Fallback — pad with writers who have no sales yet so the section
    // still shows 3 cards.
    const writers = await User.find({ role: "writer" }).select("name email photo").limit(3);

    const fallback = writers.map((w) => ({
      _id: w._id,
      writerName: w.name,
      email: w.email,
      photo: w.photo || "",
      totalSales: 0,
    }));

    const merged = fallback.map((w) => {
      const found = topFromSales.find((s) => s._id.toString() === w._id.toString());
      return found || w;
    });

    res.json({ success: true, writers: merged });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users  (admin)
router.get("/", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/:id/role  (admin)
router.put("/:id/role", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role, ...(role === "writer" ? { writerVerified: true, pendingWriter: false } : {}) },
      { new: true }
    ).select("-password");
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/users/:id  (admin)
router.delete("/:id", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "User deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/analytics  (admin)
//
// ✅ FIX: the frontend (AdminDashboard.jsx) reads `aData.stats.totalUsers`,
// `aData.monthlySales`, and `aData.genreCount`. The old version of this
// route returned flat fields (`totalUsers`, `totalRevenue`, ...) with no
// `stats` wrapper at all, and never computed monthlySales/genreCount —
// so every card and chart on the admin dashboard showed undefined/blank.
router.get("/analytics", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const totalUsers   = await User.countDocuments({ role: "user" });
    const totalWriters = await User.countDocuments({ role: "writer" });
    const totalSold     = await Purchase.countDocuments({ $and: [PURCHASE_MATCH] });
    const totalEbooks  = await Ebook.countDocuments({ status: { $ne: "unpublished" } });

    const revenueAgg = await Purchase.aggregate([
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    // Monthly sales (purchases only, last 12 months max, oldest -> newest)
    const monthlyAgg = await Purchase.aggregate([
      { $match: PURCHASE_MATCH },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const monthlySales = {};
    monthlyAgg.forEach((m) => {
      const label = `${MONTH_NAMES[m._id.month - 1]} ${m._id.year}`;
      monthlySales[label] = m.count;
    });

    // Sales by genre
    const genreAgg = await Purchase.aggregate([
      { $match: PURCHASE_MATCH },
      { $lookup: { from: "ebooks", localField: "ebookId", foreignField: "_id", as: "ebook" } },
      { $unwind: "$ebook" },
      { $group: { _id: "$ebook.genre", count: { $sum: 1 } } },
    ]);
    const genreCount = {};
    genreAgg.forEach((g) => { genreCount[g._id] = g.count; });

    res.json({
      success: true,
      stats: { totalUsers, totalWriters, totalEbooks, totalSold, totalRevenue },
      monthlySales,
      genreCount,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
