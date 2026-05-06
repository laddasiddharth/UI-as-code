import React, { useState } from 'react';
import ChatPanel from '../../components/generator/ChatPanel';
import LivePreview from '../../components/generator/LivePreview';
import { useGeneration } from '../../hooks/useGeneration';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function GeneratorPage() {
  const { code, messages, isGenerating, generate, reset, repairFromError } = useGeneration();
  const [chatVisible, setChatVisible] = useState(true);
  const [quickInput, setQuickInput] = useState('');
  const [baasTemplate, setBaasTemplate] = useState('');

  const hasMessages = messages.length > 0;
  const showChatPanel = hasMessages && chatVisible;

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickInput.trim() || isGenerating) return;
    generate(quickInput.trim(), baasTemplate || null);
    setQuickInput('');
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[#1e1e2e]">
      {/* Chat Panel */}
      <div
        className={`flex-shrink-0 border-r border-white/10 transition-all duration-300 ease-in-out overflow-hidden ${
          showChatPanel ? 'w-80' : 'w-0'
        }`}
      >
        <div className="w-80 h-full">
          <ChatPanel
            messages={messages}
            isGenerating={isGenerating}
            onGenerate={generate}
            onReset={reset}
            showInput={!hasMessages}
            baasTemplate={baasTemplate}
            onBaasChange={setBaasTemplate}
          />
        </div>
      </div>

      {/* Live Preview (takes remaining space) */}
      <div className="flex-1 relative overflow-hidden">
        {/* Toggle chat panel button */}
        {hasMessages && (
          <button
            onClick={() => setChatVisible(!chatVisible)}
            className="absolute top-3 left-3 z-30 p-1.5 rounded-md bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
            title={chatVisible ? 'Hide chat' : 'Show chat'}
          >
            {chatVisible ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        )}

        <LivePreview
          code={code}
          isGenerating={isGenerating}
          onError={(errorMessage) => repairFromError(errorMessage, code)}
        />

        {!hasMessages && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#1e1e2e]/80 backdrop-blur-sm">
            <div className="w-full max-w-xl px-6">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-5">
                <h2 className="text-lg font-semibold text-gray-900">Start with a prompt</h2>
                <p className="text-sm text-gray-500 mt-1">Describe the UI you want to build, and refine it iteratively.</p>
                <form onSubmit={handleQuickSubmit} className="mt-4 flex items-end gap-2">
                  <textarea
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    placeholder="E.g. A pricing page with three tiers and a bold CTA"
                    rows={3}
                    className="flex-1 resize-none text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 bg-gray-50 focus:bg-white"
                    disabled={isGenerating}
                  />
                  <button
                    type="submit"
                    disabled={!quickInput.trim() || isGenerating}
                    className="flex-shrink-0 h-12 px-4 bg-gray-900 hover:bg-gray-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {hasMessages && (
          <div className="absolute bottom-4 left-1/2 z-20 w-[min(720px,95%)] -translate-x-1/2">
            <form onSubmit={handleQuickSubmit} className="flex items-end gap-2 bg-white/95 backdrop-blur border border-gray-200 rounded-2xl shadow-xl p-3">
              <div className="flex-1">
                <textarea
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="Refine the UI..."
                  rows={2}
                  className="w-full resize-none text-sm px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 bg-gray-50 focus:bg-white"
                  disabled={isGenerating}
                />
              </div>
              <button
                type="submit"
                disabled={!quickInput.trim() || isGenerating}
                className="flex-shrink-0 h-10 px-4 bg-gray-900 hover:bg-gray-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? 'Updating...' : 'Update'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
