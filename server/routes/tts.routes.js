const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post('/tts', async (req, res) => {
  const { text, voice = 'af_heart', speed = 1.0 } = req.body;

  if (!text || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    const response = await axios.post(
      `${process.env.KOKORO_API_URL}/tts`,
      { text, voice, speed },
      {
        responseType: 'stream',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.HF_TOKEN}`
        },
        timeout: 30000
      }
    );

    res.set('Content-Type', 'audio/wav');
    response.data.pipe(res);
  } catch (error) {
    console.error('TTS error:', error.message);
    // Log more details about the response
    if (error.response) {
      console.error('HF Space response status:', error.response.status);
      console.error('HF Space response headers:', error.response.headers);
      // If the response is text (HTML), log a preview
      if (typeof error.response.data === 'string') {
        console.error('HF Space response data preview:', error.response.data.substring(0, 200));
      }
    }
    res.status(500).json({ error: 'TTS generation failed' });
  }
});

module.exports = router;