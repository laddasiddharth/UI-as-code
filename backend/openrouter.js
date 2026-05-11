import OpenAI from 'openai';
import { SYSTEM_PROMPT, getIterationPrompt } from './prompts.js';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
  console.error('ERROR: OPENROUTER_API_KEY is not set in backend/.env');
  process.exit(1);
}

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    "HTTP-Referer": "http://localhost:3001",
    "X-Title": "UI-as-Code Platform",
  }
});

const DEFAULT_MODEL = "openrouter/auto";
const FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL;

function extractCode(aiResponse) {
  if (!aiResponse || typeof aiResponse !== 'string') return '';

  // 1. Try to find content inside triple backticks
  const codeBlockRegex = /```(?:jsx|javascript|js|tsx)?\n([\s\S]*?)```/i;
  const match = aiResponse.match(codeBlockRegex);
  if (match && match[1]) {
    return match[1].trim();
  }

  // 2. No backticks? Look for the core React pattern (import + export default)
  // Prefer index-based slicing to avoid greedy regex capture issues.
  const exportIndex = aiResponse.indexOf('export default');
  if (exportIndex !== -1) {
    const importIndex = aiResponse.indexOf('import ');
    const startIndex = importIndex !== -1 && importIndex < exportIndex
      ? importIndex
      : exportIndex;
    return aiResponse.slice(startIndex).trim();
  }

  // 3. Fallback: Clean up common AI pre-ambles and return the rest
  // We remove anything before the first 'import' or 'function' if they exist
  let cleaned = aiResponse.trim();
  const firstImport = cleaned.indexOf('import');
  if (firstImport !== -1) {
    cleaned = cleaned.substring(firstImport);
  } else {
    const firstExport = cleaned.indexOf('export');
    if (firstExport !== -1) {
      cleaned = cleaned.substring(firstExport);
    }
  }

  return cleaned;
}

function hasDefaultExport(code) {
  return /\bexport\s+default\b/.test(code);
}

function ensureDefaultExport(code) {
  if (!code) return '';
  if (hasDefaultExport(code)) return code;

  const functionMatch = code.match(/\bfunction\s+([A-Z][A-Za-z0-9_]*)\s*\(/);
  const constMatch = code.match(/\bconst\s+([A-Z][A-Za-z0-9_]*)\s*=\s*(\(|function\s*\(|\(.*?\)\s*=>)/);
  const letMatch = code.match(/\blet\s+([A-Z][A-Za-z0-9_]*)\s*=\s*(\(|function\s*\(|\(.*?\)\s*=>)/);
  const varMatch = code.match(/\bvar\s+([A-Z][A-Za-z0-9_]*)\s*=\s*(\(|function\s*\(|\(.*?\)\s*=>)/);

  const match = functionMatch || constMatch || letMatch || varMatch;
  if (!match) return '';

  return `${code.trim()}\n\nexport default ${match[1]};`;
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
      FALLBACK_MODEL,
      DEFAULT_MODEL,
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
        const extracted = extractCode(raw);
        if (!extracted) {
          throw new Error('No valid code could be extracted from the model response.');
        }
        const normalized = ensureDefaultExport(extracted);
        if (!normalized) {
          throw new Error('Generated code is missing an export default and could not be normalized.');
        }
        return normalized;
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
    throw new Error(error?.message || "Failed to generate UI code.");
  }
};
