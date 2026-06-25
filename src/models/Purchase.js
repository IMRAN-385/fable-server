const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // ebookId is only set for actual ebook purchases.
    // For writer-verification (publishing) fees, this stays null.
    ebookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ebook",
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    // ✅ FIX: this field did not exist before, but routes were querying
    // Purchase.countDocuments({ type: "purchase" }) and aggregating on it.
    // Without this field every "totalSold" / "top writers" / "monthly sales"
    // calculation silently returned 0 / empty.
    type: {
      type: String,
      enum: ["purchase", "publishing_fee"],
      default: "purchase",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Purchase", purchaseSchema);
