const fs = require('fs');
const path = require('path');

const PROMPTS_DIR = path.join(__dirname, '../../../prompts');

function loadPromptTemplate() {
  const filePath = path.join(PROMPTS_DIR, 'master.txt');
  if (!fs.existsSync(filePath)) {
    throw new Error('Master prompt template not found');
  }
  return fs.readFileSync(filePath, 'utf8');
}

function buildPrompt(description, platforms) {
  const template = loadPromptTemplate();
  const platformList = Array.isArray(platforms) ? platforms.join(', ') : platforms;
  return template
    .replace('{{DESCRIPTION}}', description)
    .replace('{{PLATFORMS}}', platformList);
}

module.exports = { buildPrompt };
