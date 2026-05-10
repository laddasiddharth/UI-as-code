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
  const [snapshots, setSnapshots] = useState([]);
  const [snapshotIndex, setSnapshotIndex] = useState(-1);
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
    nextThumbnail,
  }) => {
    if (!nextSessionId || !user) return;
    const now = new Date().toISOString();
    const basePayload = {
      id: nextSessionId,
      user_id: user.id,
      updated_at: now,
      title: buildSessionTitle(nextMessages),
      code: nextCode,
      history: nextHistory,
      messages: nextMessages,
    };

    const payloadVariants = [
      ['id', 'user_id', 'updated_at', 'title', 'code', 'history', 'messages'],
      ['id', 'user_id', 'updated_at', 'title', 'code', 'history', 'messages'],
      ['id', 'user_id', 'updated_at', 'title', 'code', 'history'],
      ['id', 'user_id', 'updated_at', 'title', 'code', 'messages'],
      ['id', 'user_id', 'updated_at', 'title', 'code'],
      ['id', 'user_id', 'updated_at', 'title'],
    ];

    for (const keys of payloadVariants) {
      const payload = keys.reduce((acc, key) => {
        acc[key] = basePayload[key];
        return acc;
      }, {});

      const { error: upsertError } = await supabase
        .from(SESSION_TABLE)
        .upsert(payload, { onConflict: 'id' })
        .select();

      if (!upsertError) {
        localStorage.setItem(CURRENT_SESSION_KEY, nextSessionId);
        return;
      }

      if (upsertError.code !== 'PGRST204') {
        console.error('Failed to sync session:', JSON.stringify(upsertError, null, 2));
        return;
      }
    }

    console.error('Failed to sync session: schema is missing expected columns.');
    return;

    localStorage.setItem(CURRENT_SESSION_KEY, nextSessionId);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSessionId(null);
      setSessionCreatedAt(null);
      setCode(DEFAULT_CODE);
      setHistory([]);
      setMessages([]);
      setSnapshots([]);
      setSnapshotIndex(-1);
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
        const initialSnapshot = {
          code: preferred.code || DEFAULT_CODE,
          history: preferred.history || [],
          messages: preferred.messages || [],
          createdAt: preferred.updated_at || preferred.created_at || new Date().toISOString(),
          thumbnail: preferred.thumbnail || null,
        };
        setSnapshots([initialSnapshot]);
        setSnapshotIndex(0);
      } else {
        setSessionId(null);
        setSessionCreatedAt(null);
        setCode(DEFAULT_CODE);
        setHistory([]);
        setMessages([]);
        const initialSnapshot = {
          code: DEFAULT_CODE,
          history: [],
          messages: [],
          createdAt: new Date().toISOString(),
          thumbnail: null,
        };
        setSnapshots([initialSnapshot]);
        setSnapshotIndex(0);
      }
      setIsHydrated(true);
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [user, externalSessionId]);

  const generate = useCallback(async (prompt, baasTemplate = null) => {
    if (isGenerating) return;
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
    const shouldWarn = prompt.trim().length > 180;
    const warningMessage = {
      role: 'assistant',
      text: 'Heads up: longer prompts can take a bit more time to generate.',
    };
    const nextMessagesForUI = shouldWarn
      ? [...baseMessages, warningMessage]
      : baseMessages;
    setMessages(nextMessagesForUI);

    void upsertSession({
      nextSessionId,
      nextCreatedAt,
      nextCode: code,
      nextHistory: history,
      nextMessages: nextMessagesForUI,
    });

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
      const nextSnapshot = {
        code: newCode,
        history: nextHistory,
        messages: nextMessages,
        createdAt: new Date().toISOString(),
        thumbnail: null,
      };

      setCode(newCode);
      setHistory(nextHistory);
      setMessages(nextMessages);
      setSnapshots((prev) => {
        const base = snapshotIndex >= 0 ? prev.slice(0, snapshotIndex + 1) : [];
        const next = [...base, nextSnapshot];
        setSnapshotIndex(next.length - 1);
        return next;
      });

      await upsertSession({
        nextSessionId,
        nextCreatedAt,
        nextCode: newCode,
        nextHistory,
        nextMessages,
        nextThumbnail: null,
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
        nextThumbnail: snapshots[snapshotIndex]?.thumbnail ?? null,
      });
    } finally {
      setIsGenerating(false);
    }
  }, [code, history, isGenerating, messages, sessionCreatedAt, sessionId, snapshotIndex, snapshots, upsertSession]);

  const restoreSnapshot = useCallback(async (index) => {
    if (index < 0 || index >= snapshots.length) return;
    if (isGenerating) return;
    const snapshot = snapshots[index];
    setCode(snapshot.code || DEFAULT_CODE);
    setHistory(snapshot.history || []);
    setMessages(snapshot.messages || []);
    setSnapshotIndex(index);
    await upsertSession({
      nextSessionId: sessionId,
      nextCreatedAt: sessionCreatedAt,
      nextCode: snapshot.code || DEFAULT_CODE,
      nextHistory: snapshot.history || [],
      nextMessages: snapshot.messages || [],
      nextThumbnail: snapshot.thumbnail ?? null,
    });
  }, [isGenerating, sessionCreatedAt, sessionId, snapshots, upsertSession]);

  const undo = useCallback(() => {
    if (snapshotIndex <= 0) return;
    restoreSnapshot(snapshotIndex - 1);
  }, [restoreSnapshot, snapshotIndex]);

  const redo = useCallback(() => {
    if (snapshotIndex >= snapshots.length - 1) return;
    restoreSnapshot(snapshotIndex + 1);
  }, [restoreSnapshot, snapshotIndex, snapshots.length]);

  const updateThumbnail = useCallback(async (dataUrl) => {
    if (!dataUrl || snapshotIndex < 0) return;
    setSnapshots((prev) => {
      const next = [...prev];
      if (!next[snapshotIndex]) return prev;
      next[snapshotIndex] = { ...next[snapshotIndex], thumbnail: dataUrl };
      return next;
    });
    await upsertSession({
      nextSessionId: sessionId,
      nextCreatedAt: sessionCreatedAt,
      nextCode: code,
      nextHistory: history,
      nextMessages: messages,
      nextThumbnail: dataUrl,
    });
  }, [code, history, messages, sessionCreatedAt, sessionId, snapshotIndex, upsertSession]);

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
        nextThumbnail: snapshots[snapshotIndex]?.thumbnail ?? null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setAutoFixCount(prev => prev + 1);
      setIsGenerating(false);
    }
  }, [autoFixCount, history, isGenerating, lastAutoFixKey, messages, sessionCreatedAt, sessionId, snapshotIndex, snapshots, upsertSession]);

  const reset = useCallback(() => {
    setCode(DEFAULT_CODE);
    setHistory([]);
    setMessages([]);
    setError(null);
    setSessionId(null);
    setSessionCreatedAt(null);
    localStorage.removeItem(CURRENT_SESSION_KEY);
    const resetSnapshot = {
      code: DEFAULT_CODE,
      history: [],
      messages: [],
      createdAt: new Date().toISOString(),
      thumbnail: null,
    };
    setSnapshots([resetSnapshot]);
    setSnapshotIndex(0);
  }, []);

  const canUndo = snapshotIndex > 0;
  const canRedo = snapshotIndex >= 0 && snapshotIndex < snapshots.length - 1;

  return {
    code,
    setCode,
    messages,
    isGenerating,
    error,
    generate,
    reset,
    repairFromError,
    isHydrated,
    snapshots,
    snapshotIndex,
    canUndo,
    canRedo,
    undo,
    redo,
    restoreSnapshot,
    updateThumbnail,
  };
}
