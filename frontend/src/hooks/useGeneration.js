import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const CURRENT_SESSION_KEY = 'atelierui.currentSessionId';
const SESSION_TABLE = 'chat_sessions';

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

function createSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function loadCurrentSessionId() {
  return localStorage.getItem(CURRENT_SESSION_KEY);
}

function buildSessionTitle(messages) {
  const firstUser = messages.find((message) => message.role === 'user');
  if (!firstUser?.text) return 'Untitled session';
  return firstUser.text.length > 52 ? `${firstUser.text.slice(0, 52)}...` : firstUser.text;
}

function buildFixPrompt(errorToFix, previousCode) {
  return `The previous code generated this error:\n"${errorToFix}"\n\nHere is the broken code:\n${previousCode}\n\nFix the error and return the corrected code only.`;
}

export function useGeneration(externalSessionId = null) {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState(null);
  const [sessionCreatedAt, setSessionCreatedAt] = useState(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [autoFixCount, setAutoFixCount] = useState(0);
  const [lastAutoFixKey, setLastAutoFixKey] = useState('');

  const upsertSession = useCallback(async ({
    nextSessionId,
    nextCreatedAt,
    nextCode,
    nextHistory,
    nextMessages,
  }) => {
    if (!nextSessionId || !user) return;
    const now = new Date().toISOString();
    const payload = {
      id: nextSessionId,
      user_id: user.id,
      created_at: nextCreatedAt || now,
      updated_at: now,
      title: buildSessionTitle(nextMessages),
      code: nextCode,
      history: nextHistory,
      messages: nextMessages,
    };

    const { error: upsertError } = await supabase
      .from(SESSION_TABLE)
      .upsert(payload, { onConflict: 'id' })
      .select();

    if (upsertError) {
      console.error('Failed to sync session:', upsertError);
      return;
    }

    localStorage.setItem(CURRENT_SESSION_KEY, nextSessionId);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSessionId(null);
      setSessionCreatedAt(null);
      setCode(DEFAULT_CODE);
      setHistory([]);
      setMessages([]);
      setIsHydrated(false);
      return;
    }

    let isMounted = true;
    const load = async () => {
      const { data, error: fetchError } = await supabase
        .from(SESSION_TABLE)
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (!isMounted) return;
      if (fetchError) {
        console.error('Failed to load sessions:', fetchError);
        setIsHydrated(true);
        return;
      }

      const list = data || [];

      const storedId = externalSessionId || loadCurrentSessionId();
      const preferred = list.find((session) => session.id === storedId);

      if (preferred) {
        setSessionId(preferred.id);
        setSessionCreatedAt(preferred.created_at || preferred.createdAt || null);
        setCode(preferred.code || DEFAULT_CODE);
        setHistory(preferred.history || []);
        setMessages(preferred.messages || []);
      } else {
        setSessionId(null);
        setSessionCreatedAt(null);
        setCode(DEFAULT_CODE);
        setHistory([]);
        setMessages([]);
      }
      setIsHydrated(true);
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [user, externalSessionId]);

  const generate = useCallback(async (prompt, baasTemplate = null) => {
    const nextSessionId = sessionId || createSessionId();
    const nextCreatedAt = sessionCreatedAt || new Date().toISOString();
    if (!sessionId) {
      setSessionId(nextSessionId);
      setSessionCreatedAt(nextCreatedAt);
    }
    setIsGenerating(true);
    setError(null);
    setAutoFixCount(0);
    setLastAutoFixKey('');

    const existingCode = code === DEFAULT_CODE ? '' : code;
    const baseMessages = [...messages, { role: 'user', text: prompt }];
    setMessages(baseMessages);

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
      
      const nextHistory = [
        ...history,
        { role: 'user', content: prompt },
        { role: 'assistant', content: newCode },
      ];
      const nextMessages = [...baseMessages, { role: 'assistant', text: "Here's your generated component!", code: newCode }];

      setCode(newCode);
      setHistory(nextHistory);
      setMessages(nextMessages);

      await upsertSession({
        nextSessionId,
        nextCreatedAt,
        nextCode: newCode,
        nextHistory,
        nextMessages,
      });
    } catch (err) {
      const nextMessages = [...baseMessages, { role: 'assistant', text: `Error: ${err.message}`, isError: true }];
      setError(err.message);
      setMessages(nextMessages);

      await upsertSession({
        nextSessionId,
        nextCreatedAt,
        nextCode: code,
        nextHistory: history,
        nextMessages,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [code, history, messages, sessionCreatedAt, sessionId, upsertSession]);

  const repairFromError = useCallback(async (errorMessage, previousCode) => {
    if (!errorMessage || !previousCode || isGenerating || autoFixCount >= MAX_AUTO_FIXES) return;

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

      if (!response.ok) throw new Error('Auto-fix failed.');

      const { code: newCode } = await response.json();
      const nextHistory = [...history, { role: 'user', content: fixPrompt }, { role: 'assistant', content: newCode }];

      setCode(newCode);
      setHistory(nextHistory);

      await upsertSession({
        nextSessionId: sessionId,
        nextCreatedAt: sessionCreatedAt,
        nextCode: newCode,
        nextHistory,
        nextMessages: messages,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setAutoFixCount(prev => prev + 1);
      setIsGenerating(false);
    }
  }, [autoFixCount, history, isGenerating, lastAutoFixKey, messages, sessionCreatedAt, sessionId, upsertSession]);

  const reset = useCallback(() => {
    setCode(DEFAULT_CODE);
    setHistory([]);
    setMessages([]);
    setError(null);
    setSessionId(null);
    setSessionCreatedAt(null);
    localStorage.removeItem(CURRENT_SESSION_KEY);
  }, []);

  return { code, setCode, messages, isGenerating, error, generate, reset, repairFromError };
}
