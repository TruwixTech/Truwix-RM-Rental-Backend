const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticate } = require("../middlewares/authMiddleware");

router.post("/create/order", authenticate, orderController.createOrder);
router.post("/order/getTotalCost", authenticate, orderController.getTotalCost);
router.post(
  "/order/verifyPayment",
  authenticate,
  orderController.verifyPayment
);
router.get("/orders", authenticate, orderController.getOrders);
router.get("/getCustomerWithOrders", authenticate, orderController.customerWithOrders);
router.get("/orders/:id", authenticate, orderController.getMyOrders);
router.get("/orders/:id", authenticate, orderController.getOrderById);
router.put("/orders/:id", authenticate, orderController.updateOrder);
router.put("/admin/orders/update", authenticate, orderController.updateOrderFromAdminOrdersSidebar);
router.delete("/orders/:id", authenticate, orderController.deleteOrder);
router.get("/order/cart", authenticate, orderController.getCart);
router.put("/order/cart", authenticate, orderController.updateCart);
router.delete("/order/cart", authenticate, orderController.deleteCart);
router.post("/order/cart", authenticate, orderController.addToCart);
router.put(
  "/order/cart/delete",
  authenticate,
  orderController.removeItemFromCart
);
router.get("/order/whishlist", authenticate, orderController.getWishlist);
router.post("/order/whishlist", authenticate, orderController.addToWishlist);
router.delete("/order/whishlist", authenticate, orderController.deleteWishlist);
router.put("/order/whishlist", authenticate, orderController.updateWishlist);
router.put('/order/update/:id', authenticate, orderController.updateOrder2);
module.exports = router;