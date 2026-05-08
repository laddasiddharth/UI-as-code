import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Generates a complete Vite + React + Tailwind v4 project zip
 * from a generated component code string and triggers a download.
 */
export async function exportAsViteProject(code, projectName = 'ui-as-code-export') {
  const zip = new JSZip();
  const src = zip.folder('src');

  // ── package.json ──────────────────────────────────────────────────────────
  zip.file('package.json', JSON.stringify({
    name: projectName,
    private: true,
    version: '0.0.1',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
    },
    dependencies: {
      react: '^19.0.0',
      'react-dom': '^19.0.0',
      'lucide-react': 'latest',
    },
    devDependencies: {
      '@vitejs/plugin-react': '^4.3.1',
      vite: '^5.4.0',
      tailwindcss: '^4.0.0',
      '@tailwindcss/vite': '^4.0.0',
    },
  }, null, 2));

  // ── vite.config.js ────────────────────────────────────────────────────────
  zip.file('vite.config.js', `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`);

  // ── index.html ────────────────────────────────────────────────────────────
  zip.file('index.html', `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`);

  // ── src/index.css ─────────────────────────────────────────────────────────
  src.file('index.css', `@import "tailwindcss";
`);

  // ── src/main.jsx ──────────────────────────────────────────────────────────
  src.file('main.jsx', `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`);

  // ── src/App.jsx ── the AI-generated component ─────────────────────────────
  src.file('App.jsx', code);

  // ── README.md ─────────────────────────────────────────────────────────────
  zip.file('README.md', `# ${projectName}

Generated with [UI-as-Code](https://github.com/laddasiddharth/UI-as-code) — Prompt-to-Live-Interface Platform.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Stack
- React 18
- Vite 5
- Tailwind CSS v4
- Lucide React (icons)
`);

  // ── .gitignore ────────────────────────────────────────────────────────────
  zip.file('.gitignore', `node_modules/\ndist/\n.env\n`);

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${projectName}.zip`);
}
