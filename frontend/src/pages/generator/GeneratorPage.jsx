import React, { useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import ChatPanel from '../../components/generator/ChatPanel';
import LivePreview from '../../components/generator/LivePreview';
import ExportButton from '../../components/generator/ExportButton';
import { useGeneration } from '../../hooks/useGeneration';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Loader2, Send } from 'lucide-react';
import { TEMPLATE_PROMPT_KEY } from '../../lib/templatePrompts';

const CURRENT_SESSION_KEY = 'atelierui.currentSessionId';

export default function GeneratorPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const sessionParam = searchParams.get('session');
  const newParam = searchParams.get('new');

  if (sessionParam && localStorage.getItem(CURRENT_SESSION_KEY) !== sessionParam) {
    localStorage.setItem(CURRENT_SESSION_KEY, sessionParam);
  }

  const {
    sessionId,
    code,
    setCode,
    messages,
    isGenerating,
    error,
    generate,
    reset,
    repairFromError,
    isHydrated,
    canUndo,
    canRedo,
    undo,
    redo,
    updateThumbnail,
  } = useGeneration(sessionParam);
  const [chatVisible, setChatVisible] = useState(true);
  const [quickInput, setQuickInput] = useState('');
  const [chatWidth, setChatWidth] = useState(40); // percentage
  const [isResizing, setIsResizing] = useState(false);
  const [previewTheme, setPreviewTheme] = useState('dark');
  const [isStartingTemplate, setIsStartingTemplate] = useState(false);
  const containerRef = React.useRef(null);
  const isResettingRef = React.useRef(false);


  const hasMessages = messages.length > 0;
  const showPreview = hasMessages && (code || isGenerating);

  const startResizing = React.useCallback((e) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback((e) => {
    if (isResizing && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - containerRect.left;
      const newWidth = (relativeX / containerRect.width) * 100;
      if (newWidth > 20 && newWidth < 80) {
        setChatWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'col-resize';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizing, resize, stopResizing]);

  useEffect(() => {
    const handleReset = () => {
      isResettingRef.current = true;
      flushSync(() => {
        reset();
      });
      flushSync(() => {
        setSearchParams({}, { replace: true });
      });
      setTimeout(() => {
        isResettingRef.current = false;
      }, 0);
    };
    window.addEventListener('atelierui:reset-chat', handleReset);
    return () => window.removeEventListener('atelierui:reset-chat', handleReset);
  }, [reset, setSearchParams]);

  useEffect(() => {
    if (newParam) {
      localStorage.removeItem(CURRENT_SESSION_KEY);
      reset();
      setSearchParams({}, { replace: true });
    }
  }, [newParam, reset, setSearchParams]);

  useEffect(() => {
    if (!isHydrated || !sessionId) return;
    if (isResettingRef.current) return;
    if (sessionParam === sessionId) return;
    setSearchParams({ session: sessionId }, { replace: true });
  }, [isHydrated, sessionId, sessionParam, setSearchParams]);

  useEffect(() => {
    if (!isHydrated || isGenerating) return;
    const pendingPrompt = localStorage.getItem(TEMPLATE_PROMPT_KEY);
    if (!pendingPrompt) return;
    localStorage.removeItem(TEMPLATE_PROMPT_KEY);
    setIsStartingTemplate(true);
    generate(pendingPrompt);
  }, [generate, isGenerating, isHydrated]);

  useEffect(() => {
    if (isGenerating || messages.length > 0) {
      setIsStartingTemplate(false);
    }
  }, [isGenerating, messages.length]);

  if (!isHydrated) {
    return (
      <div className="flex h-full w-full items-center justify-center text-sm text-[color:var(--muted)]">
        Loading your session...
      </div>
    );
  }

  const handleQuickSubmit = (e) => {
    e.preventDefault();
    if (!quickInput.trim() || isGenerating) return;
    generate(quickInput.trim());
    setQuickInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuickSubmit(e);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`flex h-full w-full bg-[color:var(--bg)] relative overflow-hidden ${isResizing ? 'select-none' : ''}`}
    >
      {/* Main Chat Area */}
      <div 
        className={`flex flex-col h-full ${!isResizing ? 'transition-[width,opacity] duration-300 ease-in-out' : ''} ${showPreview && chatVisible ? 'border-r border-[color:var(--border)]' : 'w-full'} ${!chatVisible && showPreview ? 'hidden lg:flex lg:w-0 lg:border-none' : ''}`}
        style={{ width: showPreview && chatVisible ? `${chatWidth}%` : undefined }}
      >
        {error && (
          <div className="mx-4 mt-4 rounded-2xl border border-[color:var(--accent)]/30 bg-[color:var(--accent)]/10 px-4 py-3 text-sm text-[color:var(--accent)]">
            <span className="font-semibold">Generation error:</span> {error}
          </div>
        )}
        
        {!hasMessages ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            {isStartingTemplate ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 bg-[color:var(--accent)]/15 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-[color:var(--accent)] animate-spin" />
                </div>
                <p className="text-sm text-[color:var(--muted)]">Starting template...</p>
              </div>
            ) : (
              <>
                <h1 className="text-3xl font-semibold text-[color:var(--ink)] mb-8">What are you working on?</h1>
                
                <div className="w-full max-w-2xl relative">
                  <form onSubmit={handleQuickSubmit} className="relative bg-[color:var(--panel)] border border-[color:var(--border)] rounded-2xl p-2 shadow-sm focus-within:ring-1 focus-within:ring-[color:var(--muted)]">
                    <textarea
                      value={quickInput}
                      onChange={(e) => setQuickInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Describe the UI you want to build..."
                      className="w-full bg-transparent text-[color:var(--ink)] placeholder-[color:var(--muted)] resize-none outline-none min-h-[56px] max-h-[200px] py-3 px-3 overflow-y-auto"
                      rows={2}
                      disabled={isGenerating}
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={!quickInput.trim() || isGenerating}
                        className="p-2 bg-[color:var(--ink)] text-[color:var(--bg)] hover:opacity-90 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                      </button>
                    </div>
                  </form>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    {["A pricing card", "A responsive navigation bar", "A dark hero section", "A stats dashboard"].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => generate(suggestion)}
                        className="px-4 py-2 text-sm text-[color:var(--muted)] border border-[color:var(--border)] rounded-full hover:bg-[color:var(--panel)] hover:text-[color:var(--ink)] transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          /* Active Chat State */
          <div className="flex-1 overflow-hidden relative">
            <ChatPanel
              messages={messages}
              isGenerating={isGenerating}
              onGenerate={generate}
              onReset={reset}
              showInput={true}
            />
          </div>
        )}
      </div>

      {/* Resize Handle */}
      {showPreview && chatVisible && (
        <div
          onMouseDown={startResizing}
          className="absolute top-0 bottom-0 w-1.5 cursor-col-resize z-50 group hover:bg-[color:var(--accent)]/50 transition-colors hidden lg:block"
          style={{ left: `calc(${chatWidth}% - 3px)` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-8 flex items-center justify-center bg-[color:var(--panel-strong)] border border-[color:var(--border)] rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-3 bg-[color:var(--muted)] rounded-full"></div>
              <div className="w-0.5 h-3 bg-[color:var(--muted)] rounded-full"></div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Area (Canvas) */}
      <div 
        className={`h-full ${!isResizing ? 'transition-[width,opacity] duration-300 ease-in-out' : ''} bg-[#0f1117] relative ${showPreview ? (chatVisible ? 'hidden lg:block' : 'w-full') : 'w-0 hidden'}`}
        style={{ width: showPreview && chatVisible ? `${100 - chatWidth}%` : undefined }}
      >
        {isResizing && (
          <div className="absolute inset-0 z-50 bg-transparent" />
        )}
        {showPreview && (
          <LivePreview
            code={code}
            isGenerating={isGenerating}
            onError={(errorMessage) => repairFromError(errorMessage, code)}
            onChatToggle={() => setChatVisible(!chatVisible)}
            chatVisible={chatVisible}
            showChatToggle={true}
            onCodeChange={setCode}
            theme={previewTheme}
            onThemeChange={setPreviewTheme}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onThumbnail={updateThumbnail}
            headerActions={(
              <ExportButton
                code={code}
                disabled={isGenerating || !messages.length}
              />
            )}
          />
        )}
      </div>
    </div>
  );
}
