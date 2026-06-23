const express = require("express");
const User = require("../models/User");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

router.delete("/:ebookId", verifyToken, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $pull: { bookmarks: req.params.ebookId },
    });
    res.json({ success: true, message: "Bookmark removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:ebookId", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    user.bookmarks.push(req.params.ebookId);

    await user.save();

    res.json({
      success: true,
      message: "Bookmarked",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

module.exports = router;