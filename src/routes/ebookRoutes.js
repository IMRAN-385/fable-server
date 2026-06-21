const express = require("express");
const Ebook = require("../models/Ebook");
const verifyToken = require("../middleware/verifyToken");
const verifyRole = require("../middleware/verifyRole");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Purchase = require("../models/Purchase");

router.get("/:id", async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);

    if (!ebook) {
      return res.status(404).json({ message: "Ebook not found" });
    }

    let isOwner = false;
    let isPurchasedByUser = false;

    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        isOwner = ebook.writerId.toString() === decoded.id;

        const purchase = await Purchase.findOne({
          userId: decoded.id,
          ebookId: ebook._id,
        });
        isPurchasedByUser = !!purchase;
      } catch (err) {
        // টোকেন invalid/expired হলে guest হিসেবে treat করো, এরর দিও না
      }
    }

    res.json({ success: true, ebook, isOwner, isPurchasedByUser });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);

    if (!ebook) {
      return res.status(404).json({
        message: "Ebook not found",
      });
    }

    res.json({
      success: true,
      ebook,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post(
  "/",
  verifyToken,
  verifyRole("writer", "admin"),
  async (req, res) => {
    try {
      const ebook = await Ebook.create({
        ...req.body,
        writerId: req.user.id,
      });

      res.status(201).json({
        success: true,
        ebook,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);

router.put("/:id", verifyToken, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);

    if (!ebook) {
      return res.status(404).json({
        message: "Ebook not found",
      });
    }

    const isOwner = ebook.writerId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    const updated = await Ebook.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      ebook: updated,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const ebook = await Ebook.findById(req.params.id);

    if (!ebook) {
      return res.status(404).json({
        message: "Ebook not found",
      });
    }

    const isOwner = ebook.writerId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: "Access denied",
      });
    }

    await Ebook.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Ebook deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;