const axios = require('axios');
const fs = require('fs');
const path = require('path');
const logger = require('pino');  // Make sure to replace this with your actual logger
const cloudinary = require("cloudinary").v2;

// Updated download function
exports.download = async (req, res) => {
        // const url = req.query.url;
        
        // if (!url) {
        //   return res.status(400).json({ error: 'PDF URL is required' });
        // }
      
        // try {
        //   // Download the PDF
        //   const response = await axios({
        //     method: 'GET',
        //     url: url,
        //     responseType: 'arraybuffer'
        //   });
      
        //   // Save the PDF to a file
        //   const buffer = Buffer.from(response.data);
        //   await fs.writeFile('downloaded.pdf', buffer);
      
        //   res.download('downloaded.pdf');
        // } catch (error) {
        //   console.error('Error downloading PDF:', error);
        //   res.status(500).json({ error: 'Failed to download PDF' });
        // }
}
    