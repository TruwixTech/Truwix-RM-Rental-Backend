const mongoose = require("mongoose");
const { USER, ITEM } = require("../utils/enum");

const wishListSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: USER,
    required: true,
  },
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: ITEM,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const WishList = mongoose.model("WishList", wishListSchema);

module.exports = WishList;
