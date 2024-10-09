const mongoose = require("mongoose");

const wishListSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const WishList = mongoose.model("WishList", wishListSchema);

module.exports = WishList;
