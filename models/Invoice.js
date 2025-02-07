const mongoose = require('mongoose');
const { INR, USER, PAID, UNPAID } = require('../utils/enum');

const itemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: Number,
    expirationDate: Date,
  },
  { _id: false }
);

const InvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: USER, required: true },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: INR },
  items: [
    itemSchema,
  ],
  status: { type: String, enum: [PAID, UNPAID], default: PAID },
},
  { timestamps: true }
);

module.exports = mongoose.model('Invoice', InvoiceSchema);
