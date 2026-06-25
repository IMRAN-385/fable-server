const mongoose = require("mongoose");

const ebookSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    writerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    writerName: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      required: true,
    },
    // Short public preview/blurb — always visible, even to guests.
    description: {
      type: String,
      required: true,
    },
    // ✅ FIX: this is the actual book content. Previously the same
    // `description` was shown both before AND after purchase, so paying
    // unlocked nothing. Now this field is only ever sent to the owner,
    // an admin, or someone who has actually purchased the book.
    fullContent: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    genre: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["published", "unpublished", "sold"],
      default: "published",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Ebook", ebookSchema);
