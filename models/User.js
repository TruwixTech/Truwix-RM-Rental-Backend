const mongoose = require("mongoose");

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
    role: {
      type: String,
      enum: ["Admin", "User"],
      default: "User",
      required: true,
    },
    googleId: String,
    address: {
      type: Array,
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);