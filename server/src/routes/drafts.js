const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, generateId } = require('../services/storage');

const FILE = 'drafts.json';

router.get('/', (req, res) => {
  const drafts = readJSON(FILE);
  drafts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(drafts);
});

router.post('/', (req, res) => {
  const { content, platforms, description, images } = req.body;

  if (!content || !platforms) {
    return res.status(400).json({ error: 'content and platforms are required' });
  }

  const drafts = readJSON(FILE);
  const draft = {
    id: generateId(),
    content,
    platforms,
    description: description || '',
    images: images || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  drafts.push(draft);
  writeJSON(FILE, drafts);
  res.status(201).json(draft);
});

router.put('/:id', (req, res) => {
  const drafts = readJSON(FILE);
  const idx = drafts.findIndex((d) => d.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Draft not found' });
  }

  const { content, platforms, description } = req.body;
  if (content !== undefined) drafts[idx].content = content;
  if (platforms !== undefined) drafts[idx].platforms = platforms;
  if (description !== undefined) drafts[idx].description = description;
  drafts[idx].updatedAt = new Date().toISOString();

  writeJSON(FILE, drafts);
  res.json(drafts[idx]);
});

router.delete('/:id', (req, res) => {
  const drafts = readJSON(FILE);
  const idx = drafts.findIndex((d) => d.id === req.params.id);

  if (idx === -1) {
    return res.status(404).json({ error: 'Draft not found' });
  }

  drafts.splice(idx, 1);
  writeJSON(FILE, drafts);
  res.json({ success: true });
});

module.exports = router;
