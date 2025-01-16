const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        rentOptions: {
          rentMonthsCount: {
            type: Number,
            enum: [3, 6, 9, 12], // Valid months for renting
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            default: 1, // Defaults to 1, but you could add validation for > 0 if needed
          },
          rentMonths: {
            type: String, // Optional field, you could consider validating or clarifying its purpose
            required: false,
          },
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);
