const Coupon = require('../models/Coupon');
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { logger } = require('../utils/logger');

router.post('/create-coupon', async (req, res) => {
    const { code, discountPercentage, expiryDate } = req.body;

    // Check for duplicate coupons
    const existingCoupon = await Coupon.findOne({ code });
    if (existingCoupon) {
        return res.status(400).json({ message: 'Coupon with this code already exists' });
    }

    // Create a new coupon
    try {
        const newCoupon = new Coupon({
            code,
            discountPercentage,
            expiryDate,
        });

        logger.info(newCoupon);

        await newCoupon.save();
        res.status(201).json({ message: 'Coupon created successfully', coupon: newCoupon });
    } catch (error) {
        res.status(500).json({ message: 'Error creating coupon', error });
    }
});

// Route to Get All Coupons
router.get('/get-coupons', async (req, res) => {
    try {
        const coupons = await Coupon.find();
        res.json({ coupons });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching coupons', error });
    }
});

router.post("/validate", async (req, res) => {
    const { code } = req.body;

    try {
        // Check if the coupon exists
        const coupon = await Coupon.findOne({ code });

        if (!coupon) {
            return res.status(500).json({ valid: false });
        }

        // Check if the coupon has expired
        const today = new Date();
        if (coupon.expiryDate < today) {
            return res.status(400).json({ valid: false });
        }

        // Coupon is valid
        return res.status(200).json({
            valid: true,
            discountPercentage: coupon.discountPercentage,
        });
    } catch (error) {
        logger.error(error);
        return res.status(500).json({ valid: false, error: "Internal server error." });
    }
});
module.exports = router;