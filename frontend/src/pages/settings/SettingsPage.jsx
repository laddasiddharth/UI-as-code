import React from 'react';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">Account</p>
        <h1 className="font-display text-3xl sm:text-4xl text-[color:var(--ink)] mt-3">Settings</h1>
        <p className="text-sm text-[color:var(--muted)] mt-2">
          Manage your preferences and account settings here.
        </p>
      </header>

      <div className="ink-card rounded-3xl p-6 flex flex-col items-center text-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[color:var(--accent-3)]/25 text-[color:var(--ink)] flex items-center justify-center">
          <Settings className="w-6 h-6" />
        </div>
        <div className="text-sm text-[color:var(--muted)]">
          Settings controls are coming next.
        </div>
      </div>
    </div>
  );
}
