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

function buildPrompt(platforms, description) {
  if (platforms.length > 1) {
    const template = loadPromptTemplate('universal');
    return template
      .replace('{{PLATFORMS}}', platforms.join(', '))
      .replace('{{DESCRIPTION}}', description);
  }

  const template = loadPromptTemplate(platforms[0]);
  return template.replace('{{DESCRIPTION}}', description);
}

module.exports = { buildPrompt };
