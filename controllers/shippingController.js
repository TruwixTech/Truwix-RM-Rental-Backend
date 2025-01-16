const axios = require("axios");

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
    console.log(error);
    return res.status(500).json({ error: "An error occurred while fetching distance." });
  }
};

