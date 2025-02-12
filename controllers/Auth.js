const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const Product = require("../models/Product");
const { USER } = require("../utils/enum");
require("dotenv").config();
const { logger } = require('../utils/logger');
var validator = require("email-validator");
const { mailsend_details } = require("../service/mail");

const googleClientId = process.env.GOOGLE_CLIENT_ID;
const gpiclient = new OAuth2Client(googleClientId);

exports.googleOAuth = async (req, res) => {
  const { token } = req.body;

  try {
    const ticket = await gpiclient.verifyIdToken({
      idToken: token,
      audience: googleClientId,
    });

    const { email, name, sub: googleId } = ticket.getPayload();

    const lastUser = await User.findOne().sort({ createdAt: -1 });

    let nextNumber = 1;
    if (lastUser && lastUser.customerId) {
      const lastNumber = parseInt(lastUser.customerId.slice(4));
      nextNumber = lastNumber + 1;
    }

    const paddedNumber = nextNumber.toString().padStart(6, "0");
    const customerId = `CUST${paddedNumber}`;

    const user = await User.findOneAndUpdate(
      { googleId },
      { name, email, googleId, customerId },
      { new: true, upsert: true }
    );

    // Explicitly generate Customer ID if not set

    const jwtToken = jwt.sign(
      {
        id: user?._id,
        email: user?.email,
        name: user?.name,
        role: user?.role,
      },
      process.env.JWT_SECRET
    );

    res.status(200).json({
      message: "Google login successful",
      token: jwtToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(401).json({ error: "Google authentication failed" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { mobileNumber, newPassword } = req.body;

    // Find the user by mobile number
    const user = await User.findOne({ mobileNumber });

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Account does not exist!" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password reset successful",
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong, please try again",
    });
  }
};

const generateUniqueReferredCode = async () => {
  let referredCode;
  let isUnique = false;

  while (!isUnique) {
    referredCode = Math.floor(100000 + Math.random() * 900000); // Generates a 6-digit number
    const existingUser = await User.findOne({ referredCode });
    if (!existingUser) {
      isUnique = true;
    }
  }

  return referredCode;
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password, mobileNumber, referredCode } = req.body;

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Validate email format
    if (!validator.validate(email)) {
      return res.status(400).json({ success: false, message: "Invalid email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate customerId
    const lastUser = await User.findOne().sort({ createdAt: -1 });
    let nextNumber = 1;
    if (lastUser && lastUser.customerId) {
      const lastNumber = parseInt(lastUser.customerId.slice(4));
      nextNumber = lastNumber + 1;
    }
    const paddedNumber = nextNumber.toString().padStart(6, "0");
    const customerId = `CUST${paddedNumber}`;

    // Check if referredCode exists and fetch the referring user
    let referredBy = null;
    if (referredCode) {
      const referringUser = await User.findOne({ referredCode });
      if (referringUser) {
        referredBy = referringUser._id;
      }
    }
    // Generate a unique referred code for the new user
    const newReferredCode = await generateUniqueReferredCode();

    // Create the new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      mobileNumber,
      role: "User",
      customerId,
      referredBy,
      referredCode: newReferredCode,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      success: false,
      message: "User cannot be registered, please try again",
    });
  }
};

exports.userUpdate = async (req, res) => {
  try {
    const { new_name, new_email, new_mobileNumber, new_address, userID } = req.body;

    if (!new_name || !new_email) {
      return res.status(400).json({
        success: false,
        message: "Please add new name and email",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      { _id: userID },
      {
        email: new_email,
        name: new_name,
        mobileNumber: new_mobileNumber,
        address: new_address,
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
    });
  }
  catch {
    logger.error(error);
    res
      .status(500)
      .json({ success: false, message: "UserUpdation failure. Please try again" });
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill up all the required fields",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User is not registered with us. Please sign up to continue",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (isPasswordValid) {
      const token = jwt.sign(
        { email: user.email, id: user._id, role: user.role },
        process.env.JWT_SECRET
      );

      user.password = undefined;

      res.status(200).json({
        success: true,
        token,
        user,
        message: "User login successful",
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  } catch (error) {
    logger.error(error);
    res
      .status(500)
      .json({ success: false, message: "Login failure. Please try again" });
  }
};

exports.userDetails = async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({
      success: false,
      message: "Please provide user id",
    });
  }

  const user = await User.findById(id).populate("orders");
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  res.status(200).json({
    success: true,
    user,
  });
};

exports.getUserCount = async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const address = req.body;
    if (!address) {
      return res.json({
        success: false,
        message: "Please provide address details",
      });
    }
    if (
      !address.pincode ||
      !address.addressLineOne ||
      !address.addressLineTwo
    ) {
      return res.json({
        success: false,
        message: "Please provide complete address details",
      });
    }
    const user = await User.findById(req?.user?.id);
    address.id = user.address.length + 1;
    const checkIfAddressExists = user.address.find(
      (add) => add.pincode === address.pincode
    );
    if (checkIfAddressExists) {
      return res.json({
        success: false,
        message: "Address with this pincode already exists",
      });
    }
    user.address.push(address);
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Address added successfully" });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.body;
    const user = await User.findById(req.user.id);
    user.address.pull(addressId);
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { addressId, address } = req.body;
    const user = await User.findById(req.user.id);
    const index = user.address.findIndex((add) => add.id === addressId);
    user.address[index] = address;
    await user.save();
    res
      .status(200)
      .json({ success: true, message: "Address updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({ address: user.address });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.submitHelpSupport = async (req,res) => {
    try
    {
      const app_details = req.body; 
      await mailsend_details(app_details);
      
      logger.info("Mailsend with Details function called");
      res.status(200).json({ 
        success: true, 
        message: "Application processed successfully.",
        app_details
    });
    }
    catch(error)
    {
      res
    .status(500)
    .send({ message: "Error Sending Mail with Buisness Details", error: error.message });
    }
}

exports.submitFranchise = async (req,res) => {
    try
    {
      const app_details = req.body; 
      await mailsend_details(app_details);

      logger.info("Mailsend with Details function called");
      res.status(200).json({ 
        success: true, 
        message: "Application processed successfully.",
        app_details
    });
    }
    catch(error)
    {
      res
    .status(500)
    .send({ message: "Error Sending Mail with Buisness Details", error: error.message });
    }
}
