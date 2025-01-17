const mongoose = require("mongoose");
const { logger } = require('../utils/logger'); // Import the logger
require("dotenv").config();

exports.connect = () => {
    mongoose.connect(process.env.MONGODB_URL, {
    })
    .then(() => {
        logger.info("DB Connected Successfully"); // Log a success message
    })
    .catch( (error) => {
        logger.error("DB Connection Failed"); // Log an error message
        logger.error(error); // Log the error details
        process.exit(1);
    } )
}