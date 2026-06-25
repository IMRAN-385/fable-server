const express = require("express");
const Ebook = require("../models/Ebook");
const Purchase = require("../models/Purchase");
const User = require("../models/User");
const verifyToken = require("../middleware/verifyToken");
const verifyRole = require("../middleware/verifyRole");
const router = express.Router();

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
  return require("stripe")(process.env.STRIPE_SECRET_KEY);
};

// One-time fee a "user" must pay to be promoted to "writer".
// Configurable via env so it's not hardcoded in two places.
const WRITER_VERIFICATION_FEE = Number(process.env.WRITER_VERIFICATION_FEE || 10);

// ---------------------------------------------------------------
// Buy an ebook
// ---------------------------------------------------------------
router.post("/create-checkout-session", verifyToken, async (req, res) => {
  try {
    const stripe = getStripe();
    const { ebookId } = req.body;
    const ebook = await Ebook.findById(ebookId);
    if (!ebook) return res.status(404).json({ message: "Ebook not found" });
    if (ebook.writerId.toString() === req.user.id)
      return res.status(400).json({ message: "Cannot buy your own ebook" });
    if (ebook.status === "sold")
      return res.status(400).json({ message: "Already sold" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: ebook.title },
          unit_amount: Math.round(ebook.price * 100),
        },
        quantity: 1,
      }],
      success_url: `${process.env.CLIENT_URL}/payment?session_id={CHECKOUT_SESSION_ID}&ebookId=${ebook._id}&type=purchase`,
      cancel_url: `${process.env.CLIENT_URL}/ebooks/${ebook._id}`,
      // ✅ FIX: type added to metadata so /confirm can tell this apart
      // from a writer-verification-fee session below.
      metadata: { type: "purchase", ebookId: ebook._id.toString(), userId: req.user.id },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------------------------------------------------------------
// ✅ NEW: pay the one-time writer-verification fee
// ---------------------------------------------------------------
router.post("/writer-verification-session", verifyToken, async (req, res) => {
  try {
    const stripe = getStripe();
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "writer" || user.role === "admin")
      return res.status(400).json({ message: "Already a writer" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: "Writer verification fee" },
          unit_amount: Math.round(WRITER_VERIFICATION_FEE * 100),
        },
        quantity: 1,
      }],
      success_url: `${process.env.CLIENT_URL}/payment?session_id={CHECKOUT_SESSION_ID}&type=publishing_fee`,
      cancel_url: `${process.env.CLIENT_URL}/dashboard/verify-writer`,
      metadata: { type: "publishing_fee", userId: req.user.id },
    });

    res.json({ success: true, url: session.url });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------------------------------------------------------------
// Confirm payment (shared by both flows above)
// ---------------------------------------------------------------
router.post("/confirm", verifyToken, async (req, res) => {
  try {
    const stripe = getStripe();
    const { sessionId } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid")
      return res.status(400).json({ message: "Payment not completed" });

    const { type, userId } = session.metadata;

    // ✅ FIX: this was already checked before, keep it — never trust the
    // body's userId, always cross-check against the session that Stripe
    // actually paid out, and against the logged-in user making the call.
    if (userId !== req.user.id)
      return res.status(403).json({ message: "Access denied" });

    const amount = session.amount_total / 100;

    if (type === "publishing_fee") {
      const already = await Purchase.findOne({ userId, type: "publishing_fee" });
      if (!already) {
        await Purchase.create({ userId, amount, type: "publishing_fee" });
      }
      await User.findByIdAndUpdate(userId, {
        role: "writer",
        pendingWriter: false,
        writerVerified: true,
      });
      return res.json({ success: true, message: "Writer verification complete" });
    }

    // default: ebook purchase
    const { ebookId } = session.metadata;
    const alreadyPurchased = await Purchase.findOne({ userId, ebookId, type: "purchase" });
    if (alreadyPurchased) return res.json({ success: true, message: "Already recorded" });

    await Purchase.create({ userId, ebookId, amount, type: "purchase" });
    await Ebook.findByIdAndUpdate(ebookId, { status: "sold" });
    await User.findByIdAndUpdate(userId, { $addToSet: { purchasedBooks: ebookId } });

    res.json({ success: true, message: "Purchase recorded" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/my-purchases", verifyToken, async (req, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.user.id, type: "purchase" })
      .populate("ebookId")
      .sort({ createdAt: -1 });
    res.json({ success: true, purchases });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/my-sales", verifyToken, verifyRole("writer", "admin"), async (req, res) => {
  try {
    const myEbooks = await Ebook.find({ writerId: req.user.id }).select("_id");
    const ebookIds = myEbooks.map((e) => e._id);
    const sales = await Purchase.find({ ebookId: { $in: ebookIds }, type: "purchase" })
      .populate("ebookId", "title price coverImage")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, sales });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/all", verifyToken, verifyRole("admin"), async (req, res) => {
  try {
    const purchases = await Purchase.find()
      .populate("ebookId", "title price")
      .populate("userId", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, purchases });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
