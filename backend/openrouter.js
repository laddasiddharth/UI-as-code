import OpenAI from 'openai';
import { SYSTEM_PROMPT } from './prompts.js';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3001", // Optional, for including your app on openrouter.ai rankings.
    "X-Title": "UI-as-Code Platform", // Optional. Shows in rankings on openrouter.ai.
  }
});

export const generateComponentCode = async (userPrompt, history = []) => {
  try {
    const messages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: userPrompt }
    ];

    const completion = await openai.chat.completions.create({
      // Using a free model as requested by the user
      model: "google/gemini-2.0-flash-exp:free",
      messages: messages,
      temperature: 0.2, // Lower temperature for more deterministic code generation
    });

    let code = completion.choices[0].message.content;
    
    // Clean up any potential markdown formatting the model might still include despite instructions
    if (code.startsWith('\`\`\`')) {
      const lines = code.split('\\n');
      code = lines.slice(1, -1).join('\\n');
    }

    return code;
  } catch (error) {
    console.error("Error generating code with OpenRouter:", error);
    throw new Error("Failed to generate UI code.");
  }
};
