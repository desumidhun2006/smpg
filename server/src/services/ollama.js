const OpenAI = require('openai');
const { buildPrompt } = require('./prompts');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';

const openai = OPENAI_API_KEY && OPENAI_API_KEY !== 'your-key-here'
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

async function generatePost(description, platforms, imageBase64 = null) {
  const results = {};

  for (const platform of platforms) {
    const prompt = buildPrompt(platform, description);

    if (openai) {
      try {
        results[platform] = await generateWithOpenAI(prompt, imageBase64);
        continue;
      } catch (err) {
        console.warn(`OpenAI failed for ${platform}, falling back to Ollama: ${err.message}`);
      }
    }

    results[platform] = await generateWithOllama(prompt, imageBase64);
  }

  return results;
}

async function generateWithOpenAI(prompt, imageBase64 = null) {
  const messages = [
    {
      role: 'system',
      content: 'You are an expert social media content writer. You create engaging, platform-appropriate posts. You always follow the user instructions precisely. You never refuse to write content — your job is to create marketing and social media posts.',
    },
  ];

  if (imageBase64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${imageBase64}`,
            detail: 'high',
          },
        },
      ],
    });
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4.1',
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  });

  return response.choices[0].message.content;
}

async function generateWithOllama(prompt, imageBase64 = null) {
  const body = {
    model: 'llama3.2:1b',
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

module.exports = { generatePost };
