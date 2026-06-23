const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';

async function generatePost(description, platforms, imageBase64 = null) {
  const results = {};

  for (const platform of platforms) {
    let prompt = buildPrompt(description, platform, imageBase64);

    let model = 'llama3.2:1b';
    let usedVision = false;

    if (imageBase64) {
      try {
        const visionResult = await callOllama('llama3.2-vision', prompt, imageBase64);
        results[platform] = visionResult;
        usedVision = true;
      } catch (err) {
        console.warn(`Vision model failed, falling back to text: ${err.message}`);
      }
    }

    if (!usedVision) {
      results[platform] = await callOllama('llama3.2:1b', prompt);
    }
  }

  return results;
}

async function callOllama(model, prompt, imageBase64 = null) {
  const body = {
    model,
    prompt,
    stream: false,
  };

  if (imageBase64) {
    body.images = [imageBase64];
  }

  const response = await fetch(`${OLLAMA_BASE}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || `Ollama error: ${response.status}`);
  }

  return data.response;
}

function buildPrompt(description, platform, hasImage = false) {
  const imageContext = hasImage
    ? '\nNote: An image was provided with this description. Incorporate visual details from the description into the post.'
    : '';

  const prompts = {
    linkedin: `Write a professional LinkedIn post based on the following description. Use a professional tone, include relevant hashtags, and make it engaging for a professional audience. Keep it between 150-300 words.${imageContext}\n\nDescription: ${description}`,
    instagram: `Write an Instagram post based on the following description. Use an engaging, visual tone with emojis. Include 5-10 relevant hashtags. Keep it concise (under 200 words).${imageContext}\n\nDescription: ${description}`,
    facebook: `Write a Facebook post based on the following description. Use a conversational, friendly tone. Encourage engagement. Keep it between 100-250 words.${imageContext}\n\nDescription: ${description}`,
  };

  return prompts[platform] || prompts.facebook;
}

module.exports = { generatePost };
