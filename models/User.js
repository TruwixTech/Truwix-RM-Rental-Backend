const mongoose = require("mongoose");
const { USER, ADMIN, ORDER } = require("../utils/enum");

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
    },
    customerId: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: ORDER,
      },
    ],
    password: {
      type: String,
      // required: true,
      minlength: 8,
    },
    mobileNumber: {
      type: Number,
      // required: true,
      length: 10,
    },
    referredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: USER
    },
    referredBonusUsed: {
      type: Boolean,
      default: false
    },
    referredCode: {
      type: String
    },
    role: {
      type: String,
      enum: [ADMIN, USER],
      default: USER,
      required: true,
    },
    googleId: String,
    address: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
