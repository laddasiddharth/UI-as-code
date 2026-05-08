import OpenAI from 'openai';
import { SYSTEM_PROMPT, getIterationPrompt } from './prompts.js';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "placeholder_key",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3001",
    "X-Title": "UI-as-Code Platform",
  }
});

function extractCode(aiResponse) {
  if (!aiResponse || typeof aiResponse !== 'string') return '';

  const codeBlockRegex = /```(?:jsx|javascript|js|tsx)?\n([\s\S]*?)```/i;
  const match = aiResponse.match(codeBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  const importMatch = aiResponse.match(/import[\s\S]*export default[\s\S]*\}/);
  if (importMatch) {
    return importMatch[0].trim();
  }

  return aiResponse.replace(/^(Sure|Here is|Certainly|Okay|Alright|As an AI)[^\n]*\n/i, '').trim();
}

export const generateComponentCode = async (userPrompt, history = [], existingCode = '') => {
  try {
    const finalPrompt = getIterationPrompt(userPrompt, existingCode);
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: finalPrompt }
    ];

    const modelCandidates = [
      process.env.OPENROUTER_MODEL,
      "meta-llama/llama-3.3-8b-instruct:free",
      "openrouter/auto:free",
      "openrouter/auto"
    ].filter(Boolean);

    let lastError = null;
    for (const model of modelCandidates) {
      try {
        const completion = await openai.chat.completions.create({
          model,
          messages: messages,
          temperature: 0.2,
        });
        const raw = completion.choices[0].message.content;
        return extractCode(raw);
      } catch (err) {
        const shouldFallback =
          err?.status === 404 ||
          String(err?.message || '').includes('No endpoints found');
        if (!shouldFallback) {
          throw err;
        }
        lastError = err;
      }
    }

    throw lastError || new Error("No available OpenRouter model endpoints found.");
  } catch (error) {
    console.error("Error generating code with OpenRouter:", error);
    throw new Error("Failed to generate UI code.");
  }
};
