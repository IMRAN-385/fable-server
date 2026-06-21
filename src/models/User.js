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

    photo: {
      type: String,
      default: "",
    },
    bookmarks: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ebook",
    default: [],
  },
],

purchasedBooks: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ebook",
  },
],
  },
  {
    timestamps: true,
  },
  
);


module.exports = mongoose.model("User", userSchema);