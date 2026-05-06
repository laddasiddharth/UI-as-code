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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden bg-[color:var(--bg)]">
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
            className="absolute top-3 left-3 z-30 p-1.5 rounded-md bg-[color:var(--panel-strong)]/90 hover:bg-[color:var(--panel-strong)] text-[color:var(--muted)] hover:text-[color:var(--ink)] transition-all shadow-sm"
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
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-[color:var(--bg)]/70 backdrop-blur-sm">
            <div className="w-full max-w-2xl px-6">
              <div className="glass-panel rounded-[32px] p-6 sm:p-8">
                <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Launch</p>
                <h2 className="font-display text-2xl sm:text-3xl text-[color:var(--ink)] mt-3">Start with a prompt</h2>
                <p className="text-sm text-[color:var(--muted)] mt-2">
                  Describe the UI you want to build, then keep iterating without losing the vibe.
                </p>
                <form onSubmit={handleQuickSubmit} className="mt-5 flex items-end gap-2">
                  <textarea
                    value={quickInput}
                    onChange={(e) => setQuickInput(e.target.value)}
                    placeholder="E.g. A pricing page with three tiers and a bold CTA"
                    rows={3}
                    className="flex-1 resize-none text-sm px-3 py-2.5 border border-[color:var(--border)] rounded-2xl focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent transition-all placeholder-[color:var(--muted)] bg-[color:var(--panel-strong)]"
                    disabled={isGenerating}
                  />
                  <button
                    type="submit"
                    disabled={!quickInput.trim() || isGenerating}
                    className="flex-shrink-0 h-12 px-5 bg-[color:var(--accent)] hover:bg-[color:var(--accent-3)] text-[color:var(--ink)] rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {isGenerating ? 'Generating...' : 'Generate'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {hasMessages && (
          <div className="absolute bottom-4 left-1/2 z-20 w-[min(760px,95%)] -translate-x-1/2">
            <form onSubmit={handleQuickSubmit} className="flex items-end gap-2 glass-panel rounded-2xl p-3">
              <div className="flex-1">
                <textarea
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  placeholder="Refine the UI..."
                  rows={2}
                  className="w-full resize-none text-sm px-3 py-2 border border-[color:var(--border)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent transition-all placeholder-[color:var(--muted)] bg-[color:var(--panel-strong)]"
                  disabled={isGenerating}
                />
              </div>
              <button
                type="submit"
                disabled={!quickInput.trim() || isGenerating}
                className="flex-shrink-0 h-10 px-4 bg-[color:var(--accent-3)] hover:bg-[color:var(--accent)] text-[color:var(--ink)] rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
