const mongoose = require("mongoose");

// Define KYC Schema with timestamps enabled
const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId, // Reference to the user
      ref: "User",
      required: true,
    },
    documents: [
      {
        documentType: { type: String, required: true }, // e.g., Passport, License, etc.
        documentUrl: { type: String, required: true }, // URL to the uploaded document
        uploadedAt: { type: Date, default: Date.now }, // Timestamp when the document was uploaded
      },
    ],
    kycStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
); // Enables createdAt and updatedAt fields

// Ensure a max of 5 documents
kycSchema.pre("save", function (next) {
  if (this.documents.length > 5) {
    throw new Error("Max 5 Documents Allowed.");
  }
  next();
});

// Export KYC Model
const KYC = mongoose.model("KYC", kycSchema);
module.exports = KYC;
