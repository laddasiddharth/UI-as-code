import React, { useState, useRef, useEffect, useMemo } from 'react';
import * as ReactDOMClient from 'react-dom/client';
import { Eye, Code2, Loader2, AlertTriangle, RefreshCw, Copy, Check, PanelLeftClose, PanelLeftOpen, Sun, Moon, Undo2, Redo2 } from 'lucide-react';

export default function LivePreview({
  code,
  isGenerating,
  onError,
  onChatToggle,
  chatVisible,
  showChatToggle,
  onCodeChange,
  headerActions,
  theme = 'light',
  onThemeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onThumbnail,
}) {
  const [activeTab, setActiveTab] = useState('preview');
  const [iframeKey, setIframeKey] = useState(0);
  const [iframeReady, setIframeReady] = useState(false);
  const [runtimeError, setRuntimeError] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [localCode, setLocalCode] = useState(code);
  const iframeRef = useRef(null);
  const lastCapturedRef = useRef('');

  useEffect(() => {
    setLocalCode(code);
  }, [code]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(localCode);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {}
  };

  const handleManualUpdate = () => {
    if (onCodeChange) {
      onCodeChange(localCode);
      setActiveTab('preview');
    }
  };

  const processedCode = useMemo(() => {
    if (!localCode) return '';
    
    let cleaned = localCode;
    const codeBlockMatch = localCode.match(/```(?:jsx|js|javascript|tsx|ts)?\s*\n([\s\S]*?)```/i);
    if (codeBlockMatch) {
      cleaned = codeBlockMatch[1];
    } else {
      // Fallback if no code block, just trim
      cleaned = localCode.trim();
    }

    cleaned = cleaned.replace(/```[\s\S]*?```/g, '').trim();
    cleaned = cleaned.replace(/^```.*$/gm, '').trim();
    
    // First, process specific imports we want to mock
    const lucideImportRegex = /import\s*\{([^}]*)\}\s*from\s*['"]lucide-react['"];?/gm;
    cleaned = cleaned.replace(lucideImportRegex, (match, p1) => `var {${p1}} = LucideReact;`);

    const rechartsImportRegex = /import\s*\{([^}]*)\}\s*from\s*['"]recharts['"];?/gm;
    cleaned = cleaned.replace(rechartsImportRegex, (match, p1) => `var {${p1}} = RechartsMock;`);

    // Remove ALL remaining import statements safely
    cleaned = cleaned.replace(/import\s+[^'"]+['"][^'"]+['"]\s*;?/g, '');
    
    // Also handle default imports without brackets, e.g. import React from 'react';
    cleaned = cleaned.replace(/import\s+[a-zA-Z0-9_]+\s+from\s+['"][^'"]+['"]\s*;?/g, '');
    
    // Remove any empty export statements
    cleaned = cleaned.replace(/export\s+\{\s*\}\s*;/g, '');

    // Guard against dangling remnants like: "} from 'recharts';"
    cleaned = cleaned.replace(/^\s*}\s*from\s*['"][^'"]+['"];?\s*$/gm, '');

    const componentMocks = `
      var Card = ({ children, className = '', ...props }) => (
        <div className={\`bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden \${className}\`} {...props}>{children}</div>
      );
      var CardHeader = ({ children, className = '', ...props }) => (
        <div className={\`px-6 py-4 border-b border-gray-100 \${className}\`} {...props}>{children}</div>
      );
      var CardTitle = ({ children, className = '', ...props }) => (
        <h3 className={\`text-lg font-semibold text-gray-900 \${className}\`} {...props}>{children}</h3>
      );
      var CardContent = ({ children, className = '', ...props }) => (
        <div className={\`p-6 \${className}\`} {...props}>{children}</div>
      );
      var CardFooter = ({ children, className = '', ...props }) => (
        <div className={\`px-6 py-4 border-t border-gray-100 bg-gray-50/50 \${className}\`} {...props}>{children}</div>
      );
      var Button = ({ children, className = '', variant = 'primary', ...props }) => {
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
      var Input = ({ className = '', ...props }) => (
        <input className={\`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all \${className}\`} {...props} />
      );
      var Badge = ({ children, className = '', ...props }) => (
        <span className={\`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 \${className}\`} {...props}>{children}</span>
      );
      var ResponsiveContainer = ({ children, width = '100%', height = 260, ...props }) => (
        <div style={{ width, height }} {...props}>{children}</div>
      );
      var RechartsSvg = ({ children, ...props }) => (
        <svg viewBox="0 0 800 260" width="100%" height="100%" preserveAspectRatio="none" {...props}>
          <rect x="0" y="0" width="800" height="260" fill="transparent" />
          {children}
        </svg>
      );
      var ChartContainer = ({ children, className = '', ...props }) => (
        <div className={\`w-full h-full rounded-xl border border-gray-200 bg-white/80 \${className}\`} {...props}>
          <RechartsSvg>{children}</RechartsSvg>
        </div>
      );
      var CartesianGrid = () => null;
      var XAxis = () => null;
      var YAxis = () => null;
      var Tooltip = () => null;
      var Legend = () => null;
      var BarChart = ({ children, ...props }) => <ChartContainer {...props}>{children}</ChartContainer>;
      var LineChart = ({ children, ...props }) => <ChartContainer {...props}>{children}</ChartContainer>;
      var AreaChart = ({ children, ...props }) => <ChartContainer {...props}>{children}</ChartContainer>;
      var PieChart = ({ children, ...props }) => <ChartContainer {...props}>{children}</ChartContainer>;
      var ComposedChart = ({ children, ...props }) => <ChartContainer {...props}>{children}</ChartContainer>;
      var RadarChart = ({ children, ...props }) => <ChartContainer {...props}>{children}</ChartContainer>;
      var RadialBarChart = ({ children, ...props }) => <ChartContainer {...props}>{children}</ChartContainer>;
      var ScatterChart = ({ children, ...props }) => <ChartContainer {...props}>{children}</ChartContainer>;
      var FunnelChart = ({ children, ...props }) => <ChartContainer {...props}>{children}</ChartContainer>;
      var Treemap = ({ children, ...props }) => <ChartContainer {...props}>{children}</ChartContainer>;
      var Sankey = ({ children, ...props }) => <ChartContainer {...props}>{children}</ChartContainer>;
      var Bar = () => null;
      var Line = () => null;
      var Area = () => null;
      var Pie = () => null;
      var Cell = () => null;
      var Scatter = () => null;
      var Radar = () => null;
      var RadialBar = () => null;
      var Funnel = () => null;
      var Label = () => null;
      var LabelList = () => null;
      var Brush = () => null;
      var ReferenceLine = () => null;
      var ReferenceArea = () => null;
      var ReferenceDot = () => null;
      var ErrorBar = () => null;
      var PolarGrid = () => null;
      var PolarAngleAxis = () => null;
      var PolarRadiusAxis = () => null;
      var RechartsMock = {
        ResponsiveContainer,
        CartesianGrid,
        XAxis,
        YAxis,
        Tooltip,
        Legend,
        BarChart,
        LineChart,
        AreaChart,
        PieChart,
        ComposedChart,
        RadarChart,
        RadialBarChart,
        ScatterChart,
        FunnelChart,
        Treemap,
        Sankey,
        Bar,
        Line,
        Area,
        Pie,
        Cell,
        Scatter,
        Radar,
        RadialBar,
        Funnel,
        Label,
        LabelList,
        Brush,
        ReferenceLine,
        ReferenceArea,
        ReferenceDot,
        ErrorBar,
        PolarGrid,
        PolarAngleAxis,
        PolarRadiusAxis
      };
    `;

    return `
      ${componentMocks}
      ${cleaned}
      
      try {
        let RootComponent = null;
        if (typeof exportDefault !== 'undefined' && exportDefault) RootComponent = exportDefault;
        else if (typeof Preview !== 'undefined') RootComponent = Preview;
        else if (typeof window.App !== 'undefined') RootComponent = window.App;
        else if (typeof window.Main !== 'undefined') RootComponent = window.Main;
        else if (typeof window.Component !== 'undefined') RootComponent = window.Component;
        else if (typeof window.Dashboard !== 'undefined') RootComponent = window.Dashboard;
        else if (typeof window.Example !== 'undefined') RootComponent = window.Example;
        
        // If we still don't have a RootComponent, try to find any React component in the global scope
        if (!RootComponent) {
          const possibleComponents = Object.entries(window)
            .filter(([key, val]) => typeof val === 'function' && /^[A-Z]/.test(key) && key !== 'LucideProxy' && key !== 'RechartsMock')
            .map(([_, val]) => val);
          if (possibleComponents.length > 0) RootComponent = possibleComponents[0];
        }

        const rootElement = document.getElementById('root');
        if (rootElement) {
          const root = ReactDOM.createRoot(rootElement);
          root.render(React.createElement(RootComponent || (() => <div className="p-8 text-center text-gray-500">No component found to render. Please ensure you export a default component.</div>), {}));
        }
      } catch (err) {
        console.error("Render error:", err);
        window.parent.postMessage({ type: 'error', message: err.message }, '*');
      }
    `;
  }, [localCode]);

  const srcDoc = useMemo(() => {
    const runtimeCode = `
      const { useState, useEffect, useMemo, useCallback, useRef, createContext, useContext } = React;
      let exportDefault = null;
      ${processedCode
        .replace(/export\s+default\s+/g, 'exportDefault = ')
        .replace(/export\s+(const|let|var|function|class)\s+/g, '$1 ')
        .replace(/export\s+\{[^}]+\}\s*;/g, '')
      }
    `;

    return `
      <!DOCTYPE html>
      <html class="${theme === 'dark' ? 'dark' : ''}">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <script src="https://cdn.tailwindcss.com"></script>
          <script src="https://cdn.jsdelivr.net/npm/@babel/standalone/babel.min.js"></script>
          <script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js"></script>
          <script>
            const LucideReact = new Proxy({}, {
              get: (_, name) => ({ className, size = 24, strokeWidth = 2, ...rest }) => {
                const iconData = lucide[name] || lucide['HelpCircle'];
                
                const renderChild = (child) => {
                  if (!Array.isArray(child)) return null;
                  const [tag, props, children] = child;
                  return React.createElement(
                    tag, 
                    { ...props, key: Math.random().toString(36).substr(2, 9) }, 
                    Array.isArray(children) ? children.map(renderChild) : null
                  );
                };

                const svgChildren = (iconData[2] || []).map(renderChild);
                
                return React.createElement('svg', {
                  xmlns: 'http://www.w3.org/2000/svg',
                  width: size, height: size, viewBox: '0 0 24 24',
                  fill: 'none', stroke: 'currentColor',
                  strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
                  className, ...rest
                }, ...svgChildren);
              }
            });
            window.LucideReact = LucideReact;
          </script>
          <style>
            body { margin: 0; padding: 0; background: ${theme === 'dark' ? '#0f1117' : '#fff'}; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
            #root { min-height: 100vh; }
          </style>
        </head>
        <body>
          <div id="root"></div>
          <script>
            (function () {
              const parentReact = window.parent && window.parent.__PREVIEW_REACT__;
              if (parentReact?.React && parentReact?.ReactDOM) {
                window.React = parentReact.React;
                window.ReactDOM = parentReact.ReactDOM;
              }

              const reactUrls = [
                'https://unpkg.com/react@19.0.0/umd/react.production.min.js',
                'https://cdn.jsdelivr.net/npm/react@19.0.0/umd/react.production.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/react/19.0.0/umd/react.production.min.js'
              ];
              const reactDomUrls = [
                'https://unpkg.com/react-dom@19.0.0/umd/react-dom.production.min.js',
                'https://cdn.jsdelivr.net/npm/react-dom@19.0.0/umd/react-dom.production.min.js',
                'https://cdnjs.cloudflare.com/ajax/libs/react-dom/19.0.0/umd/react-dom.production.min.js'
              ];

              const loadScript = (urls) => new Promise((resolve, reject) => {
                const tryNext = (index) => {
                  if (index >= urls.length) {
                    reject(new Error('Failed to load script: ' + urls[urls.length - 1]));
                    return;
                  }
                  const script = document.createElement('script');
                  script.src = urls[index];
                  script.onload = () => resolve();
                  script.onerror = () => tryNext(index + 1);
                  document.head.appendChild(script);
                };
                tryNext(0);
              });

              const run = async () => {
                if (!window.React) {
                  await loadScript(reactUrls);
                }
                if (!window.ReactDOM) {
                  await loadScript(reactDomUrls);
                }
                const componentCode = ${JSON.stringify(runtimeCode)};
                const transformed = Babel.transform(componentCode, { presets: ['react'] }).code;
                const script = document.createElement('script');
                script.text = transformed;
                document.body.appendChild(script);

                document.addEventListener('error', (event) => {
                  const target = event.target;
                  if (!target || target.tagName !== 'IMG') return;
                  const currentSrc = target.getAttribute('src');
                  if (!currentSrc || currentSrc.includes('images.weserv.nl')) return;
                  const normalized = currentSrc
                    .replace('https://', '')
                    .replace('http://', '');
                  target.setAttribute('referrerpolicy', 'no-referrer');
                  target.src = 'https://images.weserv.nl/?url=' + encodeURIComponent(normalized);
                }, true);

                // Thumbnail capture logic inside the iframe
                const captureThumbnail = async () => {
                  try {
                    const { default: domToImage } = await import('https://esm.sh/dom-to-image-more@3');
                    const root = document.getElementById('root');
                    if (!root) return;
                    
                    const dataUrl = await domToImage.toPng(root, { quality: 0.6, scale: 0.5 });
                    window.parent.postMessage({ type: 'thumbnail', dataUrl }, '*');
                  } catch (e) {
                    // Best-effort, silently ignore
                  }
                };
                setTimeout(captureThumbnail, 1500);
              };

              run().catch((err) => {
                console.error('Preview bootstrap failed:', err);
                window.parent.postMessage({ type: 'error', message: err.message }, '*');
              });
            })();
          </script>
        </body>
      </html>
    `;
  }, [processedCode]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'error') {
        setRuntimeError(event.data.message);
        if (onError) onError(event.data.message);
      } else if (event.data.type === 'thumbnail' && onThumbnail) {
        // Thumbnail comes FROM the iframe, no cross-origin issue
        onThumbnail(event.data.dataUrl);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onError, onThumbnail]);

  useEffect(() => {
    setRuntimeError(null);
  }, [localCode]);

  useEffect(() => {
    // Seamlessly toggle theme without reloading the iframe
    if (iframeRef.current && iframeRef.current.contentDocument) {
      const htmlEl = iframeRef.current.contentDocument.documentElement;
      if (theme === 'dark') {
        htmlEl.classList.add('dark');
        htmlEl.style.background = '#0f1117';
      } else {
        htmlEl.classList.remove('dark');
        htmlEl.style.background = '#fff';
      }
    }
  }, [theme, iframeReady]);

  useEffect(() => {
    setIframeReady(false);
  }, [iframeKey, code]);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => setIframeReady(true);
    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, [iframeRef]);



  useEffect(() => {
    window.__PREVIEW_REACT__ = { React, ReactDOM: ReactDOMClient };
    return () => {
      delete window.__PREVIEW_REACT__;
    };
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col bg-[color:var(--panel-strong)] overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-2 bg-[color:var(--panel-strong)] border-b border-[color:var(--border)] flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          {showChatToggle && (
            <button
              onClick={onChatToggle}
              className="p-1.5 rounded-md hover:bg-[color:var(--panel)] text-[color:var(--muted)] hover:text-[color:var(--ink)] transition-colors border border-[color:var(--border)] shadow-sm"
              title={chatVisible ? 'Hide chat' : 'Show chat'}
            >
              {chatVisible ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeftOpen className="w-3.5 h-3.5" />}
            </button>
          )}
          <div className="w-px h-4 bg-[color:var(--border)] mx-1 hidden sm:block"></div>
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'preview' ? 'bg-[color:var(--accent)]/15 text-[color:var(--ink)]' : 'text-[color:var(--muted)] hover:text-[color:var(--ink)]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'code' ? 'bg-[color:var(--accent)]/15 text-[color:var(--ink)]' : 'text-[color:var(--muted)] hover:text-[color:var(--ink)]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              Code
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {(onUndo || onRedo) && (
            <div className="flex items-center gap-1">
              <button
                onClick={onUndo}
                disabled={!canUndo}
                className="p-1.5 rounded-md border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed"
                title="Undo"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRedo}
                disabled={!canRedo}
                className="p-1.5 rounded-md border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--ink)] disabled:opacity-40 disabled:cursor-not-allowed"
                title="Redo"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {onThemeChange && (
            <button
              onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}
              className="p-1.5 rounded-md border border-[color:var(--border)] text-[color:var(--muted)] hover:text-[color:var(--ink)]"
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          )}
          {headerActions}
          {activeTab === 'code' && (
            <div className="flex items-center gap-2 mr-2">
              <button onClick={handleCopy} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[color:var(--muted)] hover:text-[color:var(--ink)] transition-colors">
                {copySuccess ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                {copySuccess ? 'Copied!' : 'Copy'}
              </button>
              {localCode !== code && (
                <button onClick={handleManualUpdate} className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-[color:var(--accent)]/15 text-[color:var(--accent)] hover:bg-[color:var(--accent)]/25 rounded-md transition-colors">
                  <RefreshCw className="w-3 h-3" />
                  Update Preview
                </button>
              )}
            </div>
          )}
          {isGenerating && (
            <div className="flex items-center gap-1.5 text-xs text-[color:var(--accent)]">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Generating...</span>
            </div>
          )}
          <button onClick={() => setIframeKey(k => k + 1)} className="p-1.5 text-[color:var(--muted)] hover:text-[color:var(--ink)] transition-colors" title="Refresh Preview">
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

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

        {activeTab === 'preview' && (
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
            <iframe key={iframeKey} ref={iframeRef} srcDoc={srcDoc} className="w-full h-full border-none bg-white" sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin" title="Preview" />
          </div>
        )}
        {activeTab === 'code' && (
          <div className="w-full h-full bg-[#0d1117] flex flex-col">
            <textarea
              value={localCode}
              onChange={(e) => setLocalCode(e.target.value)}
              spellCheck="false"
              className="flex-1 w-full bg-transparent text-gray-300 font-mono text-sm p-6 focus:outline-none resize-none leading-relaxed selection:bg-purple-500/30"
              placeholder="Paste your code here..."
            />
          </div>
        )}
      </div>
    </div>
  );
}
