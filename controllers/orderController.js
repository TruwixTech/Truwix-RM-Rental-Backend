const WishList = require("../models/WishList");
const CartSchema = require("../models/CartSchema");
const Order = require("../models/OrderSchema");
const Product = require("../models/Product");
const moment = require("moment");
const Payment = require("../models/PaymentSchema");
const { default: Pincode } = require("pincode-distance");
const { COST_MAPPING } = require("../utils/config");
const User = require("../models/User");

exports.createOrder = async (req, res) => {
  try {
    const { pincodeTo, cartTotal, shippingCost, cartItems, address } = req.body;
    const userId = req?.user?.id;
    console.log("User ID:", userId);
    console.log("Pincode To:", pincodeTo);

    // Check if user is authenticated
    if (!userId) {
      console.log("Unauthorized access");
      return res.json({
        success: false,
        error: "Unauthorized access",
      });
    }

    const pincodeFrom = 221304;

    // Fetch user address based on pincode
    var user = await User.findById(userId);
    console.log("User data:", user);

    // Fetch the cart for the user
    const cart = await CartSchema.findOne({ user: userId }).populate(
      "items.product"
    );
    console.log("User cart:", cart);

    // Check if cart exists and has items
    if (!cart || cart.items.length === 0) {
      console.log("Cart is empty or not found");
      return res.json({
        success: false,
        error: "Cart is empty or not found",
      });
    }

    // Prepare products array from cart items, including rental details
    const products = cart.items.map((item) => ({
      product: item.product._id,
      quantity: item.rentOptions.quantity,
      rentMonthsCount: item.rentOptions.rentMonthsCount,
      rentMonths: item.rentOptions.rentMonths,
      expirationDate: moment().add(item.rentOptions.rentMonthsCount, "months"), // Setting expiration based on rental months
    }));
    console.log("Products in the cart:", products);

    // // Array to store product sizes for shipping cost calculation
    // let productSizeArray = [];

    // // Loop through products and calculate total price
    // for (let i = 0; i < products.length; i++) {
    //   const product = await Product.findById(products[i].product);
    //   console.log(`Product ${i + 1}:`, product);

    //   // Check if the product exists and has valid rent price for the given months
    //   const rentOption = product.rentalOptions[`rent${products[i].rentMonthsCount}Months`];
    //   if (!product || !rentOption || !products[i].quantity) {
    //     console.log("Product information missing or invalid rental price/quantity");
    //     return res.json({
    //       success: false,
    //       error: "Product information missing or invalid rental price/quantity",
    //     });
    //   }

    //   // Calculate total price based on the rent
    //   totalPrice += parseFloat(rentOption) * products[i].quantity;
    //   console.log("Current total price:", totalPrice);

    //   // Collect product sizes
    //   productSizeArray.push(product.size);
    // }

    // console.log("Product size array:", productSizeArray);

    // // Check if multiple product sizes exist in the cart
    // const productSizeSet = new Set(productSizeArray);
    // console.log("Unique product sizes in the cart:", productSizeSet.size);

    // if (productSizeSet.size > 1) {
    //   console.log("Products of different sizes cannot be ordered together");
    //   return res.json({
    //     success: false,
    //     error: "Products of different sizes cannot be ordered together",
    //   });
    // }

    // // Calculate shipping cost based on product size and distance
    // if (products.length <= 3) {
    //   shippingCost = COST_MAPPING[3][productSizeArray[0]].rs * distance;
    // } else {
    //   shippingCost = COST_MAPPING[6][productSizeArray[0]].rs * distance;
    // }

    // console.log("Calculated shipping cost:", shippingCost);

    // // Calculate total cost
    // const totalCost = {
    //   totalCost: cartTotal,
    //   shippingCost: shippingCost,
    //   distance: distance,
    //   productCost: totalPrice,
    //   finalCost: totalPrice + shippingCost,
    // };

    // console.log("Total cost breakdown:", totalCost);

    // Set expected delivery date
    const expectedDelivery = moment().add(7, "days");
    console.log("Expected delivery date:", expectedDelivery);

    // Create the order
    const order = await Order.create({
      user: userId,
      products,
      totalPrice: cartTotal,
      shippingCost,
      shippingAddress: address,
      expectedDelivery,
    });
    console.log("Order created successfully:", order);

    // Save the order
    await order.save();

    // Create a payment entry for the order
    const paymentSchema = await Payment.create({
      orderId: order._id,
      amount: cartTotal,
      currency: "INR",
      userId: userId,
    });
    console.log("Payment entry created:", paymentSchema);

    // Save the payment entry
    await paymentSchema.save();

    // Return the successful order data
    return res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error creating order:", error);
    return res.json({
      success: false,
      error: error.message,
    });
  }
};

