const OpenAI = require('openai');
const { buildPrompt } = require('./prompts');

const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';

const nvidia = NVIDIA_API_KEY && NVIDIA_API_KEY !== 'your-key-here'
  ? new OpenAI({
      apiKey: NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    })
  : null;

const NVIDIA_VISION_MODEL = 'meta/llama-3.2-90b-vision-instruct';

async function generatePost(description, platforms, imageBase64 = null) {
  if (platforms.length > 1) {
    const prompt = buildPrompt(platforms, description);
    console.log(`[NVIDIA] Generating universal post for: ${platforms.join(', ')} (image: ${!!imageBase64})`);

    if (nvidia) {
      try {
        const content = await generateWithNvidia(prompt, imageBase64);
        const result = {};
        for (const p of platforms) result[p] = content;
        return result;
      } catch (err) {
        console.error(`[NVIDIA] Failed: ${err.message}`);
        throw new Error(`NVIDIA generation failed: ${err.message}`);
      }
    }

    const content = await generateWithOllama(prompt);
    const result = {};
    for (const p of platforms) result[p] = content;
    return result;
  }

  const prompt = buildPrompt(platforms, description);
  console.log(`[NVIDIA] Generating for ${platforms[0]} (image: ${!!imageBase64})`);

  if (nvidia) {
    try {
      const content = await generateWithNvidia(prompt, imageBase64);
      return { [platforms[0]]: content };
    } catch (err) {
      console.error(`[NVIDIA] Failed: ${err.message}`);
      throw new Error(`NVIDIA generation failed: ${err.message}`);
    }
  }

  const content = await generateWithOllama(prompt);
  return { [platforms[0]]: content };
}

async function generateWithNvidia(prompt, imageBase64 = null) {
  let userContent;

  if (imageBase64) {
    userContent = [
      { type: 'text', text: prompt },
      {
        type: 'image_url',
        image_url: {
          url: `data:image/jpeg;base64,${imageBase64}`,
        },
      },
    ];
  } else {
    userContent = prompt;
  }

  const response = await nvidia.chat.completions.create({
    model: NVIDIA_VISION_MODEL,
    messages: [{ role: 'user', content: userContent }],
    max_tokens: 1024,
    temperature: 0.7,
  });

  if (!response.choices || !response.choices[0]) {
    throw new Error('No response from NVIDIA API');
  }

  console.log(`[NVIDIA] Response model: ${response.model}`);
  return response.choices[0].message.content;
}

async function generateWithOllama(prompt) {
  const body = {
    model: 'llama3.2:1b',
    prompt,
    stream: false,
  };

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

module.exports = { generatePost };
