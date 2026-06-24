const { GoogleGenerativeAI } = require('@google/generative-ai');
const OpenAI = require('openai');
const { buildPrompt } = require('./prompts');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
const OLLAMA_BASE = process.env.OLLAMA_URL || 'http://localhost:11434';

const gemini = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;
const nvidia = NVIDIA_API_KEY
  ? new OpenAI({
      apiKey: NVIDIA_API_KEY,
      baseURL: 'https://integrate.api.nvidia.com/v1',
    })
  : null;

const GEMINI_MODEL = 'gemini-2.5-flash';
const NVIDIA_VISION_MODEL = 'meta/llama-3.2-90b-vision-instruct';

async function generatePost(description, platforms, imageBase64 = null) {
  const prompt = buildPrompt(platforms, description);
  const isMulti = platforms.length > 1;
  const label = isMulti ? `universal for: ${platforms.join(', ')}` : platforms[0];
  console.log(`[AI] Generating ${label} (image: ${!!imageBase64})`);

  if (gemini) {
    try {
      const content = await generateWithGemini(prompt, imageBase64);
      console.log(`[Gemini] Success`);
      const result = {};
      for (const p of platforms) result[p] = content;
      return result;
    } catch (err) {
      console.error(`[Gemini] Failed: ${err.message}`);
    }
  }

  if (nvidia && imageBase64) {
    try {
      const content = await generateWithNvidia(prompt, imageBase64);
      console.log(`[NVIDIA] Success (vision fallback)`);
      const result = {};
      for (const p of platforms) result[p] = content;
      return result;
    } catch (err) {
      console.error(`[NVIDIA] Failed: ${err.message}`);
    }
  }

  throw new Error('All AI providers failed');
}

async function generateWithGemini(prompt, imageBase64 = null) {
  const model = gemini.getGenerativeModel({ model: GEMINI_MODEL });

  const parts = [{ text: prompt }];

  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageBase64,
      },
    });
  }

  const result = await model.generateContent(parts);
  const response = result.response;
  return response.text();
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

  return response.choices[0].message.content;
}

module.exports = { generatePost };
