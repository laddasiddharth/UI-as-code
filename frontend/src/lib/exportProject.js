import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export async function exportAsViteProject(code, projectName = 'ui-as-code-export') {
  const zip = new JSZip();
  const src = zip.folder('src');

  // Detect what the code needs
  const usesRecharts = code.includes('Chart') || code.includes('recharts');
  const needsMocks = ['<Card', '<Button', '<Input', '<Badge'].some(tag => code.includes(tag));

  // Dynamically build dependencies
  const dependencies = {
    react: '^19.0.0',
    'react-dom': '^19.0.0',
    'lucide-react': 'latest',
  };
  
  if (usesRecharts) {
    dependencies['recharts'] = '^2.12.0';
  }

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
    dependencies,
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
  src.file('index.css', `@import "tailwindcss";\n`);

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

  // ── Mocks Injection ─────────────────────────────────────────────────────────
  if (needsMocks) {
    src.file('components.jsx', `import React from 'react';
export const Card = ({ children, className = '', ...props }) => <div className={\`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden \${className}\`} {...props}>{children}</div>;
export const CardHeader = ({ children, className = '', ...props }) => <div className={\`px-6 py-4 border-b border-gray-100 \${className}\`} {...props}>{children}</div>;
export const CardTitle = ({ children, className = '', ...props }) => <h3 className={\`text-lg font-semibold text-gray-900 \${className}\`} {...props}>{children}</h3>;
export const CardContent = ({ children, className = '', ...props }) => <div className={\`p-6 \${className}\`} {...props}>{children}</div>;
export const CardFooter = ({ children, className = '', ...props }) => <div className={\`px-6 py-4 border-t border-gray-100 bg-gray-50/50 \${className}\`} {...props}>{children}</div>;
export const Button = ({ children, className = '', variant = 'primary', ...props }) => {
  const variants = { primary: 'bg-blue-600 text-white hover:bg-blue-700', secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200', outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50' };
  return <button className={\`px-4 py-2 rounded-lg font-medium transition-colors \${variants[variant] || variants.primary} \${className}\`} {...props}>{children}</button>;
};
export const Input = ({ className = '', ...props }) => <input className={\`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 \${className}\`} {...props} />;
export const Badge = ({ children, className = '', ...props }) => <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 \${className}\`} {...props}>{children}</span>;
`);
  }

  // Handle automatic imports for the user
  const mockImport = needsMocks ? `import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Input, Badge } from './components';\n` : '';
  const rechartsImport = usesRecharts && !code.includes("from 'recharts'") 
    ? `import { ResponsiveContainer, BarChart, LineChart, AreaChart, PieChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar, Line, Area, Pie } from 'recharts';\n` 
    : '';

  // ── src/App.jsx ─────────────────────────────────────────────────────────────
  src.file('App.jsx', `${mockImport}${rechartsImport}${code}`);

  // ── README.md ───────────────────────────────────────────────────────────────
  zip.file('README.md', `# ${projectName}\n\nGenerated with UI-as-Code Platform.\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`);
  zip.file('.gitignore', `node_modules/\ndist/\n.env\n`);

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${projectName}.zip`);
}
