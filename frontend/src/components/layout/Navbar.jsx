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
