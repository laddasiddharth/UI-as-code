# UI-as-Code Platform

A full-stack UI generation platform that turns prompts into production-ready React components. It ships with a live preview/editor, export tooling, context-aware iterations, and guardrails to keep model output safe and executable.

## Features

- Live React preview and code editor powered by Sandpack
- Context-aware iteration (updates build on the current component)
- Auto-healing generation on runtime errors
- Safe response sanitization to extract code from model output
- Export generated components as a project bundle
- Supabase authentication option for the app shell

## Tech Stack

- Frontend: React 19, Vite, Tailwind CSS, Sandpack
- Backend: Node.js, Express, OpenRouter SDK

## Project Structure

- backend/ - API server for model calls
- frontend/ - Vite React client
- implementation_plan.md - original implementation notes

## Setup

### 1) Backend

Create a .env file in backend/ with:

OPENROUTER_API_KEY=your_key_here

Install and run:

npm install
npm run dev

This starts the API on http://localhost:3001.

### 2) Frontend

Optional .env in frontend/:

VITE_API_URL=http://localhost:3001

Install and run:

npm install
npm run dev

This starts the app on http://localhost:5173.

## Usage

1. Open the Generator page.
2. Enter a prompt and generate a UI.
3. Use the floating prompt bar to refine the UI.
4. Switch between Preview and Code tabs to inspect output.
5. Export the generated component when ready.

## Environment Variables

Backend:
- OPENROUTER_API_KEY: OpenRouter API key used for model calls.

Frontend:
- VITE_API_URL: Base URL for the backend API (defaults to http://localhost:3001).

## Scripts

Backend (backend/):
- npm run dev - Start API with nodemon
- npm run start - Start API

Frontend (frontend/):
- npm run dev - Start Vite dev server
- npm run build - Production build
- npm run preview - Preview build
- npm run lint - Lint the codebase

## Notes

- The live preview sanitizes model responses and wraps them in a full-height container.
- Iteration prompts send the current component to the model for edits instead of diffs.

## License

MIT
