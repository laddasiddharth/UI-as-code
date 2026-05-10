import React, { useEffect, useState } from 'react';
import { MessageSquareCode } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

const SESSION_TABLE = 'chat_sessions';

export default function GenerationsPage() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const loadSessions = async () => {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from(SESSION_TABLE)
        .select('id, title, updated_at, thumbnail')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (!isMounted) return;
      if (fetchError) {
        setError('Unable to load generations right now.');
        setLoading(false);
        return;
      }

      setSessions(data || []);
      setLoading(false);
    };

    loadSessions();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const formatDate = (value) => {
    if (!value) return 'Just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Just now';
    return date.toLocaleString();
  };

  return (
    <div className="page-shell">
      <header className="page-header">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Workspace</p>
        <h1 className="font-display text-3xl sm:text-4xl text-[color:var(--ink)]">Generations</h1>
        <p className="text-sm text-[color:var(--muted)]">
          A dedicated feed for your generations will live here.
        </p>
      </header>

      {loading ? (
        <div className="ink-card rounded-3xl p-5 sm:p-6 text-sm text-[color:var(--muted)]">
          Loading generations...
        </div>
      ) : error ? (
        <div className="ink-card rounded-3xl p-5 sm:p-6 text-sm text-[color:var(--accent)]">
          {error}
        </div>
      ) : sessions.length === 0 ? (
        <div className="ink-card rounded-3xl p-5 sm:p-6 flex flex-col items-center text-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[color:var(--accent-2)]/15 text-[color:var(--accent-2)] flex items-center justify-center">
            <MessageSquareCode className="w-6 h-6" />
          </div>
          <div className="text-sm text-[color:var(--muted)]">
            No generations logged yet. Use the generator to start a new session.
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {sessions.map((session) => (
            <Link
              key={session.id}
              to={`/?session=${session.id}`}
              className="ink-card rounded-3xl overflow-hidden border border-[color:var(--border)] hover:border-[color:var(--accent)]/50 transition-colors"
            >
              <div className="aspect-[16/10] bg-[color:var(--panel)]">
                {session.thumbnail ? (
                  <img src={session.thumbnail} alt={session.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-[color:var(--muted)]">
                    No preview yet
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-semibold text-[color:var(--ink)] line-clamp-1">
                  {session.title || 'Untitled session'}
                </p>
                <p className="text-xs text-[color:var(--muted)] mt-1">
                  Updated {formatDate(session.updated_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
