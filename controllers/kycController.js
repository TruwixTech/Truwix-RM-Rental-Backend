const cloudinary = require("cloudinary").v2;
const KYC = require("../models/kycSchema");
const User = require("../models/User");
const { KYC_PENDING, KYC_APPROVED, KYC_REJECTED } = require("../utils/enum");

exports.updateKYCStatus = async (req, res) => {
  const { kycId, newStatus, rejectedReason } = req.body;

  // Check if the new status is valid
  const validStatuses = [KYC_PENDING, KYC_APPROVED, KYC_REJECTED];
  if (!validStatuses.includes(newStatus)) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid KYC status. It must be either 'Pending', 'Approved', or 'Rejected'.",
    });
  }

  const updateFields = { kycStatus: newStatus };

  // Only include rejectReason if the status is 'Rejected'
  if (newStatus === KYC_REJECTED && rejectedReason) {
    updateFields.rejectReason = rejectedReason;
  }

  try {
    const kyc = await KYC.findByIdAndUpdate(kycId, updateFields, { new: true });

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC record not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "KYC status updated successfully.",
      data: kyc,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the KYC status.",
      error: error.message,
    });
  }
};

exports.getAllKYC = async (req, res) => {
  try {
    const kycs = await KYC.find()
      .populate("userId", "name email mobileNumber") // Populate user with name, email, and mobileNumber
      .exec(); // Execute the query

    return res.status(200).json({
      success: true,
      message: "Fetched all KYC records successfully.",
      data: kycs,
    });
  } catch (error) {
    logger.error("Error fetching KYCs:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch KYC records.",
    });
  }
};

exports.uploadKYC = async (req, res) => {
  try {
    const userId = req.params.id;
    const { alternateNumber, currentAddress } = req.body;

    // Validate required fields
    if (!alternateNumber || !currentAddress) {
      return res.status(400).json({
        success: false,
        error: "alternateNumber and currentAddress are required.",
      });
    }

    const documents = []; // Declare documents array here

    // Check if files are received and process them
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        documents.push({
          documentType: file.originalname,
          documentUrl: file.path, // Cloudinary URL from the storage
          uploadedAt: new Date(),
        });
      }
    }

    // Check for existing KYC records
    const existingKyc = await KYC.findOne({ userId });
    if (existingKyc && existingKyc.documents.length + documents.length > 5) {
      return res.status(400).json({
        success: false,
        error: "A user can upload a maximum of 5 documents.",
      });
    }

    // Update or create KYC record
    if (existingKyc) {
      existingKyc.documents.push(...documents);
      existingKyc.alternateNumber = alternateNumber; // Update alternate number
      existingKyc.currentAddress = currentAddress; // Update current address
      await existingKyc.save();
    } else {
      const kyc = new KYC({
        userId,
        documents,
        kycStatus: KYC_PENDING,
        alternateNumber, // Store alternate number
        currentAddress, // Store current address
      });
      await kyc.save();
    }

    return res.status(201).json({
      success: true,
      message: "KYC documents uploaded successfully.",
    });
  } catch (error) {
    logger.error("Error uploading KYC documents:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error.",
    });
  }
};

exports.getKYCStatus = async (req, res) => {
  try {
    const userId = req.params.id;

    const kyc = await KYC.findOne({ userId });

    if (!kyc) {
      return res.status(404).json({
        success: false,
        message: "KYC record not found for the user.",
      });
    }

    return res.status(200).json({
      success: true,
      kycStatus: kyc.kycStatus,
      documents: kyc.documents,
      rejectReason: kyc.rejectReason, // Include rejectReason in the response
    });
  } catch (error) {
    logger.error("Error fetching KYC status:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error.",
    });
  }
};
