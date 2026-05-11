import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Generates a complete Vite + React + Tailwind v4 project zip
 * from a generated component code string and triggers a download.
 */
export async function exportAsViteProject(code, projectName = 'ui-as-code-export') {
  const zip = new JSZip();
  const src = zip.folder('src');

  const usesRecharts = code.includes('Chart') || code.includes('recharts');
  const needsMocks = ['<Card', '<Button', '<Input', '<Badge'].some(tag => code.includes(tag));

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
      ...(usesRecharts ? { 'recharts': '^2.12.0' } : {}) // Inject Recharts if needed
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

  // ── src/components.jsx (Optional Mocks) ───────────────────────────────────
  if (needsMocks) {
    src.file('components.jsx', `import React from 'react';
export const Card = ({ children, className = '', ...props }) => <div className={\`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden \${className}\`} {...props}>{children}</div>;
export const CardHeader = ({ children, className = '', ...props }) => <div className={\`px-6 py-4 border-b border-gray-100 \${className}\`} {...props}>{children}</div>;
export const CardTitle = ({ children, className = '', ...props }) => <h3 className={\`text-lg font-semibold text-gray-900 \${className}\`} {...props}>{children}</h3>;
export const CardContent = ({ children, className = '', ...props }) => <div className={\`p-6 \${className}\`} {...props}>{children}</div>;
export const CardFooter = ({ children, className = '', ...props }) => <div className={\`px-6 py-4 border-t border-gray-100 bg-gray-50/50 \${className}\`} {...props}>{children}</div>;
export const Button = ({ children, className = '', variant = 'primary', ...props }) => <button className={\`px-4 py-2 rounded-lg font-medium bg-blue-600 text-white \${className}\`} {...props}>{children}</button>;
export const Input = ({ className = '', ...props }) => <input className={\`w-full px-3 py-2 border border-gray-300 rounded-lg \${className}\`} {...props} />;
export const Badge = ({ children, className = '', ...props }) => <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800 \${className}\`} {...props}>{children}</span>;
`);
  }

  // ── src/App.jsx ── the AI-generated component ─────────────────────────────
  const mockImport = needsMocks ? `import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Input, Badge } from './components';\n` : '';
  const rechartsImport = usesRecharts && !code.includes("from 'recharts'") 
    ? `import { ResponsiveContainer, BarChart, LineChart, AreaChart, PieChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line, Area, Pie } from 'recharts';\n` 
    : '';

  src.file('App.jsx', `${mockImport}${rechartsImport}${code}`);

  // ── README.md ─────────────────────────────────────────────────────────────
  zip.file('README.md', `# ${projectName}

Generated with [UI-as-Code](https://github.com/laddasiddharth/UI-as-code) — Prompt-to-Live-Interface Platform.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Stack
- React 19
- Vite 5
- Tailwind CSS v4
- Lucide React (icons)
`);

  // ── .gitignore ────────────────────────────────────────────────────────────
  zip.file('.gitignore', `node_modules/\ndist/\n.env\n`);

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${projectName}.zip`);
}
