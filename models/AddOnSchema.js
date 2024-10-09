const mongoose = require('mongoose');

const AddOnSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }
});

const AddOn = mongoose.model('AddOn', AddOnSchema);

module.exports = AddOn;