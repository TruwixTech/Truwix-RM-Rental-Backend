const axios = require("axios");
const { logger } = require('../utils/logger');

exports.getDistance = async (req, res) => {
  try {
    const origins = req.body.origins;
    const destinations = req.body.destinations;

    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/distancematrix/json",
      {
        params: {
          origins,
          destinations,
          key: process.env.GMAP_ID,
          mode: "driving", // Add mode parameter
          units: "metric", // Add units parameter
        },
      }
    );
    
    const address =  response.data.origin_addresses[0];

    // Extract the distance value
    const distanceValue = response.data.rows[0].elements[0].distance.value;

    // Return the distance value in the response
    return res.status(200).json({ distance: distanceValue / 1000, address: address });
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: "An error occurred while fetching distance." });
  }
};

// API to get distance using pincode
exports.getDistanceByPincode = async (req, res) => {
  try {
    const { pincode, destinations } = req.body;

    if (!pincode || !destinations) {
      return res.status(400).json({ error: "Pincode and destinations are required." });
    }

    // Step 1: Convert Pincode to Location
    const geocodeResponse = await axios.get("https://maps.googleapis.com/maps/api/geocode/json", {
      params: {
        address: pincode,
        key: process.env.GMAP_ID,
      },
    });

    // Check if valid response
    if (geocodeResponse.data.status !== "OK") {
      return res.status(400).json({ error: "Invalid pincode or no location found." });
    }

    // Extract formatted address & location
    const location = geocodeResponse.data.results[0].formatted_address;
    const { lat, lng } = geocodeResponse.data.results[0].geometry.location;
    const origin = `${lat},${lng}`;

    // Step 2: Get Distance
    const distanceResponse = await axios.get("https://maps.googleapis.com/maps/api/distancematrix/json", {
      params: {
        origins: origin,
        destinations,
        key: process.env.GMAP_ID,
        mode: "driving",
        units: "metric",
      },
    });

    // Check distance API response
    const distanceData = distanceResponse.data;
    if (distanceData.status !== "OK" || distanceData.rows[0].elements[0].status !== "OK") {
      return res.status(400).json({ error: "Failed to get distance information." });
    }

    // Extract distance and address
    const distanceValue = distanceData.rows[0].elements[0].distance.value; // In meters
    const distanceKm = distanceValue / 1000; // Convert to kilometers
    const address = distanceData.origin_addresses[0];

    // Step 3: Send Response
    return res.status(200).json({
      distance: distanceKm,
      address: address || location,
    });

  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: "An error occurred while fetching distance." });
  }
};