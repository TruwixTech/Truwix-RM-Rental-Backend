const { log } = require("console");
const Product = require("../models/Product");
const { logger } = require("../utils/logger");
const path = require("path");
const CartSchema = require("../models/CartSchema");
const AddOn = require("../models/AddOnSchema");
const cloudinary = require("cloudinary").v2;

exports.createProduct = async (req, res) => {
  try {
    const {
      title,
      sub_title,
      category,
      img = [],
      description,
      // fabricCare,
      // woodType,
      // seatingCapacity,
      // configType,
      // colorOptions,
      month,
      // size,
      rent3Months,
      rent6Months,
      rent9Months,
      rent12Months,
    } = req.body;

    let productImages = img;

    // Handle file uploads if files are present
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "productImages",
          transformation: [{ width: 500, height: 500, crop: "limit" }],
        });
        productImages.push(result.secure_url);
      }
    }

    // Check for required fields
    if (!title || !category || !month || !img) {
      return res.status(400).json({
        success: false,
        error: "All Fields Are Necessary",
      });
    }

    // Create the product
    const product = new Product({
      title,
      sub_title,
      img: productImages,
      category,
      // size,
      details: {
        description: description,
        // fabricCare: {
        //   material: fabricCare?.material,
        //   color: fabricCare?.color,
        // },
        // woodType: {
        //   material: woodType?.material,
        //   color: woodType?.color,
        // },
        // seatingCapacity: seatingCapacity,
        // configType: configType,
        // colorOptions: colorOptions,
        month: month,
      },
      rentalOptions: {
        rent3Months: rent3Months ? rent3Months : null,
        rent6Months: rent6Months ? rent6Months : null,
        rent9Months: rent9Months ? rent9Months : null,
        rent12Months: rent12Months ? rent12Months : null,
      },
    });

    // Save the product to the database
    await product.save();

    return res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    logger.error("Error creating product:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.createProductV2 = async (req, res) => {
  try {
    const {
      title,
      sub_title,
      category,
      img = [],
      description,
      month = [],
      rentalOptions = {},
      quantity,
    } = req.body;

    let productImages = img;

    // Handle file uploads if files are present
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "productImages",
          transformation: [{ width: 500, height: 500, crop: "limit" }],
        });
        productImages.push(result.secure_url);
      }
    }

    // Check for required fields
    if (!title || !category || !month.length || !img || !quantity) {
      return res.status(400).json({
        success: false,
        error: "All Fields Are Necessary",
      });
    }

    // Validate rental options
    const rentalOptionsMap = {};
    for (const [key, value] of Object.entries(rentalOptions)) {
      const monthNumber = parseInt(key, 10);
      if (isNaN(monthNumber) || monthNumber <= 0) {
        return res.status(400).json({
          success: false,
          error: `Invalid month value in rental options: ${key}`,
        });
      }
      rentalOptionsMap[monthNumber] = value;
    }

    // Create the product
    const product = new Product({
      title,
      sub_title,
      img: productImages,
      category,
      details: {
        description: description,
        month: month,
      },
      rentalOptions: rentalOptionsMap,
      quantity,
    });

    // Save the product to the database
    await product.save();

    return res.status(201).json({
      success: true,
      product,
    });
  } catch (error) {
    logger.log("Error creating product:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { category } = req.query;
    let query = {};

    if (category) {
      query.category = category;
    }

    let products = await Product.find(query);

    const addOns = await AddOn.find({
      product: { $in: products.map((p) => p._id) },
    });

    products = products.map((p) => {
      p = p.toObject();
      if (p.rentalOptions instanceof Map) {
        p.rentalOptions = Object.fromEntries(p.rentalOptions);
      }
      p.addOns = addOns.filter((a) => a.product.equals(p._id));
      return p;
    });
    
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    logger.error(error);
    res.status(400).json({ success: false, error: error.message });
  }
};


exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { title, sub_title, img, category, details, rentalOptions } =
      req.body;

    const parsedDetails =
      typeof details === "string" ? JSON.parse(details) : details;

    // Extract description and month into separate variables
    const descExtracted = parsedDetails.description;
    const monthExtracted = Array.isArray(parsedDetails.month)
      ? parsedDetails.month
      : [];

    logger.info(img);

    // Initialize img with existing images from request
    let newImg = Array.isArray(img) ? img : [img]; // Ensure img is an array

    // Add any new files uploaded to the img array
    if (req.files && req.files.length > 0) {
      const uploadedImages = req.files.map(
        (file) =>
          `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
      );
      newImg = [...newImg, ...uploadedImages]; // Combine existing and new images
    }

    // Filter out null, undefined, or empty images
    newImg = newImg.filter((image) => image && image.trim() !== "");

    // Parse rentalOptions if it's sent as a string
    const parsedRentalOptions =
      typeof rentalOptions === "string"
        ? JSON.parse(rentalOptions)
        : rentalOptions;

    logger.info(newImg);

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        title,
        sub_title,
        img: newImg, // Updated images array without nulls
        category,
        details: {
          description: descExtracted,
          month: monthExtracted,
        },
        rentalOptions: parsedRentalOptions,
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    res.status(200).json({ success: true, data: product });
  } catch (error) {
    logger.error("Error updating product:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.resetProductQuantity = async (req, res) => {
  try
  {
    const {id} = req.params;
    let quantity = 0;
    
    if(!id || typeof id !== "string")
    {
      return res.status(400).json({ success: false, error: "Invalid ID provided" });
    }
    
    const product = await Product.findByIdAndUpdate(
      id,
        {quantity},
        {new:true}
    );
    
    if(!product)
    {
      return res.status(404).json({success:false,error:"Product not found"});
    }
    
    logger.info("Update Product's Quantity with 0");
    res.status(200).json({ success: true, data: product });
  } 
  
  catch (error) {
    logger.error("Error updating product:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.updateProductQuantity = async (req, res) => {
  try
  {
    const {id} = req.params;
    const {quantity} = req.body;
    
    if(!quantity || typeof quantity !== "string")
    {
      return res.status(400).json({ success: false, error: "Provide Quantity in Number"});
    }
    
    const product = await Product.findByIdAndUpdate(
      id,
        {quantity},
        {new:true}
    );
    
    if(!product)
    {
      return res.status(404).json({success:false,error:"Product not found"});
    }
    
    logger.info("Update Product's Quantity with 0");
    res.status(200).json({ success: true, data: product });
  } 
  
  catch (error) {
    logger.error("Error updating product:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.reduceproductbyone = async (req,res) => {
  try {
    const { id } = req.params;
    
    const product = await Product.findOne({ _id: id }).exec();

    if (!product) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    if (product.quantity <= 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Cannot decrease quantity below zero",
        currentQuantity: product.quantity 
      });
    }

    const updatedproduct = await Product.findByIdAndUpdate(
      id,
      { $inc: { quantity: -1 } },
      { new: true }
    );
    
    if (!updatedproduct) {
      return res.status(404).json({ success: false, error: "Product not found" });
    }

    logger.info("Updated Product's Quantity");
    res.status(200).json({ success: true, data: updatedproduct });
  } catch (error) {
    logger.error("Error updating product:", error);
    res.status(400).json({ success: false, error: error.message });
  }
}

exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
exports.addAddOns = async (req, res) => {
  try {
    const { product, name, price, description } = req.body;
    const addOn = new AddOn({
      product,
      name,
      price,
      description,
    });
    await addOn.save();
    res.status(200).json({ success: true, data: cart });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
exports.getProductCount = async (req, res) => {
  try {
    const count = await Product.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// exports.searchProducts = async (req, res) => {
//   try {
//     const { query } = req.body;
//     const products = await Product.find({
//       title: { $regex: query, $options: "i" },
//     });
//     res.json({ success: true, data: products });
//   } catch (error) {
//     res.json({ success: false, error: error.message });
//   }
// };

exports.searchProducts = async (req, res) => {
  try {
    const query = req.query.query;
    logger.info("query", req.query);

    if (!query) {
      return res.status(400).json({ message: "Query parameter is required" });
    }

    // Search products whose title contains the query (case-insensitive)
    const products = await Product.find({
      title: { $regex: query, $options: "i" },
    }).select("title _id"); // Return both the title and id

    // Send an array of products containing both id and title
    res.json(
      products.map((product) => ({
        id: product._id,
        title: product.title,
      }))
    );
  } catch (error) {
    logger.error("Error searching products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteProduct = async (req, res) => {
  const productId = req.params.id;

  try {
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).send({ message: "Product not found" });
    }

    res.send({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    res
      .status(500)
      .send({ message: "Error deleting product", error: error.message });
  }
};
