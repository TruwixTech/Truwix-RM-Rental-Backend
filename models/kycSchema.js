const mongoose = require("mongoose");

const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user
      ref: "User",
      required: true,
    },
    documents: [
      {
        documentType: { type: String, required: true },
        documentUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    kycStatus: { type: String, default: "Pending" },
    alternateNumber: { type: String, required: true }, // Ensure this is required
    currentAddress: { type: String, required: true }, // Ensure this is required
  },
  { timestamps: true }
);

const KYC = mongoose.model("KYC", kycSchema);

module.exports = KYC;
