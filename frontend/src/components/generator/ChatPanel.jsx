import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, RotateCcw, Sparkles, User, Bot, AlertCircle, Copy, Check } from 'lucide-react';

function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-gray-900 text-white' : 'bg-gradient-to-tr from-purple-600 to-blue-500 text-white'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      <div className={`max-w-[85%] space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          message.isError
            ? 'bg-red-50 text-red-600 border border-red-100'
            : isUser
              ? 'bg-gray-900 text-white rounded-tr-sm'
              : 'bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm'
        }`}>
          {message.text}
        </div>
        {message.code && !isUser && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied!' : 'Copy code'}
          </button>
        )}
      </div>
    </div>
  );
}

export default function ChatPanel({ messages, isGenerating, onGenerate, onReset }) {
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
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-purple-600 to-blue-500 p-1 rounded-md">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-gray-900">AI Generator</span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors p-1.5 hover:bg-gray-100 rounded-md"
            title="New session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            New
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="space-y-4">
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800 mb-1">Describe your UI</h3>
              <p className="text-xs text-gray-500">Powered by Qwen3 Coder 480B</p>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => onGenerate(s)}
                  disabled={isGenerating}
                  className="text-left px-3 py-2.5 text-xs text-gray-600 bg-white hover:bg-purple-50 hover:text-purple-700 border border-gray-200 hover:border-purple-200 rounded-xl transition-all"
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
                <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-tr from-purple-600 to-blue-500">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-gray-100 shadow-sm px-4 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin" />
                  <span className="text-xs text-gray-500">Generating component...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a UI component..."
            rows={2}
            className="flex-1 resize-none text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all placeholder-gray-400 bg-gray-50 focus:bg-white"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center bg-gray-900 hover:bg-gray-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
        <p className="text-center text-xs text-gray-400 mt-2">Shift+Enter for new line · Enter to send</p>
      </div>
    </div>
  );
}
