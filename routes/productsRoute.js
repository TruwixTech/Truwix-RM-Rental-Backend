const express = require("express");
const router = express.Router();
const productsController = require("../controllers/productController");
const reviewsController = require("../controllers/reviewsController");
const {
  authenticate,
  authorizeAdmin,
} = require("../middlewares/authMiddleware");
const multer = require("multer");
const { storage } = require("../config/cloudinary");
//const uploadController = require("../controllers/uploadController");

const upload = multer({ storage });
// Apply authentication middleware
// router.use(authenticate);

// Product routes
router.get("/search", productsController.searchProducts);

router.post(
  "/",
  authenticate,
  authorizeAdmin,
  upload.array("img", 5),
  productsController.createProduct
);
router.post(
  "/add-product-v2",
  authenticate,
  authorizeAdmin,
  upload.array("img", 5),
  productsController.createProductV2
);
router.get("/", productsController.getProducts);
router.get("/count", productsController.getProductCount);
router.get("/:id", productsController.getProductById);
router.put(
  "/:id",
  authenticate,
  authorizeAdmin,
  upload.array("img", 5), // Handle up to 5 new images
  productsController.updateProduct
);

router.delete(
  "/:id",
  authenticate,
  authorizeAdmin,
  productsController.deleteProduct
);
router.post(
  "/addon",
  authenticate,
  authorizeAdmin,
  productsController.addAddOns
);
router.post("/:id/reset-product-quantity",productsController.resetProductQuantity);
router.put("/:id/update-product-quantity",productsController.updateProductQuantity);

router.put("/:id/reduce-product-quantity-by-one",productsController.reduceproductbyone);

// Review routes
router.post("/reviews", authenticate, reviewsController.addReview);
router.get("/:id/reviews", authenticate, reviewsController.getReviews);

// POST route to handle file upload
//router.post("/upload", upload.single("image"), uploadController.uploadImage);
// router.post("/search", productsController.searchProducts);

module.exports = router;
