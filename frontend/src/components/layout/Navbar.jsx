import React from 'react';
import { Menu, Bell, UserCircle, Code2, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = ({ onMenuToggle }) => {
  const { signOut } = useAuth();

  return (
    <nav className="h-16 bg-[color:var(--panel-strong)] border-b border-[color:var(--border)] flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-md hover:bg-[color:var(--panel)] text-[color:var(--muted)] lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-[color:var(--accent)]/15 p-2 rounded-xl">
            <Code2 className="w-5 h-5 text-[color:var(--accent)]" />
          </div>
          <span className="font-display text-lg tracking-tight text-[color:var(--ink)] hidden sm:block">
            Atelier UI
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        <button className="flex items-center gap-2 text-sm font-medium text-[color:var(--ink)] bg-[color:var(--accent-3)]/40 hover:bg-[color:var(--accent-3)]/70 px-3 py-1.5 rounded-full transition-colors border border-[color:var(--accent-3)]">
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Upgrade</span>
        </button>
        <div className="w-px h-6 bg-[color:var(--border)] mx-1"></div>
        <button className="p-2 rounded-full hover:bg-[color:var(--panel)] text-[color:var(--muted)] relative transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[color:var(--accent)] rounded-full border border-[color:var(--panel-strong)]"></span>
        </button>
        <button 
          onClick={signOut}
          className="flex items-center gap-2 p-2 rounded-full hover:bg-[color:var(--accent)]/10 text-[color:var(--muted)] hover:text-[color:var(--accent)] transition-colors"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
