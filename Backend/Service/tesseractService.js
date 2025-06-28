const Tesseract = require('tesseract.js');
const fs = require('fs-extra');

const extractTextFromImage = async (imagePath) => {
  try {
    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      'eng',
      { 
        logger: m => console.log(m),
        tessedit_char_whitelist: '0123456789-ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz/ '
      }
    );
    await fs.remove(imagePath); // Clean up the uploaded file
    return text;
  } catch (error) {
    console.error('Error during OCR:', error);
    await fs.remove(imagePath); // Clean up even if error occurs
    throw error;
  }
};

const verifyPakistaniID = (text) => {
  // Enhanced patterns for Pakistani ID card (CNIC)
  const cnicPattern = /(\b\d{5}-\d{7}-\d\b)|(\b\d{13}\b)|(identity card)|(pakistan)|(cnic|nicop)/i;
  const namePattern = /(name|nama|nam|father|f\/name|father's name|mother|m\/name|mother's name)/i;
  const dobPattern = /(dob|date of birth|birth|year|yyyy|dd\.mm\.yyyy)/i;
  
  const hasCNIC = cnicPattern.test(text);
  const hasName = namePattern.test(text);
  const hasDOB = dobPattern.test(text);
  
  return {
    isVerified: hasCNIC && (hasName || hasDOB),
    details: {
      hasCNIC,
      hasName,
      hasDOB,
      rawText: text
    }
  };
};

module.exports = {
  extractTextFromImage,
  verifyPakistaniID
};