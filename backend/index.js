import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateComponentCode } from './openrouter.js';
import { BAAS_TEMPLATES } from './prompts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'UI-as-Code API is running.' });
});

app.post('/api/generate', async (req, res) => {
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
    res.status(500).json({ error: 'Failed to generate code from prompt.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
