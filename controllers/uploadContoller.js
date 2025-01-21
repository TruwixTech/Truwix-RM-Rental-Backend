const uploadImage = (req, res) => {
  if (!req.file) {
    return res.json({ error: "No file uploaded" });
  }
  res
    .status(200)
    .json({ message: "Image uploaded successfully", url: req.file.path });
};

const uploadPDF = (req,res) => {
    if(!req.file)
    {
      return res.status(400)
    }
}

exports.uploadImage = uploadImage;
