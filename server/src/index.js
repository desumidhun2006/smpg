require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const generateRoutes = require('./routes/generate');
const draftsRoutes = require('./routes/drafts');
const postRoutes = require('./routes/post');
const linkedinRoutes = require('./routes/linkedin');
const instagramRoutes = require('./routes/instagram');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/generate', generateRoutes);
app.use('/api/drafts', draftsRoutes);
app.use('/api/post', postRoutes);
app.use('/api/history', postRoutes);
app.use('/api/linkedin', linkedinRoutes);
app.use('/api/instagram', instagramRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`SMPG server running on http://localhost:${PORT}`);
});
