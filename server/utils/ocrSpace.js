const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

async function extractTextWithOCR(filePath) {
  const formData = new FormData();
  // Read file as stream (compatible with both disk and memory)
  formData.append('file', fs.createReadStream(filePath));
  formData.append('apikey', process.env.OCR_API_KEY || 'helloworld');
  formData.append('language', 'eng');
  formData.append('isOverlayRequired', 'false');
  formData.append('filetype', 'PDF');

  try {
    const response = await axios.post('https://api.ocr.space/parse/image', formData, {
      headers: { ...formData.getHeaders() },
      timeout: 30000, // 30 seconds
    });
    if (response.data.IsErroredOnProcessing) {
      throw new Error(response.data.ErrorMessage?.[0] || 'OCR failed');
    }
    const text = response.data.ParsedResults?.[0]?.ParsedText || '';
    if (!text || text.trim().length < 50) {
      throw new Error('Extracted text too short');
    }
    return text;
  } catch (error) {
    console.error('OCR.space error:', error.message);
    throw new Error('OCR extraction failed: ' + error.message);
  }
}

module.exports = { extractTextWithOCR };