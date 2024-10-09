

const Product = require('../models/Product');
const User = require('../models/User');


exports.addReview = async (req, res) => {
    try {
        const { productId, reviewText, rating } = req.body;
        const userId = req.user.id;

       
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
        }

       
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        
        product.reviews.push({ user: userId, reviewText, rating });
        await product.save();

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to add review' });
    }
};


exports.getReviews = async (req, res) => {
    try {
        const { productId } = req.params;

       
        const product = await Product.findById(productId).populate('reviews.user');
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        res.status(200).json({ success: true, data: product.reviews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Failed to get reviews' });
    }
};
