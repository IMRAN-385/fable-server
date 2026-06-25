const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["user", "writer", "admin"],
      default: "user",
    },
    // ✅ NEW: spec requires writers to pay a one-time verification fee
    // before they get writer privileges. We no longer hand out the
    // "writer" role at registration time — we park the request here
    // until payment is confirmed (see purchaseRoutes.js).
    pendingWriter: {
      type: Boolean,
      default: false,
    },
    writerVerified: {
      type: Boolean,
      default: false,
    },
    photo: {
      type: String,
      default: "",
    },
    bookmarks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Ebook",
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
