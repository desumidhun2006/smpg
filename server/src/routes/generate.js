const express = require('express');
const router = express.Router();
const multer = require('multer');
const { generatePost } = require('../utils/prompts');
const ollamaService = require('../services/ollama');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const { description, platforms } = req.body;

    if (!description || !platforms) {
      return res.status(400).json({ error: 'description and platforms are required' });
    }

    const platformList = JSON.parse(platforms);
    let imageBase64 = null;

    if (req.files && req.files.length > 0) {
      imageBase64 = req.files[0].buffer.toString('base64');
    }

    const results = await ollamaService.generatePost(description, platformList, imageBase64);
    res.json({ posts: results });
  } catch (err) {
    console.error('Generate error:', err.message);
    res.status(500).json({ error: 'Failed to generate post: ' + err.message });
  }
});

module.exports = router;
