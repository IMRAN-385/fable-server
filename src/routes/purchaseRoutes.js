const express = require("express");
const Ebook = require("../models/Ebook");
const Purchase = require("../models/Purchase");
const User = require("../models/User");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// Stripe lazy initialize
const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return require("stripe")(process.env.STRIPE_SECRET_KEY);
};

router.post("/create-checkout-session", verifyToken, async (req, res) => {
  try {
    const stripe = getStripe();
    const { ebookId } = req.body;
    // বাকি কোড আগের মতোই...
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/confirm", verifyToken, async (req, res) => {
  try {
    const stripe = getStripe();
    const { sessionId } = req.body;
    // বাকি কোড আগের মতোই...
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;