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
