const { log } = require("console");
const Product = require("../models/Product");
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
      fabricCare,
      woodType,
      seatingCapacity,
      configType,
      colorOptions,
      month,
      size,
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
    if (!title || !category || !size) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: title, category, size.",
      });
    }

    // Create the product
    const product = new Product({
      title,
      sub_title,
      img: productImages,
      category,
      size,
      details: {
        description: description,
        fabricCare: {
          material: fabricCare?.material,
          color: fabricCare?.color,
        },
        woodType: {
          material: woodType?.material,
          color: woodType?.color,
        },
        seatingCapacity: seatingCapacity,
        configType: configType,
        colorOptions: colorOptions,
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
    console.error("Error creating product:", error);
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

    var products = await Product.find(query);
    var addOns = await AddOn.find({
      product: { $in: products.map((p) => p._id) },
    });
    products = products.map((p) => {
      p = p.toObject();
      p.addOns = addOns.filter((a) => a.product.equals(p._id));
      return p;
    });
    res.status(200).json({ success: true, data: products });
  } catch (error) {
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
    const {
      title,
      sub_title,
      buyPrice,
      category,
      size,
      description,
      fabricCare,
      woodType,
      seatingCapacity,
      configType,
      colorOptions,
      month,
      rentalOptions,
      addOns,
    } = req.body;

    let img = req.body.img;

    if (req.files && req.files.length > 0) {
      img = req.files.map(
        (file) =>
          `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
      );
    }

    const parsedFabricCare =
      typeof fabricCare === "string" ? JSON.parse(fabricCare) : fabricCare;
    const parsedWoodType =
      typeof woodType === "string" ? JSON.parse(woodType) : woodType;
    const parsedColorOptions =
      typeof colorOptions === "string"
        ? JSON.parse(colorOptions)
        : colorOptions;
    const parsedMonth = typeof month === "string" ? JSON.parse(month) : month;
    const parsedRentalOptions =
      typeof rentalOptions === "string"
        ? JSON.parse(rentalOptions)
        : rentalOptions;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        title,
        sub_title,
        buyPrice,
        img,
        category,
        size,
        details: {
          description,
          fabricCare: parsedFabricCare,
          woodType: parsedWoodType,
          seatingCapacity,
          configType,
          colorOptions: parsedColorOptions,
          month: parsedMonth,
        },
        rentalOptions: parsedRentalOptions,
        addOns,
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
    console.error("Error updating product:", error);
    res.status(400).json({ success: false, error: error.message });
  }
};

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

exports.searchProducts = async (req, res) => {
  try {
    const { query } = req.body;
    const products = await Product.find({
      title: { $regex: query, $options: "i" },
    });
    res.json({ success: true, data: products });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
};
