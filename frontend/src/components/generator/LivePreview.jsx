import React, { useState } from 'react';
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack,
} from '@codesandbox/sandpack-react';
import { atomDark } from '@codesandbox/sandpack-themes';
import { Eye, Code2, Loader2, AlertTriangle } from 'lucide-react';

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

export default function LivePreview({ code, isGenerating }) {
  const [activeTab, setActiveTab] = useState('preview');

  const files = {
    '/App.js': {
      code: code,
      active: true,
    },
    '/tailwind.config.js': {
      code: `module.exports = { content: ['./**/*.{js,jsx}'], theme: { extend: {} }, plugins: [] }`,
      hidden: true,
    },
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e2e] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#1a1a2e] border-b border-white/10 flex-shrink-0">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'preview'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeTab === 'code'
                ? 'bg-white/10 text-white'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            Code
          </button>
        </div>
        <div className="flex items-center gap-2">
          {isGenerating && (
            <div className="flex items-center gap-1.5 text-xs text-purple-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Generating...</span>
            </div>
          )}
          <div className="flex gap-1.5 ml-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80"></span>
          </div>
        </div>
      </div>

      {/* Sandpack */}
      <div className="flex-1 relative overflow-hidden">
        {/* Generating overlay */}
        {isGenerating && (
          <div className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 text-center shadow-2xl">
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
              </div>
              <p className="text-white/90 text-sm font-medium">Building your component...</p>
              <p className="text-white/40 text-xs mt-1">Powered by Qwen3 Coder 480B</p>
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
              'tailwindcss': 'latest',
            },
          }}
          options={{
            externalResources: [
              'https://cdn.tailwindcss.com',
            ],
          }}
        >
          <SandpackLayout style={{ height: '100%', border: 'none', borderRadius: 0 }}>
            {activeTab === 'preview' ? (
              <div className="relative w-full h-full">
                <SandpackPreview
                  style={{ height: '100%' }}
                  showNavigator={false}
                  showRefreshButton={true}
                />
                <ErrorOverlay />
              </div>
            ) : (
              <SandpackCodeEditor
                style={{ height: '100%' }}
                showTabs={false}
                showLineNumbers={true}
                showInlineErrors={true}
                wrapContent={false}
                readOnly={false}
              />
            )}
          </SandpackLayout>
        </SandpackProvider>
      </div>
    </div>
  );
}
