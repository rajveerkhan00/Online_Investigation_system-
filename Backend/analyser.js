const ort = require('onnxruntime-node');
const fs = require('fs');
const { default: Jimp } = require('jimp'); // Fixed import
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const os = require('os');
const ffmpegPath = require('ffmpeg-static');
const ffprobePath = require('ffprobe-static').path;

// Set FFmpeg paths
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath);

const emotions = [
  'neutral', 'happiness', 'surprise', 'sadness',
  'anger', 'disgust', 'fear', 'contempt'
];

async function runEmotionModel(imagePath) {
  try {
    console.log(`Processing image: ${imagePath}`);
    
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File not found: ${imagePath}`);
    }

    const image = await Jimp.read(imagePath);
    image.resize(64, 64).grayscale();

    const pixels = [];
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      pixels.push(this.bitmap.data[idx] / 255);
    });

    const modelPath = path.join(__dirname, 'model.onnx');
    if (!fs.existsSync(modelPath)) {
      throw new Error(`Model file not found at: ${modelPath}`);
    }

    const session = await ort.InferenceSession.create(modelPath);
    const inputTensor = new ort.Tensor('float32', Float32Array.from(pixels), [1, 1, 64, 64]);

    const results = await session.run({ Input3: inputTensor });
    const outputKey = session.outputNames[0];
    const scores = results[outputKey].data;

    const mapped = emotions.map((emotion, i) => ({
      emotion,
      confidence: +(scores[i] * 100).toFixed(2)
    }));

    mapped.sort((a, b) => b.confidence - a.confidence);
    return mapped;

  } catch (err) {
    console.error('Error in emotion analysis:', err);
    return [{ emotion: "Error", confidence: 0 }];
  }
}

async function extractFrames(videoPath, maxFrames = 5) {
  const framesDir = path.join(os.tmpdir(), `frames_${Date.now()}`);
  
  try {
    if (!fs.existsSync(framesDir)) {
      fs.mkdirSync(framesDir, { recursive: true });
    }

    console.log(`Extracting frames from: ${videoPath}`);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .on('start', (cmd) => console.log('FFmpeg command:', cmd))
        .on('error', (err) => {
          console.error('FFmpeg error:', err);
          reject(new Error(`Video processing failed: ${err.message}`));
        })
        .on('end', () => {
          try {
            const frames = fs.readdirSync(framesDir)
              .filter(f => f.endsWith('.jpg'))
              .map(f => path.join(framesDir, f));

            console.log(`Extracted ${frames.length} frames`);
            resolve(frames.slice(0, maxFrames));
          } catch (e) {
            reject(new Error(`Frame processing failed: ${e.message}`));
          }
        })
        .screenshots({
          count: maxFrames,
          filename: 'frame-%i.jpg',
          folder: framesDir,
          size: '320x240'
        });
    });
  } catch (err) {
    console.error('Frame extraction failed:', err);
    throw err;
  }
}

async function analyzeImagesOrVideo(filePath) {
  try {
    console.log(`Starting analysis for: ${filePath}`);

    const isVideo = /\.(mp4|mov|webm|avi)$/i.test(filePath);
    const imagePaths = isVideo ? await extractFrames(filePath) : [filePath];

    if (!imagePaths || imagePaths.length === 0) {
      throw new Error('No frames/images available for analysis');
    }

    const results = [];
    for (const imgPath of imagePaths) {
      try {
        const prediction = await runEmotionModel(imgPath);
        results.push({
          file: path.basename(imgPath),
          prediction: prediction
        });
      } catch (err) {
        console.error(`Analysis failed for ${imgPath}:`, err);
        results.push({
          file: path.basename(imgPath),
          prediction: [{ emotion: "Analysis Error", confidence: 0 }]
        });
      } finally {
        try {
          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
          }
        } catch (e) {
          console.warn(`Could not delete ${imgPath}:`, e.message);
        }
      }
    }

    return results;

  } catch (err) {
    console.error('Analysis failed:', err);
    return [{
      file: path.basename(filePath),
      prediction: [{ emotion: "Processing Error", confidence: 0 }]
    }];
  }
}

module.exports = { analyzeImagesOrVideo };