const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

exports.download = async (req, res) => {
    try {
        const { url } = req.body; // Assuming the URL is sent in the request body

        if (!url) {
            throw new Error('URL is required');
        }

        // Download the file
        const response = await axios.get(url, { responseType: 'stream' });
        const fileStream = response.data;

        // Get the filename from the URL (you might want to implement this logic)
        let fileName = path.basename(url);

        // Save the file
        const filePath = path.join(__dirname, '..', 'downloads', fileName);
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, fileStream);

        res.status(200).json({
            success: true,
            message: `File downloaded successfully: ${fileName}`,
            downloadUrl: `/download/${fileName}`
        });

    } catch (error) {
        logger.error(error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to download',
            error: error.message
        });
    }
};
