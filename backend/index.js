import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { generateComponentCode } from './openrouter.js';
import { BAAS_TEMPLATES } from './prompts.js';

dotenv.config();
if (!process.env.OPENROUTER_API_KEY) {
  console.error('Error: OPENROUTER_API_KEY is not set in .env. Exiting.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost:5173',
}));
app.use(express.json({ limit: '512kb' }));

const generateLimiter = rateLimit({ windowMs: 60_000, max: 10 });

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'UI-as-Code API is running.' });
});

app.post('/api/generate', generateLimiter, async (req, res) => {
  const { prompt, history, baasTemplate, existingCode } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const templateSuffix = baasTemplate && BAAS_TEMPLATES[baasTemplate] ? BAAS_TEMPLATES[baasTemplate] : '';
  const fullPrompt = templateSuffix ? `${prompt}\n\n${templateSuffix}` : prompt;

  try {
    const code = await generateComponentCode(fullPrompt, history || [], existingCode || '');
    res.status(200).json({ code });
  } catch (error) {
    console.error('Generation Endpoint Error:', error);
    res.status(500).json({ error: error?.message || 'Failed to generate code from prompt.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
