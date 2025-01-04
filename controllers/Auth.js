const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
require("dotenv").config();

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
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
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
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Something went wrong, please try again",
    });
  }
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password, mobileNumber } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const lastUser = await User.findOne().sort({ createdAt: -1 });

    let nextNumber = 1;
    if (lastUser && lastUser.customerId) {
      const lastNumber = parseInt(lastUser.customerId.slice(4));
      nextNumber = lastNumber + 1;
    }

    const paddedNumber = nextNumber.toString().padStart(6, "0");
    const customerId = `CUST${paddedNumber}`;

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      mobileNumber: mobileNumber,
      role: "User",
      customerId,
    });
    await user.save();

    res.status(201).json({
      success: true,
      message: "User created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "User cannot be registered, please try again",
    });
  }
};

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
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
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
    console.error(error);
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

  const user = await User.findById(id).populate("orders")
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
}

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
