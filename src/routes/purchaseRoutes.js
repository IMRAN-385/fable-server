const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const Ebook = require("../models/Ebook");
const Purchase = require("../models/Purchase");
const User = require("../models/User");
const verifyToken = require("../middleware/verifyToken");

const router = express.Router();

// Create Stripe Checkout Session
router.post("/create-checkout-session", verifyToken, async (req, res) => {
  try {
    const { ebookId } = req.body;
    const ebook = await Ebook.findById(ebookId);

    if (!ebook) {
      return res.status(404).json({ message: "Ebook not found" });
    }
    if (ebook.writerId.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot buy your own ebook" });
    }
    if (ebook.status === "sold") {
      return res.status(400).json({ message: "Ebook already sold" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: ebook.title },
            unit_amount: Math.round(ebook.price * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&ebookId=${ebook._id}`,
      cancel_url: `${process.env.CLIENT_URL}/ebooks/${ebook._id}`,
      metadata: {
        ebookId: ebook._id.toString(),
        userId: req.user.id,
      },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Confirm Payment
router.post("/confirm", verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ message: "Payment not completed" });
    }

    const { ebookId, userId } = session.metadata;

    if (userId !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const alreadyPurchased = await Purchase.findOne({ userId, ebookId });
    if (alreadyPurchased) {
      return res.json({ success: true, message: "Already recorded" });
    }

    const amount = session.amount_total / 100;

    await Purchase.create({ userId, ebookId, amount });
    await Ebook.findByIdAndUpdate(ebookId, { status: "sold" });
    await User.findByIdAndUpdate(userId, {
      $addToSet: { purchasedBooks: ebookId },
    });

    res.json({ success: true, message: "Purchase recorded" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;