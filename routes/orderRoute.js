const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const Order = require("../models/OrderSchema");
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
module.exports = router;

router.patch('/orders/:id/endDate', async (req, res) => {
  const { id } = req.params;

  try {
      // Find the order by ID
      const order = await Order.findById(id);

      if (!order) {
          return res.status(404).json({ message: 'Order not found' });
      }

      // Calculate the new endDate (add one month to the current endDate)
      const currentEndDate = order.endDate || new Date(); // Use existing endDate or current date if not set
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + 1);

      // Update the order's endDate
      order.endDate = newEndDate;
      await order.save();

      res.status(200).json({ message: 'endDate updated successfully', order });
  } catch (error) {
      res.status(500).json({ message: 'Error updating endDate', error: error.message });
  }
});
