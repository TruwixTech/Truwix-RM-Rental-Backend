const { logger } = require('../utils/logger');
const CartSchema = require("../models/CartSchema");
const Order = require("../models/OrderSchema");
const Product = require("../models/Product");
const moment = require("moment");
const Payment = require("../models/PaymentSchema");
const crypto = require("crypto");
const { default: Pincode } = require("pincode-distance");
const { COST_MAPPING } = require("../utils/config");
const User = require("../models/User");
const { PRODUCT, INR, ORDER_CANCELLED, PAYMENT_COMPLETED } = require("../utils/enum");
const axios = require('axios');
const { mailsender } = require("../service/mail");
const twilio = require("twilio");
let merchantId = process.env.MERCHANT_ID1;
let salt_key = process.env.SALT_KEY1;

async function updateProductQuantities(productsToUpdate) {
  try {
    const bulkOperations = productsToUpdate.map((item) => ({
      updateOne: {
        filter: { _id: item.product._id },
        update: { $inc: { quantity: -item.rentOptions.quantity } }, // Subtract quantity
      },
    }));

    const result = await Product.bulkWrite(bulkOperations);
  } catch (error) {
    console.error("Error updating product quantities:", error);
  }
}

exports.createOrder = async (req, res) => {
  try {
    const { cartItems, totalPrice, shippingCost, shippingAddress, MUID, transactionId, securityDeposit, furnitureRent, amenities, referredBonusUsed } = req.body;
    const userId = req?.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized access. Please log in.",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found.",
      });
    }

    const products = cartItems.map((item) => ({
      product: item.product._id,
      quantity: item.rentOptions?.quantity || 1,
      expirationDate: moment().add(
        item.rentOptions?.rentMonthsCount || 0,
        "months"
      ),
    }));

    const expectedDelivery = moment().add(2, "days");

    const lastOrder = await Order.findOne().sort({ createdAt: -1 });
    let nextNumber = 1;

    if (lastOrder && lastOrder.orderNumber) {
      const lastNumber = parseInt(lastOrder.orderNumber.slice(4));
      nextNumber = lastNumber + 1;
    }

    const paddedNumber = nextNumber.toString().padStart(6, "0");
    const orderNumber = `RMOR${paddedNumber}`;

    const amount = Math.round(totalPrice * 100);

    const orderData = {
      orderNumber,
      user: userId,
      products,
      amount,
      shippingCost,
      shippingAddress,
      expectedDelivery,
      furnitureRent,
      securityDeposit,
      MUID,
      merchantTransactionId: transactionId,
      redirectUrl: `${process.env.FRONTEND_URL1}/${transactionId}`,
      callbackUrl: `https://rmfurniturerental.in/`,
      redirectMode: "REDIRECT",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
      merchantId: merchantId,
    };

    const orderData2 = {
      orderNumber,
      user: userId,
      products,
      totalPrice,
      shippingCost,
      shippingAddress,
      expectedDelivery,
      furnitureRent,
      securityDeposit,
      MUID,
      merchantTransactionId: transactionId,
      amenities,
      redirectUrl: `${process.env.FRONTEND_URL1}/${transactionId}`,
      callbackUrl: `https://rmfurniturerental.in/`,
      redirectMode: "REDIRECT",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
      merchantId: merchantId,
    };

    const keyIndex = 1;
    const payload = JSON.stringify(orderData);
    const payloadMain = Buffer.from(payload).toString("base64");

    const string = payloadMain + "/pg/v1/pay" + salt_key;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    const prod_URL = process.env.PHONEPAY_API1;

    const options = {
      method: "POST",
      url: prod_URL,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: {
        request: payloadMain,
      },
    };
    // Send payment request
    axios.request(options)
      .then(async (response) => {
        if (response.status === 200 && response.data.success) {
          const orderCreated = await Order.create(orderData2);
          user.orders.push(orderCreated._id);
          user.referredBonusUsed = referredBonusUsed
          updateProductQuantities(cartItems);
          await user.save();
          res.json(response.data); // Send payment response to the frontend
        }
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send("Payment request failed");
      })
  } catch (error) {
    logger.error("Error creating order:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "An error occurred while creating the order.",
    });
  }
};

