import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const DEFAULT_CODE = `import React from 'react';

export default function Preview() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Ready to Generate</h2>
        <p className="text-gray-500 text-sm">Describe a UI component in the chat panel to get started.</p>
      </div>
    </div>
  );
}
`;

const MAX_AUTO_FIXES = 2;

function buildFixPrompt(errorToFix, previousCode) {
  return `The previous code generated this error:\n"${errorToFix}"\n\nHere is the broken code:\n${previousCode}\n\nFix the error and return the corrected code only.`;
}

export function useGeneration() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [history, setHistory] = useState([]); // [{role, content}]
  const [messages, setMessages] = useState([]); // [{role, text, code}] for UI
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [autoFixCount, setAutoFixCount] = useState(0);
  const [lastAutoFixKey, setLastAutoFixKey] = useState('');

  const generate = useCallback(async (prompt, baasTemplate = null) => {
    setIsGenerating(true);
    setError(null);
    setAutoFixCount(0);
    setLastAutoFixKey('');

    const existingCode = code === DEFAULT_CODE ? '' : code;

    // Optimistically add user message to UI
    const userMsg = { role: 'user', text: prompt };
    setMessages(prev => [...prev, userMsg]);

    try {
      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history, baasTemplate, existingCode }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Generation failed.');
      }

      const { code: newCode } = await response.json();
      
      // Batch state updates carefully
      setCode(newCode);
      setHistory(prev => [
        ...prev,
        { role: 'user', content: prompt },
        { role: 'assistant', content: newCode },
      ]);
      setMessages(prev => [...prev, { role: 'assistant', text: 'Here\'s your generated component!', code: newCode }]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, { role: 'assistant', text: `Error: ${err.message}`, isError: true }]);
    } finally {
      setIsGenerating(false);
    }
  }, [code, history]);

  const repairFromError = useCallback(async (errorMessage, previousCode) => {
    if (!errorMessage || !previousCode || isGenerating) return;
    if (autoFixCount >= MAX_AUTO_FIXES) return;

    const autoFixKey = `${errorMessage}::${previousCode.length}`;
    if (autoFixKey === lastAutoFixKey) return;

    setIsGenerating(true);
    setError(null);
    setLastAutoFixKey(autoFixKey);

    try {
      const fixPrompt = buildFixPrompt(errorMessage, previousCode);

      const response = await fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fixPrompt, history, existingCode: previousCode }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Auto-fix failed.');
      }

      const { code: newCode } = await response.json();
      setCode(newCode);

      const newHistory = [
        ...history,
        { role: 'user', content: fixPrompt },
        { role: 'assistant', content: newCode },
      ];
      setHistory(newHistory);
    } catch (err) {
      setError(err.message);
    } finally {
      setAutoFixCount(prev => prev + 1);
      setIsGenerating(false);
    }
  }, [autoFixCount, history, isGenerating, lastAutoFixKey]);

  const reset = useCallback(() => {
    setCode(DEFAULT_CODE);
    setHistory([]);
    setMessages([]);
    setError(null);
  }, []);

  return { code, messages, isGenerating, error, generate, reset, repairFromError };
}
