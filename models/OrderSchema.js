const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true, // Ensure unique order numbers
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    products: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        expirationDate: { type: Date },
      },
    ],
    totalPrice: {
      type: Number,
      required: true,
      min: [0, "Total price cannot be negative"],
    },
    status: {
      type: String,
      enum: ["pending", "kyc_verified", "shipped", "cancelled", "delivered"],
      default: "pending",
    },
    orderDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: () => Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days after now
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    shippingAddress: {
      type: Object,
    },
    expectedDelivery: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Pre-save hook to auto-generate order numbers
orderSchema.pre("save", async function (next) {
  if (this.isNew) {
    const lastOrder = await mongoose
      .model("Order")
      .findOne()
      .sort({ createdAt: -1 });

    let nextNumber = 1;
    if (lastOrder && lastOrder.orderNumber) {
      const lastNumber = parseInt(lastOrder.orderNumber.slice(4));
      nextNumber = lastNumber + 1;
    }

    const paddedNumber = nextNumber.toString().padStart(6, "0");
    this.orderNumber = `RMOR${paddedNumber}`;
  }
  next();
});


const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

module.exports = Order;
