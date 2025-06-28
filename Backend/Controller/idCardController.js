const { extractTextFromImage, verifyPakistaniID } = require('../Service/tesseractService');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../uploads');
fs.ensureDirSync(uploadDir);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG and PNG images are allowed'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('idCardImage');

const verifyIDCard = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false,
        error: err.message 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        error: 'No image file provided' 
      });
    }

    try {
      const imagePath = req.file.path;
      const extractedText = await extractTextFromImage(imagePath);
      const verificationResult = verifyPakistaniID(extractedText);

      if (!verificationResult.isVerified) {
        return res.status(200).json({
          success: true,
          verified: false,
          message: 'Image unclear or not a Pakistani ID card. Please upload a proper ID card picture.',
          details: verificationResult.details
        });
      }

      res.json({
        success: true,
        verified: true,
        message: 'Pakistani ID card verified successfully',
        details: verificationResult.details
      });
    } catch (error) {
      console.error('Error in verification:', error);
      res.status(500).json({ 
        success: false,
        error: 'Failed to process ID card' 
      });
    }
  });
};

module.exports = {
  verifyIDCard
};