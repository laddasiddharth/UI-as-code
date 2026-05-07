import React, { useEffect, useState } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack,
} from '@codesandbox/sandpack-react';
import { atomDark } from '@codesandbox/sandpack-themes';
import { Eye, Code2, Loader2, AlertTriangle } from 'lucide-react';
import ExportButton from './ExportButton';

class PreviewErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidUpdate(prevProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: '' });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-700 font-mono text-xs">
          <p>Compiler Error:</p>
          <pre>{this.state.errorMessage}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}

// Inner component to read sandpack error state
function ErrorOverlay() {
  const { sandpack } = useSandpack();
  const hasError = sandpack.error;
  if (!hasError) return null;
  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 bg-red-900/95 backdrop-blur-sm text-red-200 p-3 border-t border-red-700">
      <div className="flex items-start gap-2">
        <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-semibold text-red-300 mb-0.5">Runtime Error</p>
          <p className="text-xs font-mono leading-relaxed">{sandpack.error.message}</p>
        </div>
      </div>
    </div>
  );
}

function ErrorReporter({ onError, isGenerating }) {
  const { sandpack } = useSandpack();

  useEffect(() => {
    if (!onError || isGenerating) return;
    if (sandpack.error?.message) {
      onError(sandpack.error.message);
    }
  }, [onError, isGenerating, sandpack.error]);

  return null;
}

