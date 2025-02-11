const mongoose = require("mongoose");
const {
  APPLIANCE,
  LIVING_ROOM,
  STORAGE,
  STUDY_ROOM,
  BED_ROOM,
  TABLE,
  PACKAGE,
  DINNINGROOM,
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
      enum: [APPLIANCE, LIVING_ROOM, STORAGE, STUDY_ROOM, BED_ROOM, TABLE, PACKAGE, DINNINGROOM],
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
      type: Map,
      of: String, // Keys will be the month numbers, values will be the rental price
      default: {},
    },
    quantity: {
      type: Number,
      required: [true, "quantity is Required"],
    },
    height:{
      type:String
    },
    width:{
      type:String
    },
    weigth:{
      type:String
    },
    hsncode:{
      type:String
    },
    hsnbarcode:{
      type: String
    },
  },
  { timestamps: true }
);

const Product =
  mongoose.models.Product || mongoose.model("Product", productSchema);

module.exports = Product;
