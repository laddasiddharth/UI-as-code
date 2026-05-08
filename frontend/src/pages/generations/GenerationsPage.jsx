import React from 'react';
import { MessageSquareCode } from 'lucide-react';

export default function GenerationsPage() {
  return (
    <div className="page-shell">
      <header className="page-header">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Workspace</p>
        <h1 className="font-display text-3xl sm:text-4xl text-[color:var(--ink)]">Generations</h1>
        <p className="text-sm text-[color:var(--muted)]">
          A dedicated feed for your generations will live here.
        </p>
      </header>

      <div className="ink-card rounded-3xl p-5 sm:p-6 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[color:var(--accent-2)]/15 text-[color:var(--accent-2)] flex items-center justify-center">
          <MessageSquareCode className="w-6 h-6" />
        </div>
        <div className="text-sm text-[color:var(--muted)]">
          No generations logged yet. Use the generator to start a new session.
        </div>
      </div>
    </div>
  );
}
