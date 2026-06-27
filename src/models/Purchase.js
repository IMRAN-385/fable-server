const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
   
    ebookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ebook",
      default: null,
    },
    amount: {
      type: Number,
      required: true,
    },
    
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
