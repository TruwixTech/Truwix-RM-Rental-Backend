const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [
    {
      product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
      },
      rentOptions: {
        rentMonthsCount: {
          type: Number,
          enum: [3, 6, 9, 12],
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        rentMonths: {
          type: String,
          required: false,
        },
      },
    },
  ],
}, {timestamps: true});


// Add custom validation hook to ensure single product entry per user
// Add custom validation hook to ensure single product entry per user
// cartSchema.pre("save", async function (next) {
//   const cart = this;
  
//   // Only proceed if items are being added to the cart
//   if (cart.isNew || cart.isModified("items")) {
//     const existingCart = await mongoose
//       .model("Cart")
//       .findOne({ user: cart.user });

//     if (existingCart) {
//       // Check if any item in the existing cart has the same product ID as the newly added items
//       for (const newItem of cart.items) {
//         const existingItem = existingCart.items.find(
//           (i) => i.product.toString() === newItem.product.toString()
//         );

//         if (existingItem) {
//           // Prevent duplicate product entry
//           const err = new Error(`Product already in the cart.`);
//           return next(err);
//         }
//       }
//     }
//   }
  
//   next();
// });


module.exports = mongoose.model("Cart", cartSchema);
