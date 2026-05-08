import React, { useEffect, useState } from 'react';
import ChatPanel from '../../components/generator/ChatPanel';
import LivePreview from '../../components/generator/LivePreview';
import { useGeneration } from '../../hooks/useGeneration';
import { useSearchParams } from 'react-router-dom';

const CURRENT_SESSION_KEY = 'atelierui.currentSessionId';

export default function GeneratorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionParam = searchParams.get('session');
  const newParam = searchParams.get('new');

  if (sessionParam && localStorage.getItem(CURRENT_SESSION_KEY) !== sessionParam) {
    localStorage.setItem(CURRENT_SESSION_KEY, sessionParam);
  }

  const { code, setCode, messages, isGenerating, generate, reset, repairFromError } = useGeneration();
  const [chatVisible, setChatVisible] = useState(true);
  const [quickInput, setQuickInput] = useState('');

  const hasMessages = messages.length > 0;
  const showChatPanel = hasMessages && chatVisible;

  useEffect(() => {
    if (newParam) {
      localStorage.removeItem(CURRENT_SESSION_KEY);
      reset();
      setSearchParams({}, { replace: true });
      return;
    }

    if (!sessionParam) {
      reset();
    }
  }, [newParam, sessionParam, reset, setSearchParams]);

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickInput.trim() || isGenerating) return;
    generate(quickInput.trim());
    setQuickInput('');
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[color:var(--bg)] relative">
      <div
        className={`flex-shrink-0 border-r border-white/10 transition-all duration-300 ease-in-out overflow-hidden h-full ${
          showChatPanel ? 'w-80' : 'w-0'
        }`}
      >
        <div className="w-80 h-full">
          <ChatPanel
            messages={messages}
            isGenerating={isGenerating}
            onGenerate={generate}
            onReset={reset}
            showInput={true}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden h-full">
        <div className="flex-1 relative w-full h-full">
          <LivePreview
            code={code}
            isGenerating={isGenerating}
            onError={(errorMessage) => repairFromError(errorMessage, code)}
            onChatToggle={() => setChatVisible(!chatVisible)}
            chatVisible={chatVisible}
            showChatToggle={hasMessages}
            onCodeChange={setCode}
          />
        </div>

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
      </div>
    </div>
  );
}