// old one
// exports.createOrder = async (req, res) => {
//   try {
//     const { pincodeTo } = req.body;
//     const userId = req?.user?.id;
//     if (!req?.user?.id) {
//       return res.json({
//         success: false,
//         error: "Unauthorized access",
//       });
//     }
//     const pincodeFrom = 221304;
//     var address = await User.findById(userId);
//     address = address.address;
//     address = address.find((add) => add.pincode === pincodeTo);
//     const cart = await CartSchema.findOne({ user: userId }).populate(
//       "items.product"
//     );
//     if (!cart) {
//       return res.json({
//         success: false,
//         error: "Cart not found",
//       });
//     }
//     const products = cart.items.map((item) => ({
//       product: item.product._id,
//       quantity: item.quantity,
//       expirationDate: moment().add(7, "days"),
//     }));
//     let totalPrice = 0;
//     let shippingCost = 0;
//     const Pincode_ = new Pincode();
//     const distance = Pincode_.getDistance(
//       parseInt(pincodeTo),
//       parseInt(pincodeFrom)
//     );
//     let productSizeArray = [];
//     for (let i = 0; i < products.length; i++) {
//       const product = await Product.findById(products[i].product);
//       totalPrice += product.buyPrice * products[i].quantity;
//       productSizeArray.push(product.size);
//     }
//     const productSizeSet = new Set(productSizeArray);
//     if (productSizeSet.size > 1) {
//       return res.json({
//         success: false,
//         error: "Products of different sizes cannot be ordered together",
//       });
//     } else {
//       if (products.length <= 3) {
//         shippingCost = COST_MAPPING[3][productSizeArray[0]].rs * distance;
//       } else {
//         shippingCost = COST_MAPPING[6][productSizeArray[0]].rs * distance;
//       }
//     }

//     const totalCost = {
//       totalCost: totalPrice,
//       shippingCost: shippingCost,
//       distance: distance,
//       productCost: totalPrice,
//       finalCost: totalPrice + shippingCost,
//     };
//     const expectedDelivery = moment().add(7, "days");
//     const order = await Order.create({
//       user: userId,
//       products,
//       totalPrice: parseInt(totalCost.finalCost),
//       shippingCost,
//       shippingAddress: address,
//       expectedDelivery,
//     });
//     await order.save();
//     const paymentSchema = await Payment.create({
//       orderId: order._id,
//       amount: parseInt(order.finalCost),
//       currency: "INR",
//     });
//     await paymentSchema.save();
//     //clear user cart

//     return res.json({ success: true, data: order });
//   } catch (error) {
//     console.error("Error creating order:", error);
//     res.json({ success: false, error: error.message });
//   }
// };

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

exports.updateOrder = async (req, res) => {
  console.log("Received update request for order");

  try {
    const { status, orderDate } = req.body;

    // Validate that at least one field is being updated
    if (status === undefined && !orderDate) {
      return res.status(400).json({ 
        success: false, 
        error: "Please provide status or orderDate to update" 
      });
    }

    // Find the order by ID
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: "Order not found" });
    }

    console.log("Order found:", order);

    // Update the order with conditional status update
    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      {
        $set: { 
          status: status !== undefined ? status : order.status, // Keep the current status if undefined
          orderDate: orderDate || order.orderDate // Keep the current orderDate if undefined
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
      return res.status(404).json({ success: false, error: "Order not found after update" });
    }
  } catch (error) {
    console.error("Error updating order:", error.message);
    res.status(500).json({ success: false, error: error.message });
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

    // If a cart exists for the user
    if (cart) {
      // Check if the product is already in the cart
      let existingProduct = cart.items.find(
        (item) => item.product.toString() === items.product
      );

      if (existingProduct) {
        // If the product is already in the cart, return the message
        return res.status(400).json({
          success: false,
          message: "Product already in the cart with a rent configuration",
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
      "items.product"
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
