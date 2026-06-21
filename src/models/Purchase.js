const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    ebookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ebook",
    },
    amount: Number,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Purchase",
  purchaseSchema
);