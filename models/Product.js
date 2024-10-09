const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
    },
    sub_title: {
      type: String,
      trim: true,
    },
    img: {
      type: [String],
      default: [], // Ensures img is always an array
    },
    category: {
      type: String,
      enum: ["appliance", "sofa", "kitchen", "storage", "bed", "bath", "chair"],
      required: [true, "Product category is required"],
      index: true,
    },
    size: {
      type: String,
      required: [true, "Product size is required"],
      trim: true,
      enum: ["small", "medium", "large"],
    },
    reviews: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        reviewText: { type: String, required: true },
        rating: { type: Number, required: true, min: 1, max: 5 },
      },
    ],
    details: {
      description: { type: String },
      fabricCare: {
        material: { type: String },
        color: { type: [String] },
      },
      woodType: {
        material: { type: String },
        color: { type: [String] },
      },
      seatingCapacity: [{ type: Number }],
      configType: [{ type: Number }],
      colorOptions: [{ type: String }],
      month: {
        type: [Number],
        default: [],
      },
    },
    rentalOptions: {
      rent3Months: {
        type: String,
        default: null, // Default to null if not provided
      },
      rent6Months: {
        type: String,
        default: null, // Default to null if not provided
      },
      rent9Months: {
        type: String,
        default: null, // Default to null if not provided
      },
      rent12Months: {
        type: String,
        default: null, // Default to null if not provided
      },
    },
    addOns: [{ type: mongoose.Schema.Types.ObjectId, ref: "AddOn" }],
  },
  { timestamps: true }
);

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

module.exports = Product;
