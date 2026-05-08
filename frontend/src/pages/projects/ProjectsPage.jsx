import React from 'react';
import { FolderOpen } from 'lucide-react';

export default function ProjectsPage() {
  return (
    <div className="page-shell">
      <header className="page-header">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Workspace</p>
        <h1 className="font-display text-3xl sm:text-4xl text-[color:var(--ink)]">Projects</h1>
        <p className="text-sm text-[color:var(--muted)]">
          Your saved projects will appear here once project saving is enabled.
        </p>
      </header>

      <div className="ink-card rounded-3xl p-5 sm:p-6 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[color:var(--accent)]/10 text-[color:var(--accent)] flex items-center justify-center">
          <FolderOpen className="w-6 h-6" />
        </div>
        <div className="text-sm text-[color:var(--muted)]">
          No projects yet. Keep generating and we will surface them here.
        </div>
      </div>
    </div>
  );
}
