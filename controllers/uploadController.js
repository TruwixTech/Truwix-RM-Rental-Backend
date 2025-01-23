const cloudinary = require('../config/cloudinary.js');

const uploadImage = (req, res) => {
  if (!req.file) {
    return res.json({ error: "No file uploaded" });
  }
  res
    .status(200)
    .json({ message: "Image uploaded successfully", url: req.file.path });
};

const uploadBillDocuments = async (req, res) => {
  try {
    // Check if files are received
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No files were uploaded.",
      });
    }

    const documents = req.files.map(file => ({
      documentType: file.originalname,
      documentUrl: file.path,
      uploadedAt: new Date()
    }));

    // Create new BillDocuments record
    const billDocuments = new BillDocuments({
      documents
    });

    await billDocuments.save();

    return res.status(201).json({
      success: true,
      message: "Bill documents uploaded successfully.",
      documentCount: documents.length
    });

  } catch (error) {
    logger.error("Error uploading bill documents:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error."
    });
  }
};

exports.uploadBillDocuments = uploadBillDocuments;
exports.uploadImage = uploadImage;
