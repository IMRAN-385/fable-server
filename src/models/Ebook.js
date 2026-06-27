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
  
    description: {
      type: String,
      required: true,
    },
 
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
