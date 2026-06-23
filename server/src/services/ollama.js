const OpenAI = require('openai');
const { buildPrompt } = require('./prompts');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';

const openai = OPENAI_API_KEY && OPENAI_API_KEY !== 'your-key-here'
  ? new OpenAI({ apiKey: OPENAI_API_KEY })
  : null;

const nvidia = NVIDIA_API_KEY && NVIDIA_API_KEY !== 'your-key-here'
  ? new OpenAI({
      apiKey: NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    })
  : null;

const NVIDIA_VISION_MODEL = 'nvidia/llama-3.1-nemotron-nano-vl-8b-v1';

async function generatePost(description, platforms, imageBase64 = null) {
  const results = {};

  for (const platform of platforms) {
    const prompt = buildPrompt(platform, description);

    if (nvidia) {
      try {
        results[platform] = await generateWithNvidia(prompt, imageBase64);
        continue;
      } catch (err) {
        console.error(`NVIDIA failed for ${platform}: ${err.message}`);
        throw new Error(`AI generation failed: ${err.message}`);
      }
    }

    if (openai) {
      try {
        results[platform] = await generateWithOpenAI(prompt, imageBase64);
        continue;
      } catch (err) {
        console.error(`OpenAI failed for ${platform}: ${err.message}`);
        throw new Error(`AI generation failed: ${err.message}`);
      }
    }

    results[platform] = await generateWithOllama(prompt);
  }

  return results;
}

async function generateWithNvidia(prompt, imageBase64 = null) {
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
          },
        },
      ],
    });
  } else {
    messages.push({ role: 'user', content: prompt });
  }

  const response = await nvidia.chat.completions.create({
    model: NVIDIA_VISION_MODEL,
    messages,
    max_tokens: 1024,
    temperature: 0.7,
  });

  if (!response.choices || !response.choices[0]) {
    throw new Error('No response from NVIDIA API');
  }

  return response.choices[0].message.content;
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
