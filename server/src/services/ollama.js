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

const NVIDIA_VISION_MODEL = 'nvidia/llama-3.1-nemotron-nano-vl-8b-v1';

async function generatePost(description, platforms, imageBase64 = null) {
  const prompt = buildPrompt(description, platforms);

  if (nvidia) {
    console.log(`[NVIDIA] Generating for platforms: ${platforms.join(', ')} (image: ${!!imageBase64})`);
    try {
      const result = await generateWithNvidia(prompt, imageBase64);
      return result;
    } catch (err) {
      console.error(`[NVIDIA] Failed: ${err.message}`);
      throw new Error(`NVIDIA generation failed: ${err.message}`);
    }
  }

  return await generateWithOllama(prompt);
}

async function generateWithNvidia(prompt, imageBase64 = null) {
  const messages = [
    {
      role: 'system',
      content: 'You are a social media manager. Write the posts exactly as requested. Output ONLY the posts, no explanations, no meta-commentary, no process descriptions. Start directly with the post content.',
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
    max_tokens: 2048,
    temperature: 0.7,
  });

  if (!response.choices || !response.choices[0]) {
    throw new Error('No response from NVIDIA API');
  }

  console.log(`[NVIDIA] Response model: ${response.model}`);
  const raw = response.choices[0].message.content;
  return parsePosts(raw);
}

function parsePosts(raw) {
  const posts = {};

  const platformHeaders = [
    { name: 'linkedin', pattern: /(?:^|\n)\s*#{1,6}\s*LinkedIn(?:\s+Posts?)?[:\s]*\n/i },
    { name: 'instagram', pattern: /(?:^|\n)\s*#{1,6}\s*Instagram(?:\s+Posts?)?[:\s]*\n/i },
    { name: 'facebook', pattern: /(?:^|\n)\s*#{1,6}\s*Facebook(?:\s+Posts?)?[:\s]*\n/i },
  ];

  const matches = [];
  for (const ph of platformHeaders) {
    const m = raw.match(ph.pattern);
    if (m) matches.push({ name: ph.name, index: m.index + m[0].length });
  }

  matches.sort((a, b) => a.index - b.index);

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : raw.length;
    posts[matches[i].name] = raw.slice(start, end).trim();
  }

  if (Object.keys(posts).length === 0) {
    posts['content'] = raw.trim();
  }

  return posts;
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

  return { content: data.response };
}

module.exports = { generatePost };
