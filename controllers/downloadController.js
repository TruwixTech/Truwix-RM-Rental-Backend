const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('pino');  // Make sure to replace this with your actual logger

exports.getProducts = async (req, res) => {
    try {
        const response = await axios({
            req,
            method: 'GET',
            responseType: 'stream' 
        });

        const writer = fs.createWriteStream(res);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('Error downloading the image:', error);
    }
};