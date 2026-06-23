require('dotenv').config();
const fs = require('fs');
const path = require('path');

const PROMPTS_DIR = path.join(__dirname, '../../../prompts');

function loadPromptTemplate(platform) {
  const filePath = path.join(PROMPTS_DIR, `${platform}.txt`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Prompt template not found for platform: ${platform}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

function buildPrompt(platform, description) {
  const template = loadPromptTemplate(platform);
  return template.replace('{{DESCRIPTION}}', description);
}

function getAvailablePlatforms() {
  return fs.readdirSync(PROMPTS_DIR)
    .filter(f => f.endsWith('.txt'))
    .map(f => f.replace('.txt', ''));
}

module.exports = { buildPrompt, getAvailablePlatforms, loadPromptTemplate };
