const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../services/storage');

const HISTORY_FILE = 'history.json';

router.post('/', (req, res) => {
  const { content, platforms, description } = req.body;

  if (!content || !platforms) {
    return res.status(400).json({ error: 'content and platforms are required' });
  }

  const history = readJSON(HISTORY_FILE);
  const entry = {
    id: generateId(),
    content,
    platforms,
    description: description || '',
    status: 'posted',
    postedAt: new Date().toISOString(),
  };

  history.push(entry);
  writeJSON(HISTORY_FILE, history);
  res.status(201).json(entry);
});

router.get('/', (req, res) => {
  const history = readJSON(HISTORY_FILE);
  history.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
  res.json(history);
});

module.exports = router;
