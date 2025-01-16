const express = require("express");
const router = express.Router();

const {
  login,
  signup,
  getUserCount,
  getAddress,
  deleteAddress,
  addAddress,
  forgotPassword,
  googleOAuth,
  userDetails
} = require("../controllers/Auth");
const { authenticate } = require("../middlewares/authMiddleware");
const {
  sendWhatsAppOtp,
  verifyWhatsAppOtp,
} = require("../controllers/otpController");
const {
  getMyOrderProductNames,
  cancelOrder,
} = require("../controllers/orderController");

const {
  uploadKYC,
  getKYCStatus,
  getAllKYC,
  updateKYCStatus,
} = require("../controllers/kycController");
const multer = require("multer");
const { storage } = require("../config/cloudinary");
const upload = multer({ storage });
const { getDistance } = require("../controllers/shippingController");

router.post("/oauth", googleOAuth);
router.post("/user-details", userDetails)
router.post("/login", login);
router.post("/signup", signup);
router.patch("/password", forgotPassword);
router.post("/verifysend/:id", sendWhatsAppOtp);
router.get("/verifycheck/:contact/:otp", verifyWhatsAppOtp);
router.get("/counter", getUserCount);
router.post("/kyc/upload/:id", upload.array("files"), uploadKYC);
router.get("/kyc/status/:id", getKYCStatus);
router.get("/address", authenticate, getAddress);
router.post("/address", authenticate, addAddress);
router.delete("/address", authenticate, deleteAddress);

// admin kyc routes

router.get("/kyc", getAllKYC);
router.put("/kyc", updateKYCStatus);
router.get("/order/orders/:id", getMyOrderProductNames);
router.put("/order/cancel/:id", cancelOrder);

router.post("/shipping", getDistance);

module.exports = router;
