const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "dpospktfw",
  api_key: process.env.CLOUDINARY_API_KEY || "592653876575991",
  api_secret:
    process.env.CLOUDINARY_API_SECRET || "QkBNPb6Wz0YoWSIgirS8s_xexHE",
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "uploads",
    allowedFormats: ["jpg", "jpeg", "png", "pdf"],
    transformation: [{ width: 500, height: 500, crop: "limit" }],
  },
});

module.exports = { cloudinary, storage };
