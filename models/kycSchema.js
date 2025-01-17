const mongoose = require("mongoose");
const {
  USER,
  KYC_PENDING,
  KYC_APPROVED,
  KYC_REJECTED,
  NO_SPECIFIED_REASON,
} = require("../utils/enum");

const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user
      ref: USER,
      required: true,
    },
    documents: [
      {
        documentType: { type: String, required: true },
        documentUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    kycStatus: {
      type: String,
      enum: [KYC_PENDING, KYC_APPROVED, KYC_REJECTED],
      default: KYC_PENDING,
    },
    alternateNumber: { type: String, required: true }, // Ensure this is required
    currentAddress: { type: String, required: true }, // Ensure this is required
    rejectReason: { type: String, default: NO_SPECIFIED_REASON }, // New field for rejection reason
  },
  { timestamps: true }
);

const KYC = mongoose.model("KYC", kycSchema);

module.exports = KYC;
