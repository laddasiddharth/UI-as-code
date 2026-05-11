import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Sparkles, User, Bot, Copy, Check } from 'lucide-react';

function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className={`flex gap-3 w-full min-w-0 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-[color:var(--ink)] text-[color:var(--panel-strong)]' : 'bg-[color:var(--accent)]/15 text-[color:var(--accent)]'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`min-w-0 flex-1 space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap w-full ${
          message.isError
            ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent)] border border-[color:var(--accent)]/30'
            : isUser
              ? 'bg-[color:var(--ink)] text-[color:var(--panel-strong)] rounded-tr-sm'
              : 'bg-[color:var(--panel)] border border-[color:var(--border)] text-[color:var(--ink)] rounded-tl-sm shadow-sm'
        }`}>
          {message.text}
        </div>
        {message.code && !isUser && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-[color:var(--muted)] hover:text-[color:var(--ink)] transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy code'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ChatPanel({
  messages,
  isGenerating,
  onGenerate,
  onReset,
  showInput = true,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;
    onGenerate(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const suggestions = [
    "A pricing card with 3 tiers",
    "A dark hero section with a CTA button",
    "A responsive navigation bar",
    "A stats dashboard with charts",
  ];

  return (
    <div className="flex flex-col h-full bg-transparent max-w-3xl mx-auto w-full">

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-[color:var(--accent-3)] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Sparkles className="w-6 h-6 text-[color:var(--ink)]" />
              </div>
              <h3 className="text-sm font-semibold text-[color:var(--ink)] mb-1">Describe your UI</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onGenerate(s)}
                  disabled={isGenerating}
                  className="text-left px-3 py-2.5 text-xs text-[color:var(--muted)] bg-[color:var(--panel)] hover:bg-[color:var(--accent)]/10 hover:text-[color:var(--ink)] border border-[color:var(--border)] rounded-xl transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} />
            ))}
            {isGenerating && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[color:var(--accent)]/15">
                  <Bot className="w-4 h-4 text-[color:var(--accent)]" />
                </div>
                <div className="bg-[color:var(--panel)] border border-[color:var(--border)] shadow-sm px-4 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-[color:var(--accent)] animate-spin" />
                  <span className="text-xs text-[color:var(--muted)]">Generating component...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {showInput && (
        <div className="p-4 bg-transparent flex-shrink-0 w-full max-w-3xl mx-auto relative mb-4">
          <form onSubmit={handleSubmit} className="relative bg-[color:var(--panel-strong)] border border-[color:var(--border)] rounded-2xl p-2 shadow-sm focus-within:ring-1 focus-within:ring-[color:var(--muted)]">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              rows={1}
              className="w-full bg-transparent text-[color:var(--ink)] placeholder-[color:var(--muted)] resize-none outline-none min-h-[44px] max-h-[200px] py-2.5 px-3 overflow-y-auto"
              disabled={isGenerating}
            />
            <div className="absolute right-2 bottom-2">
              <button
                type="submit"
                disabled={!input.trim() || isGenerating}
                className="p-1.5 bg-[color:var(--ink)] text-[color:var(--bg)] hover:opacity-90 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
