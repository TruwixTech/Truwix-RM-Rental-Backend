const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('pino');  // Make sure to replace this with your actual logger

exports.download = async (req, res) => {
    const { id } = req.params; // Ensure that you're passing an actual ObjectId

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid product ID',
        });
    }

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        res.status(200).json({
            success: true,
            product,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error retrieving product',
            error: error.message,
        });
    }
};