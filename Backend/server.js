require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { analyzeImagesOrVideo } = require('./analyser');
const ffmpeg = require('fluent-ffmpeg');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure FFmpeg paths if not in system PATH
if (process.env.FFMPEG_PATH) {
  ffmpeg.setFfmpegPath(path.join(process.env.FFMPEG_PATH, 'ffmpeg'));
  ffmpeg.setFfprobePath(path.join(process.env.FFMPEG_PATH, 'ffprobe'));
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configure file upload storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    ffmpeg: !!ffmpeg.getAvailableFormats
  });
});

app.post('/analyze', upload.single('media'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        status: 'error',
        message: 'No file uploaded'
      });
    }

    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    console.log(`Processing file: ${filePath}`);

    if (!fs.existsSync(filePath)) {
      return res.status(400).json({
        status: 'error',
        message: 'File upload failed'
      });
    }

    const results = await analyzeImagesOrVideo(filePath)
      .catch(err => {
        console.error('Analysis error:', err);
        return [{
          file: req.file.originalname,
          prediction: [{ emotion: "Processing Error", confidence: 0 }]
        }];
      });

    // Clean up uploaded file
    try {
      fs.unlinkSync(filePath);
    } catch (e) {
      console.warn('File cleanup error:', e.message);
    }

    // Calculate metrics
    const allEmotions = results.flatMap(r => r.prediction);
    const angerAvg = averageConfidence(allEmotions, 'anger');
    const fearAvg = averageConfidence(allEmotions, 'fear');
    const guiltScore = Math.min(((angerAvg + fearAvg) / 2), 100);

    const containsError = results.some(r => 
      r.prediction.some(p => p.emotion === "Processing Error")
    );

    res.json({
      status: containsError ? 'partial_success' : 'success',
      originalFilename: req.file.originalname,
      emotions: results,
      metrics: {
        criminalLikelihood: `${guiltScore.toFixed(2)}%`,
        angerAverage: `${angerAvg.toFixed(2)}%`,
        fearAverage: `${fearAvg.toFixed(2)}%`
      },
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      details: err.message
    });
  }
});

// Helper functions
function averageConfidence(predictions, emotion) {
  const values = predictions
    .filter(p => p.emotion === emotion)
    .map(p => p.confidence);
  return values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
}

// Static files and error handling
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Something broke!'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Upload directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`FFmpeg available: ${!!ffmpeg.getAvailableFormats}`);
});

// Process handlers
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});