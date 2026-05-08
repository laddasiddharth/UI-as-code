import React, { useEffect, useMemo, useState } from 'react';
import { Clock, Copy, Check, FileCode2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const SESSION_TABLE = 'chat_sessions';
const CURRENT_SESSION_KEY = 'atelierui.currentSessionId';

function formatDate(value) {
  if (!value) return 'Unknown date';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown date' : date.toLocaleString();
}

function MessageItem({ message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  const messageText = message.text || message.content || '';

  const handleCopy = () => {
    if (!message.code) return;
    navigator.clipboard.writeText(message.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex gap-3 w-full min-w-0 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-[color:var(--ink)] text-[color:var(--panel-strong)]' : 'bg-[color:var(--accent)]/15 text-[color:var(--accent)]'
        }`}
      >
        {isUser ? 'U' : 'AI'}
      </div>
      <div className={`min-w-0 flex-1 space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words whitespace-pre-wrap w-full ${
            message.isError
              ? 'bg-[color:var(--accent)]/10 text-[color:var(--accent)] border border-[color:var(--accent)]/30'
              : isUser
                ? 'bg-[color:var(--ink)] text-[color:var(--panel-strong)] rounded-tr-sm'
                : 'bg-[color:var(--panel)] border border-[color:var(--border)] text-[color:var(--ink)] rounded-tl-sm shadow-sm'
          }`}
        >
          {messageText}
        </div>
        {message.code && !isUser && (
          <div className="w-full space-y-2">
            <pre className="text-xs bg-[color:var(--panel-strong)] border border-[color:var(--border)] text-[color:var(--ink)] rounded-2xl p-3 overflow-x-auto">
              <code>{message.code}</code>
            </pre>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs text-[color:var(--muted)] hover:text-[color:var(--ink)] transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy code'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setActiveId(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const load = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from(SESSION_TABLE)
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (!isMounted) return;

      if (error) {
        console.error('Failed to load sessions:', error);
        setSessions([]);
        setActiveId(null);
      } else {
        setSessions(data || []);
        setActiveId(data?.[0]?.id || null);
      }
      setLoading(false);
    };

    load();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const activeSession = useMemo(
    () => sessions.find((session) => session.id === activeId),
    [sessions, activeId]
  );

  const handleOpenSession = (sessionId) => {
    if (!sessionId) return;
    localStorage.setItem(CURRENT_SESSION_KEY, sessionId);
    navigate(`/generate?session=${sessionId}`);
  };

  return (
    <div className="page-shell pb-10">
      <header className="page-header">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Assets</p>
        <h1 className="font-display text-3xl sm:text-4xl text-[color:var(--ink)]">Chat History</h1>
        <p className="text-sm text-[color:var(--muted)]">
          Review every generation and preview all previously produced code snippets.
        </p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-6 min-w-0">
        <section className="ink-card p-4 rounded-3xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-[color:var(--ink)]">Sessions</h2>
            <span className="text-xs text-[color:var(--muted)]">{sessions.length}</span>
          </div>
          {loading ? (
            <div className="text-sm text-[color:var(--muted)] py-6 text-center">
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-sm text-[color:var(--muted)] py-6 text-center">
              No sessions saved yet.
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`w-full px-3 py-2 rounded-2xl border transition-all ${
                    activeId === session.id
                      ? 'border-[color:var(--accent)] bg-[color:var(--accent)]/10'
                      : 'border-[color:var(--border)] hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveId(session.id)}
                      className="flex items-start gap-2 flex-1 text-left"
                    >
                      <FileCode2 className="w-4 h-4 text-[color:var(--accent)] mt-0.5" />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[color:var(--ink)]">
                          {session.title || 'Untitled session'}
                        </div>
                        <div className="text-xs text-[color:var(--muted)] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(session.updated_at || session.created_at || session.updatedAt || session.createdAt)}
                        </div>
                      </div>
                    </button>
                    <button
                      onClick={() => handleOpenSession(session.id)}
                      className="text-xs font-medium text-[color:var(--accent)] hover:text-[color:var(--accent-2)] transition-colors"
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="ink-card p-6 rounded-3xl min-h-[60vh] min-w-0">
          {!activeSession ? (
            <div className="h-full flex items-center justify-center text-[color:var(--muted)]">
              Select a session to preview the full conversation.
            </div>
          ) : (
            <div className="space-y-4 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-display text-xl text-[color:var(--ink)]">
                    {activeSession.title || 'Untitled session'}
                  </h2>
                  <p className="text-xs text-[color:var(--muted)] mt-1">
                    Updated {formatDate(activeSession.updated_at || activeSession.created_at || activeSession.updatedAt || activeSession.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-[color:var(--muted)]">
                    {activeSession.messages?.length || 0} messages
                  </div>
                  <button
                    onClick={() => handleOpenSession(activeSession.id)}
                    className="text-xs font-medium text-[color:var(--accent)] hover:text-[color:var(--accent-2)] transition-colors"
                  >
                    Edit in Generator
                  </button>
                </div>
              </div>

              <div className="space-y-4 min-w-0">
                {(activeSession.messages || []).map((message, index) => (
                  <MessageItem key={`${activeSession.id}-${index}`} message={message} />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
