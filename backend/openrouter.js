import OpenAI from 'openai';
import { SYSTEM_PROMPT, getIterationPrompt } from './prompts.js';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY || "placeholder_key",
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3001", // Optional, for including your app on openrouter.ai rankings.
    "X-Title": "UI-as-Code Platform", // Optional. Shows in rankings on openrouter.ai.
  }
});

function extractCode(aiResponse) {
  if (!aiResponse || typeof aiResponse !== 'string') return '';

  const codeBlockRegex = /```(?:jsx|javascript|js)?\n([\s\S]*?)```/i;
  const match = aiResponse.match(codeBlockRegex);

  if (match && match[1]) {
    return match[1].trim();
  }

  // Fallback: remove common conversational prefixes if the model skipped code fences
  return aiResponse.replace(/^(Sure|Here is|Certainly|Okay|Alright)[^\n]*\n/i, '').trim();
}

export const generateComponentCode = async (userPrompt, history = [], existingCode = '') => {
  try {
    const finalPrompt = getIterationPrompt(userPrompt, existingCode);
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: finalPrompt }
    ];

    const completion = await openai.chat.completions.create({
      // Using DeepSeek Chat Free - a highly reliable and capable free model
      model: "openrouter/auto:free",
      messages: messages,
      temperature: 0.2, // Lower temperature for more deterministic code generation
    });

    const raw = completion.choices[0].message.content;
    return extractCode(raw);
  } catch (error) {
    console.error("Error generating code with OpenRouter:", error);
    throw new Error("Failed to generate UI code.");
  }
};
