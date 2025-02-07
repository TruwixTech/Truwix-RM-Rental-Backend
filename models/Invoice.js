const mongoose = require('mongoose');
const { INR, USER, PAID, UNPAID } = require('../utils/enum');

const itemSchema = new mongoose.Schema(
  {
    name: String,
    quantity: Number,
    price: Number,
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
  paymentId: { type: String, required: true },
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
