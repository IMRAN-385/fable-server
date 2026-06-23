const express = require("express");
const Ebook = require("../models/Ebook");
const Purchase = require("../models/Purchase");
const verifyToken = require("../middleware/verifyToken");
const verifyRole = require("../middleware/verifyRole");
const jwt = require("jsonwebtoken");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const { search, genre, minPrice, maxPrice, availability, sort, page = 1, limit = 9 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { writerName: { $regex: search, $options: "i" } },
      ];
    }
    if (genre) query.genre = genre;
    if (availability === "available") query.status = { $ne: "sold" };
    else if (availability === "sold") query.status = "sold";
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price_low") sortOption = { price: 1 };
    if (sort === "price_high") sortOption = { price: -1 };

    const pageNum = Number(page);
    const limitNum = Number(limit);
    const skip = (pageNum - 1) * limitNum;

    const [ebooks, total] = await Promise.all([
      Ebook.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Ebook.countDocuments(query),
    ]);

    res.json({
      success: true,
      ebooks,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      totalEbooks: total,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);
    if (!ebook) return res.status(404).json({ message: "Ebook not found" });

    let isOwner = false;
    let isPurchasedByUser = false;

    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        isOwner = ebook.writerId.toString() === decoded.id;
        const purchase = await Purchase.findOne({ userId: decoded.id, ebookId: ebook._id });
        isPurchasedByUser = !!purchase;
      } catch {}
    }

    res.json({ success: true, ebook, isOwner, isPurchasedByUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", verifyToken, verifyRole("writer", "admin"), async (req, res) => {
  try {
    const ebook = await Ebook.create({ ...req.body, writerId: req.user.id });
    res.status(201).json({ success: true, ebook });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);
    if (!ebook) return res.status(404).json({ message: "Ebook not found" });
    if (ebook.writerId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    const updated = await Ebook.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, ebook: updated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);
    if (!ebook) return res.status(404).json({ message: "Ebook not found" });
    if (ebook.writerId.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    await Ebook.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Ebook deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;