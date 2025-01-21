const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logger } = require('../utils/logger');
const { ADMIN } = require("../utils/enum");
require('dotenv').config();


const authenticate = async (req, res, next) => {
  try {
    const token = req.headers["authorization"]?.split(" ")[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

        const user = await User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        next();
    } catch (error) {
        logger.error("Invalid Token",error);
        res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

const authorizeAdmin = (req, res, next) => {
  if (req.user.role !== ADMIN) {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  next();
};

module.exports = { authenticate, authorizeAdmin };
