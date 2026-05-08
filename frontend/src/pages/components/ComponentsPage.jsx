import React from 'react';
import { FileCode2 } from 'lucide-react';

export default function ComponentsPage() {
  return (
    <div className="page-shell">
      <header className="page-header">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Assets</p>
        <h1 className="font-display text-3xl sm:text-4xl text-[color:var(--ink)]">Components</h1>
        <p className="text-sm text-[color:var(--muted)]">
          Save and organize reusable UI components here.
        </p>
      </header>

      <div className="ink-card rounded-3xl p-5 sm:p-6 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[color:var(--accent)]/10 text-[color:var(--accent)] flex items-center justify-center">
          <FileCode2 className="w-6 h-6" />
        </div>
        <div className="text-sm text-[color:var(--muted)]">
          No components saved yet. Generate a component to start building your library.
        </div>
      </div>
    </div>
  );
}
