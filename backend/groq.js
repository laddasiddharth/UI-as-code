import OpenAI from 'openai';
import { SYSTEM_PROMPT, getIterationPrompt } from './prompts.js';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
  console.error('ERROR: GROQ_API_KEY is not set in backend/.env');
  process.exit(1);
}

const groq = new OpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL || "llama-3.1-8b-instant";

function extractCode(aiResponse) {
  if (!aiResponse || typeof aiResponse !== 'string') return '';

  // 1. Try to find content inside triple backticks
  const codeBlockRegex = /```(?:jsx|javascript|js|tsx)?\n([\s\S]*?)```/i;
  const match = aiResponse.match(codeBlockRegex);
  if (match && match[1]) {
    return match[1].trim();
  }

  // 2. No backticks? Look for the core React pattern (import + export default)
  const exportIndex = aiResponse.indexOf('export default');
  if (exportIndex !== -1) {
    const importIndex = aiResponse.indexOf('import ');
    const startIndex = importIndex !== -1 && importIndex < exportIndex
      ? importIndex
      : exportIndex;
    return aiResponse.slice(startIndex).trim();
  }

  // 3. Fallback: Clean up common AI pre-ambles and return the rest
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

  // Match all PascalCase function/const definitions
  const matches = [...code.matchAll(/\b(?:function|const|let|var)\s+([A-Z][A-Za-z0-9_]*)\s*(?:=|\()/g)];
  
  if (matches.length > 0) {
    // Grab the very LAST component defined (usually the root component)
    const lastMatch = matches[matches.length - 1][1];
    return `${code.trim()}\n\nexport default ${lastMatch};`;
  }

  return code;
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
      process.env.GROQ_MODEL,
      FALLBACK_MODEL,
      DEFAULT_MODEL,
    ].filter(Boolean);

    let lastError = null;
    for (const model of modelCandidates) {
      try {
        const completion = await groq.chat.completions.create({
          model,
          messages: messages,
          temperature: 0.2,
        }, {
          signal: AbortSignal.timeout(28000),
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
        // Groq specific error handling if needed, otherwise fallback
        console.warn(`Model ${model} failed, trying fallback...`, err.message);
        lastError = err;
      }
    }

    throw lastError || new Error("No available Groq model endpoints found.");
  } catch (error) {
    console.error("Error generating code with Groq:", error);
    throw new Error(error?.message || "Failed to generate UI code.");
  }
};
