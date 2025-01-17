const mongoose = require("mongoose");
const {
  APPLIANCE,
  LIVING_ROOM,
  STORAGE,
  STUDY_ROOM,
  BED_ROOM,
  TABLE,
} = require("../utils/enum");

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
      required: [true, "Product Sub Title is Required"],
    },
    img: {
      type: [String],
      default: [], // Ensures img is always an array
    },
    size: {
      type: String,
    },
    category: {
      type: String,
      enum: [APPLIANCE, LIVING_ROOM, STORAGE, STUDY_ROOM, BED_ROOM, TABLE],
      required: [true, "Product category is required"],
      index: true,
    },

    details: {
      description: { type: String },
      month: {
        type: [Number],
        default: [],
        required: true,
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
  },
  { timestamps: true }
);

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

module.exports = Product;