exports.getStatus = async (req, res) => {
  const { id: merchantTransactionId } = req.query; // Extract transaction ID from query
  const keyIndex = 1;

  try {
    // Construct the string for generating checksum
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;

    // Call the PhonePe status API
    const options = {
      method: 'GET',
      url: process.env.STATUS_API1 + `/pg/v1/status/${merchantId}/${merchantTransactionId}`,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': merchantId,
      },
    };

    const response = await axios(options);

    if (response.data.success) {
      // Payment is successful, update the order status in the database
      const order = await Order.findOne(
        { merchantTransactionId },
      );

      order.paymentStatus = "PAID"

      await order.save();

      const user = await User.findOne({ _id: order.user });

      await Payment.create({
        orderId: order._id,
        status: PAYMENT_COMPLETED,
        amount: order.totalPrice,
        currency: INR,
        userId: user._id,
      })

      await CartSchema.findOneAndUpdate(
        { user: order.user },
        { $set: { items: [] } },
        { new: true }
      )

      res.status(200).json({
        success: true,
        message: 'Payment successful',
        data: order, // Adjust based on actual response structure
      });
    } else {
      res.status(402).json({
        success: false,
        message: 'Payment failed',
        reason: response.data.data.message, // Adjust based on actual response structure
      });
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

exports.getOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("user")
      .populate("products.product");
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.customerWithOrders = async (req, res) => {
  try {
    const customer = await User.find()
      .populate("orders")
      .populate({
        path: "orders",
        populate: {
          path: "products.product", // Path to the nested field
          model: PRODUCT, // The model you're referencing
        },
      });
    const custWthOrders = customer.filter((cust) => cust.orders.length > 0);
    res.status(200).json({
      custWthOrders,
    });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const { id } = req.params; // Get the user id from the request parameters
    const orders = await Order.find({ user: id }) // Filter orders by user ID
      .populate("user")
      .populate("products.product");

    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getMyOrderProductNames = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Find the order by ID
    const order = await Order.findById(orderId).populate(
      "products.product",
      "title"
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Extract product titles from the order and return as an array
    const productTitles = order.products.map((item) => item.product.title);

    // Return the array of product names
    res.json(productTitles);
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user")
      .populate("products.product");
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;

    // Ensure orderId is provided
    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: "Please provide the orderId",
      });
    }

    // Find the order by ID and update the status to "cancelled"
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        $set: {
          status: ORDER_CANCELLED, // Set status to 'cancelled'
        },
      },
      { new: true, runValidators: true } // Ensure validators run
    );

    // Return the updated order data
    if (updatedOrder) {
      return res.status(200).json({
        success: true,
      });
    } else {
      return res.status(404).json({
        success: false,
        error: "Order not found",
      });
    }
  } catch (error) {
    logger.error("Error updating order:", error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const { status, orderDate, endDate } = req.body;

    // Validate that at least one field is being updated
    if (status === undefined && !orderDate) {
      return res.status(400).json({
        success: false,
        error: "Please provide status or orderDate to update",
      });
    }

    logger.info(orderDate);
    logger.info(endDate);

    // Find the order by ID
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    // Update the order with conditional status update
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          status: status !== undefined ? status : order.status, // Keep the current status if undefined
          orderDate: orderDate || order.orderDate, // Keep the current orderDate if undefined
          endDate: endDate || order.endDate,
        },
      },
      { new: true, runValidators: true } // Ensure validators run
    )
      .populate("user")
      .populate("products.product");

    // Return the updated order data
    if (updatedOrder) {
      return res.status(200).json({
        success: true,
        data: updatedOrder,
      });
    } else {
      return res
        .status(404)
        .json({ success: false, error: "Order not found after update" });
    }
  } catch (error) {
    logger.error("Error updating order:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateOrder2 = async (req, res) => {
  try {
    // Find the order by ID
    const { totalPrice, MUID, transactionId } = req.body
    const { id } = req.params
    const order = await Order.findByIdAndUpdate(
      id,
      { $set: { merchantTransactionId: transactionId } },
      { new: true, }
    )
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }
    const amount = Math.round(totalPrice * 100);

    const orderData = {
      amount,
      MUID,
      merchantTransactionId: transactionId,
      redirectUrl: `https://rmfurniturerental.in/payment/${transactionId}`,
      callbackUrl: `https://rmfurniturerental.in/`,
      redirectMode: "REDIRECT",
      paymentInstrument: {
        type: "PAY_PAGE",
      },
      merchantId: merchantId,
    };

    const keyIndex = 1;
    const payload = JSON.stringify(orderData);
    const payloadMain = Buffer.from(payload).toString("base64");

    const string = payloadMain + "/pg/v1/pay" + salt_key;
    const sha256 = crypto.createHash("sha256").update(string).digest("hex");
    const checksum = sha256 + "###" + keyIndex;

    const prod_URL = process.env.PHONEPAY_API1;

    const options = {
      method: "POST",
      url: prod_URL,
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        "X-VERIFY": checksum,
      },
      data: {
        request: payloadMain,
      },
    };
    // Send payment request
    axios.request(options)
      .then(async (response) => {
        res.json(response.data);
      })
      .catch((error) => {
        console.log(error);
        res.status(500).send("Payment request failed");
      })

  } catch (error) {
    logger.error("Error updating order endDate:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateOrder2GetStatus = async (req, res) => {
  const { id: merchantTransactionId } = req.query; // Extract transaction ID from query
  const { orderId } = req.body
  const keyIndex = 1;


  try {
    // Construct the string for generating checksum
    const string = `/pg/v1/status/${merchantId}/${merchantTransactionId}` + salt_key;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;

    // Call the PhonePe status API
    const options = {
      method: 'GET',
      url: process.env.STATUS_API1 + `/pg/v1/status/${merchantId}/${merchantTransactionId}`,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': merchantId,
      },
    };
    const response = await axios(options);
    if (response.data.success) {
      // Payment is successful, update the order status in the database
      const order = await Order.findOne(
        { merchantTransactionId },
      );

      const today = new Date();
      const newEndDate = moment(today).add(1, "month").toDate();
      // // Update and save the order
      // const order = await Order.findById(orderId);
      order.endDate = newEndDate;
      await order.save();

      res.status(200).json({
        success: true,
        message: 'Payment successful',
        data: order, // Adjust based on actual response structure
      });
    } else {
      res.status(402).json({
        success: false,
        message: 'Payment failed', // Adjust based on actual response structure
      });
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

// const accountSid = process.env.TWILIO_ACCOUNT_SID;
// const authToken = process.env.TWILIO_AUTH_TOKEN;
// const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER // Twilio's sandbox number
// const client = twilio(accountSid, authToken);

// async function sendWhatsAppInvoice(userMobile, order) {
//     try {
//         await client.messages.create({
//             from: whatsappNumber, // Twilio sandbox/business number
//             to: `whatsapp:+91${userMobile}`, // User's WhatsApp number
//             body: `Hello, your order #${order._id} has been delivered. Here is your invoice:`,
//         });

//         // console.log("WhatsApp message sent successfully!", message.sid);
//     } catch (error) {
//         console.error("Error sending WhatsApp message:", error.message);
//     }
// }

exports.updateOrderFromAdminOrdersSidebar = async (req, res) => {
  try {
    const { orderId, newStatus } = req.body;

    logger.info("Order id: ", orderId);
    logger.info("New Status: ", newStatus);

    // Find the order by ID and update its status
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true }
    );

    // const order = await Order.findById(orderId);
    const user = await User.findById(updatedOrder.user);
    // console.log(user.email);
    if (!updatedOrder) {
      console.error("Order not found");
      return;
    }

    // console.log("Order Found: ", user);

    // Fetch product details using product IDs
    const productsWithDetails = await Promise.all(
      updatedOrder.products.map(async (p) => {
        const product = await Product.findById(p.product);
        return {
          title: product ? product.title : "Unknown Product",
          sub_title: product ? product.sub_title : "",
          category: product ? product.category : "N/A",
          quantity: p.quantity,
          expirationDate: p.expirationDate,
        };
      })
    );
    // console.log("Products :" + productsWithDetails);

    if (newStatus == 'delivered') {
      // console.log("True");
      await mailsender(orderId, productsWithDetails, user.email);
      // if(user.mobileNumber){
      //   await sendWhatsAppInvoice(user.mobileNumber, updatedOrder);
      // }
      // console.log("Mail sent");
    }

    if (!updatedOrder) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Order status updated successfully", data: updatedOrder });
  } catch (error) {
    logger.error("Error updating order status:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update status" });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const { items } = req.body; // Get items from request body
    const user = req?.user?.id; // Get user ID from request

    // Find the cart for the current user
    let cart = await CartSchema.findOne({ user });

    // Construct the new rent option for the product
    const newRentOption = {
      rentMonthsCount: items.rentMonthsCount,
      rentMonths: items.rentMonths,
      quantity: items.quantity,
    };
    // console.log(items.product._id)
    // If a cart exists for the user
    if (cart) {
      // Check if the product is already in the cart
      let existingProduct = cart.items.find(
        (item) => item.product.toString() === items.product._id
      );

      if (existingProduct) {
        existingProduct.rentOptions.quantity += items.quantity;  // Add to the existing quantity

        // Save the updated cart
        await cart.save();

        return res.status(200).json({
          success: true,
          message: "Updated product quantity in cart with rent option",
          data: cart,
        });
      } else {
        // If the product is not in the cart, add it with the new rent option
        cart.items.push({
          product: items.product,
          rentOptions: newRentOption, // Directly assign the rent option object
        });

        // Save the updated cart
        await cart.save();

        return res.status(200).json({
          success: true,
          message: "Added product to cart with rent option",
          data: cart,
        });
      }
    } else {
      // If no cart exists, create a new cart with the product and rent option
      const newCart = await CartSchema.create({
        user,
        items: [
          {
            product: items.product,
            rentOptions: newRentOption, // Directly assign the rent option object
          },
        ],
      });

      return res.status(201).json({
        success: true,
        message: "Created new cart with product and rent option",
        data: newCart,
      });
    }
  } catch (error) {
    // Log error for debugging
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

exports.getCart = async (req, res) => {
  try {
    const cart = await CartSchema.findOne({ user: req.user.id }).populate(
      "items.product user"
    );
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateCart = async (req, res) => {
  try {
    const { user, quantity, productId } = req.body; // Removed 'item' to focus on quantity management
    const cart = await CartSchema.findOne({ user });

    if (!cart) {
      return res.status(404).json({ success: false, error: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (cartItem) => cartItem.product.toString() === productId
    );

    if (itemIndex >= 0) {
      // If the item exists in the cart
      if (quantity > 0) {
        cart.items[itemIndex].rentOptions.quantity = quantity; // Update quantity
      } else {
        cart.items.splice(itemIndex, 1); // Remove item if quantity is 0
      }
    } else if (quantity > 0) {
      // If the item does not exist and quantity is greater than 0, add it
      const item = {
        product: productId,
        rentOptions: {
          rentMonthsCount: req.body.rentMonthsCount, // Ensure to pass this from frontend
          rentMonths: req.body.rentMonths, // Ensure to pass this from frontend
          quantity,
        },
      };
      cart.items.push(item);
    }

    await cart.save();
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateCartQuantity = async (req, res) => {
  try {
    const { userCartNewData, userId } = req.body; // this will be the array of new cart data

    const cart = await CartSchema.findOne({ user: userId });
    cart.items = userCartNewData;
    await cart.save();
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.deleteCart = async (req, res) => {
  try {
    const cart = await CartSchema.findOneAndDelete({ user: req.params.userId });
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.removeItemFromCart = async (req, res) => {
  try {
    const { user, productId } = req.body;
    const cart = await CartSchema.findOne({
      user,
    });
    if (!cart) {
      return res.send({
        success: false,
        error: "Cart not found",
      });
    }
    const itemIndex = cart.items.findIndex(
      (cartItem) => cartItem.product == productId
    );
    if (itemIndex >= 0) {
      cart.items.splice(itemIndex, 1);
    }

    await cart.save();
    res.send({
      success: true,
      data: cart,
    });
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const { user, product } = req.body;

    let checkItem = await WishList.findOne({
      user,
    });
    if (checkItem) {
      let checkProduct = checkItem.products.find(
        (item) => item.product.toString() === product
      );

      if (checkProduct) {
        return res.send({
          success: false,
          error: "Product already in wishlist",
        });
      }
      checkItem.products.push({ product });
      checkItem.save();
      return res.send({ success: true, data: checkItem });
    } else {
      const wishlist = new WishList({
        user,
        products: [{ product }],
      });
      await wishlist.save();
      return res.send({ success: true, data: wishlist });
    }
  } catch (error) {
    res.send({ success: false, error: error.message });
  }
};
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await WishList.findOne({
      user: req.query.userId,
    }).populate("products.product");

    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { user, productId } = req.body;
    const wishlist = await WishList.findOne({
      user,
    });
    if (!wishlist) {
      return res.send({
        success: false,
        error: "Wishlist not found",
      });
    }
    const itemIndex = wishlist.products.findIndex(
      (wishlistItem) => wishlistItem.product == productId
    );
    if (itemIndex >= 0) {
      wishlist.products.splice(itemIndex, 1);
    }
  } catch (error) {
    res.send({
      success: false,
      error: error.message,
    });
  }
};

exports.deleteWishlist = async (req, res) => {
  try {
    const wishlist = await WishList.findOneAndDelete({
      user: req.params.userId,
    });
    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateWishlist = async (req, res) => {
  try {
    const { user, product, productId } = req.body;
    const wishlist = await WishList.findOne({
      user,
    });
    if (!wishlist) {
      return res
        .status(404)
        .json({ success: false, error: "Wishlist not found" });
    }
    const itemIndex = wishlist.products.findIndex(
      (wishlistItem) => wishlistItem.product == productId
    );

    if (product && itemIndex >= 0) {
      wishlist.products[itemIndex] = product;
    }
    await wishlist.save();

    res.status(200).json({ success: true, data: wishlist });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const userId = req?.user?.id;
    const payment = await Payment.findOneAndUpdate({ orderId }, { status });
    await CartSchema.findOneAndDelete({ user: userId });
    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getTotalCost = async (req, res) => {
  try {
    const { userId, pincodeFrom, pincodeTo } = req.body;
    if (!userId) {
      return res.json({
        success: false,
        error: "userId required",
      });
    }
    //get cart items
    const cart = await CartSchema.findOne({ user: userId }).populate(
      "items.product"
    );
    if (!cart) {
      return res.json({
        success: false,
        error: "Cart not found",
      });
    }
    const products = cart.items.map((item) => ({
      product: item.product._id,
      quantity: item.quantity,
      expirationDate: moment().add(7, "days"),
    }));

    let totalPrice = 0;
    let shippingCost = 0;
    const Pincode_ = new Pincode();
    const distance = Pincode_.getDistance(pincodeFrom, pincodeTo);
    for (let i = 0; i < products.length; i++) {
      const product = await Product.findById(products[i].product);
      totalPrice += product.price * products[i].quantity;
      if (products.length <= 3) {
        shippingCost *= COST_MAPPING[3][product.size].rs;
      } else {
        shippingCost *= COST_MAPPING[6][product.size].rs;
      }
    }

    const totalCost = {
      totalCost: totalPrice,
      shippingCost: shippingCost,
      distance: distance,
      productCost: totalPrice,
      finalCost: totalPrice + shippingCost,
    };
    res.status(200).json({ success: true, data: totalCost });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};


exports.updateFeedback = async (req, res) => {
  try {
    const { feedback, ordersIds } = req.body; // Receiving feedback and orderIds array

    if (!feedback) {
      return res.status(400).json({
        success: false,
        error: "Feedback is required",
      });
    }

    if (!Array.isArray(ordersIds) || ordersIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "orderIds must be a non-empty array",
      });
    }

    // Updating feedback for multiple orders
    const updatedOrders = await Order.updateMany(
      { _id: { $in: ordersIds } }, // Filter orders where _id is in orderIds array
      { $set: { feedback } }, // Set feedback field
      { new: true } // Return updated documents (optional for updateMany)
    );

    if (!updatedOrders.modifiedCount) {
      return res.status(404).json({
        success: false,
        error: "No orders were updated",
      });
    }

    res.status(200).json({ success: true, message: "Feedback updated successfully" });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};