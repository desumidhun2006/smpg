const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';

async function generatePost(description, platforms, imageBase64 = null) {
  const results = {};

  for (const platform of platforms) {
    const prompt = buildPrompt(description, platform);

    const body = {
      model: imageBase64 ? 'llama3.2-vision' : 'llama3.2:1b',
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

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    results[platform] = data.response;
  }

  return results;
}

function buildPrompt(description, platform) {
  const prompts = {
    linkedin: `Write a professional LinkedIn post based on the following description. Use a professional tone, include relevant hashtags, and make it engaging for a professional audience. Keep it between 150-300 words.\n\nDescription: ${description}`,
    instagram: `Write an Instagram post based on the following description. Use an engaging, visual tone with emojis. Include 5-10 relevant hashtags. Keep it concise (under 200 words).\n\nDescription: ${description}`,
    facebook: `Write a Facebook post based on the following description. Use a conversational, friendly tone. Encourage engagement. Keep it between 100-250 words.\n\nDescription: ${description}`,
  };

  return prompts[platform] || prompts.facebook;
}

module.exports = { generatePost, buildPrompt };