export default function LivePreview({ code, isGenerating, onError }) {
  const [activeTab, setActiveTab] = useState('preview');

  // Defensively strip out hallucinated styling libraries and inject 'Self-Healing' mocks
  const sanitizedCode = (() => {
    // 1. Remove bad imports
    const lines = code.split('\n').filter(line => {
      if (!line.trim().startsWith('import ')) return true;
      const allowed = [
        /'react'/, /"react"/, 
        /'lucide-react'/, /"lucide-react"/, 
        /'framer-motion'/, /"framer-motion"/,
        /'clsx'/, /"clsx"/,
        /'tailwind-merge'/, /"tailwind-merge"/,
        /'\.\/lib\/supabase'/, /"\.\/lib\/supabase"/, 
        /'\.\/lib\/firebase'/, /"\.\/lib\/firebase"/, 
        /'firebase\/auth'/, /"firebase\/auth"/
      ];
      return allowed.some(pattern => pattern.test(line));
    });

    // 2. Inject fallback mocks for commonly hallucinated components to prevent 'ReferenceError'
    const componentsToMock = [
      'Card',
      'CardHeader',
      'CardTitle',
      'CardContent',
      'CardFooter',
      'CardBody',
      'Button',
      'Text',
      'Heading',
      'Container',
      'Section',
      'Row',
      'Col',
      'Input',
      'Label',
      'Icon',
    ];

    const mocks = componentsToMock
      .filter(comp => {
        const isDefined = code.includes(`const ${comp}`)
          || code.includes(`function ${comp}`)
          || code.includes(`let ${comp}`)
          || code.includes(`class ${comp}`);
        return !isDefined;
      })
      .map(comp => {
        if (comp === 'Button') return `const ${comp} = (props) => <button {...props} />;`;
        if (comp === 'Input') return `const ${comp} = (props) => <input {...props} />;`;
        if (comp === 'Label') return `const ${comp} = (props) => <label {...props} />;`;
        if (comp === 'Text') return `const ${comp} = (props) => <span {...props} />;`;
        if (comp === 'Heading' || comp === 'CardTitle') return `const ${comp} = (props) => <h3 {...props} />;`;
        if (comp === 'Section') return `const ${comp} = (props) => <section {...props} />;`;
        return `const ${comp} = (props) => <div {...props} />;`;
      })
      .join('\n');

    // Insert mocks after imports
    let lastImportIndex = -1;
    lines.forEach((line, i) => {
      if (line.trim().startsWith('import ')) lastImportIndex = i;
    });

    if (mocks) {
      lines.splice(lastImportIndex + 1, 0, `/* Injected Mocks */\n${mocks}`);
    }
    const result = lines.join('\n');
    return result;
  })();

  const files = {
    '/index.js': {
      code: `import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

console.log('Index.js loaded, rendering App...');
const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <div className="min-h-screen w-full flex flex-col bg-white">
      <App />
    </div>
  </React.StrictMode>
);`,
      hidden: true,
    },
    '/App.js': {
      code: sanitizedCode,
      active: true,
    },
    '/index.html': {
      code: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>UI Preview</title>
    <script>
      tailwind = {
        theme: {
          extend: {
            colors: {
              brand: {
                50: '#fef2f2',
                100: '#fee2e2',
                200: '#fecaca',
                300: '#fca5a5',
                400: '#f87171',
                500: '#ef4444',
                600: '#dc2626',
                700: '#b91c1c',
                800: '#991b1b',
                900: '#7f1d1d'
              }
            }
          }
        }
      };
    </script>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index.js"></script>
  </body>
</html>
`,
      hidden: true,
    },
    '/styles.css': {
      code: `
html, body, #root {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  font-family: sans-serif;
  background-color: white;
}
`,
      hidden: true,
    },
    '/tailwind.config.js': {
      code: `module.exports = { content: ['./**/*.{js,jsx}'], theme: { extend: {} }, plugins: [] }`,
      hidden: true,
    },
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-[color:var(--panel-strong)] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[color:var(--panel-strong)] border-b border-[color:var(--border)] flex-shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'preview'
                ? 'bg-[color:var(--accent)]/15 text-[color:var(--ink)]'
                : 'text-[color:var(--muted)] hover:text-[color:var(--ink)]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'code'
                ? 'bg-[color:var(--accent)]/15 text-[color:var(--ink)]'
                : 'text-[color:var(--muted)] hover:text-[color:var(--ink)]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Code
          </button>
        </div>
        <div className="flex items-center gap-2">
          {isGenerating && (
            <div className="flex items-center gap-1.5 text-xs text-[color:var(--accent)]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Generating...</span>
            </div>
          )}
          <ExportButton code={code} disabled={isGenerating} />
          <div className="flex gap-1.5 ml-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
          </div>
        </div>
      </div>

      {/* Sandpack */}
      <div className="flex-1 w-full h-full min-h-0 relative bg-white">
        {/* Generating overlay */}
        {isGenerating && (
          <div className="absolute inset-0 z-20 bg-[color:var(--panel-strong)]/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-[color:var(--panel-strong)] border border-[color:var(--border)] rounded-2xl p-6 text-center shadow-2xl">
              <div className="w-12 h-12 bg-[color:var(--accent)]/15 rounded-full flex items-center justify-center mx-auto mb-3">
                <Loader2 className="w-6 h-6 text-[color:var(--accent)] animate-spin" />
              </div>
              <p className="text-[color:var(--ink)] text-sm font-medium">Building your component...</p>
            </div>
          </div>
        )}

        <SandpackProvider
          key={code} // Re-mount when code changes for clean state
          files={files}
          theme={atomDark}
          template="react"
          customSetup={{
            dependencies: {
              'lucide-react': 'latest',
              'framer-motion': 'latest',
              'clsx': 'latest',
              'tailwind-merge': 'latest',
              'tailwindcss': 'latest'
            },
            entry: '/index.js',
          }}
          options={{
            externalResources: [
              'https://cdn.tailwindcss.com',
            ],
            initMode: 'immediate',
            recompileMode: 'immediate',
          }}
        >
          <ErrorReporter onError={onError} isGenerating={isGenerating} />
          <SandpackLayout
            style={{
              height: '100%',
              width: '100%',
              border: 'none',
              borderRadius: 0,
            }}
          >
            <div className={`flex-1 relative w-full h-full bg-white ${activeTab !== 'preview' ? 'hidden' : ''}`}>
              <PreviewErrorBoundary resetKey={code}>
                <SandpackPreview
                  style={{ height: '100%', width: '100%' }}
                  showNavigator={false}
                  showRefreshButton={true}
                />
              </PreviewErrorBoundary>
              <ErrorOverlay />
            </div>
            
            <div className={`flex-1 min-h-0 w-full overflow-auto bg-[#151515] ${activeTab !== 'code' ? 'hidden' : ''}`}>
              <SandpackCodeEditor
                style={{ height: 'auto', minHeight: '100%' }}
                showTabs={false}
                showLineNumbers={true}
                showInlineErrors={true}
                wrapContent={false}
                readOnly={false}
                closableTabs={false}
              />
            </div>
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
}
