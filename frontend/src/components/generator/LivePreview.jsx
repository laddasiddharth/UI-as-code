import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Eye, Code2, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import ExportButton from './ExportButton';

/**
 * LivePreview: Custom Iframe Compiler Edition
 * 
 * Why this instead of Sandpack?
 * 1. ISP Immunity: No CodeSandbox background requests that ISPs like Jio often block.
 * 2. Performance: Transpilation happens instantly in-memory without a virtual Node environment.
 * 3. Simplicity: Single-file React/Tailwind component rendering is rock-solid.
 */
export default function LivePreview({ code, isGenerating, onError }) {
  const [activeTab, setActiveTab] = useState('preview');
  const [iframeKey, setIframeKey] = useState(0); // For forcing refresh
  const [runtimeError, setRuntimeError] = useState(null);
  const iframeRef = useRef(null);

  // Sanitize and prepare code for Babel
  const processedCode = useMemo(() => {
    if (!code) return '';
    
    // Remove markdown code blocks if present
    let cleaned = code.replace(/^```(?:jsx|js|javascript)?\n/i, '').replace(/\n```$/i, '');
    
    // 1. Strip React imports - we provide React globals in the iframe scope
    const reactImportRegex = /^import\s+[\s\S]*?from\s+['"]react['"];?/gm;
    cleaned = cleaned.replace(reactImportRegex, '');

    // 2. Remove dangerous/hallucinated local imports safely
    // BUT convert lucide-react imports to use our internal mock
    const lucideImportRegex = /import\s+{([\s\S]*?)}\s+from\s+['"]lucide-react['"];?/g;
    cleaned = cleaned.replace(lucideImportRegex, (match, p1) => {
      return `const {${p1}} = LucideReact;`;
    });

    // Strip other imports
    const badImportRegex = /^import\s+[\s\S]*?\s+from\s+['"](?:@\/components|\.\/components|\.\/ui|@\/ui|shadcn|@radix|@mui|antd|chakra|.*\.css)['"][^;]*;?/gm;
    cleaned = cleaned.replace(badImportRegex, '');

    // 3. Define Fallback Mocks for common hallucinated components
    const componentMocks = `
      const Card = ({ children, className = '', ...props }) => (
        <div className={\`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden \${className}\`} {...props}>{children}</div>
      );
      const CardHeader = ({ children, className = '', ...props }) => (
        <div className={\`px-6 py-4 border-b border-gray-100 \${className}\`} {...props}>{children}</div>
      );
      const CardTitle = ({ children, className = '', ...props }) => (
        <h3 className={\`text-lg font-semibold text-gray-900 \${className}\`} {...props}>{children}</h3>
      );
      const CardContent = ({ children, className = '', ...props }) => (
        <div className={\`p-6 \${className}\`} {...props}>{children}</div>
      );
      const CardFooter = ({ children, className = '', ...props }) => (
        <div className={\`px-6 py-4 border-t border-gray-100 bg-gray-50/50 \${className}\`} {...props}>{children}</div>
      );
      const Button = ({ children, className = '', variant = 'primary', ...props }) => {
        const variants = {
          primary: 'bg-blue-600 text-white hover:bg-blue-700',
          secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
          outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
        };
        return (
          <button className={\`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 \${variants[variant] || variants.primary} \${className}\`} {...props}>
            {children}
          </button>
        );
      };
      const Input = ({ className = '', ...props }) => (
        <input className={\`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all \${className}\`} {...props} />
      );
      const Badge = ({ children, className = '', ...props }) => (
        <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 \${className}\`} {...props}>{children}</span>
      );
    `;

    return `
      ${componentMocks}
      ${cleaned}
      
      // Auto-render logic: find the default export and render it
      try {
        const App = typeof Preview !== 'undefined' ? Preview : 
                    typeof App !== 'undefined' ? App : 
                    exportDefault; // Fallback for some AI outputs
        
        const rootElement = document.getElementById('root');
        if (rootElement) {
          const root = ReactDOM.createRoot(rootElement);
          root.render(React.createElement(App || (() => <div className="p-8 text-center text-gray-500">No default export found.</div>)));
        }
      } catch (err) {
        console.error("Render error:", err);
        window.parent.postMessage({ type: 'error', message: err.message }, '*');
      }
    `;
  }, [code]);

  // Construct the Iframe HTML
  const srcDoc = useMemo(() => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          
          <!-- Tailwind CSS -->
          <script src="https://cdn.tailwindcss.com"></script>
          
          <!-- Babel Standalone for JSX transpilation -->
          <script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
          
          <!-- React & ReactDOM -->
          <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js"></script>
          
          <!-- Mocking Lucide React -->
          <script>
            // Simple mock for Lucide React components
            // In a real app, you might want to use the Lucide CDN properly
            window.Lucide = {
              createIcons: () => {},
              // Proxy to catch any icon names the AI might use
            };
            
            // Create a Proxy that returns a basic SVG for any Lucide component access
            const LucideProxy = new Proxy({}, {
              get: (target, name) => {
                return (props) => {
                  const size = props.size || props.height || 24;
                  return React.createElement('svg', {
                    width: size,
                    height: size,
                    viewBox: '0 0 24 24',
                    fill: 'none',
                    stroke: 'currentColor',
                    strokeWidth: 2,
                    strokeLinecap: 'round',
                    strokeLinejoin: 'round',
                    className: props.className,
                    ...props
                  }, React.createElement('circle', { cx: 12, cy: 12, r: 10 }));
                }
              }
            });
            window.LucideReact = LucideProxy;
          </script>

          <style>
            body { margin: 0; padding: 0; background: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            #root { min-height: 100vh; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script type="text/babel">
            // Expose components to the script's scope
            const { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } = React;
            
            // Re-map common export patterns
            let exportDefault = null;
            
            ${processedCode.replace(/export default/g, 'exportDefault =')}
          </script>
        </body>
      </html>
    `;
  }, [processedCode]);

  // Handle messages from the iframe (e.g. errors)
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'error') {
        setRuntimeError(event.data.message);
        if (onError) onError(event.data.message);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onError]);

  // Clear runtime error when code changes
  useEffect(() => {
    setRuntimeError(null);
  }, [code]);

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
          <button 
            onClick={() => setIframeKey(k => k + 1)}
            className="p-1.5 text-[color:var(--muted)] hover:text-[color:var(--ink)] transition-colors"
            title="Refresh Preview"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>
          <ExportButton code={code} disabled={isGenerating} />
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 relative bg-white overflow-hidden">
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

        {activeTab === 'preview' ? (
          <div className="w-full h-full flex flex-col">
            {runtimeError && (
              <div className="p-4 bg-red-50 border-b border-red-100 flex items-start gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Preview Error</p>
                  <p className="text-xs font-mono mt-1">{runtimeError}</p>
                </div>
              </div>
            )}
            <iframe
              key={iframeKey}
              ref={iframeRef}
              srcDoc={srcDoc}
              className="w-full h-full border-none bg-white"
              sandbox="allow-scripts allow-modals"
              title="Preview"
            />
          </div>
        ) : (
          <div className="w-full h-full bg-[#151515] overflow-auto p-4">
            <pre className="text-sm font-mono text-gray-300 whitespace-pre-wrap leading-relaxed">
              {code}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
