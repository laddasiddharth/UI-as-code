import React, { useState } from 'react';
import { Plus, Settings, User, Sparkles, ChevronDown, FileCode2 } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { templatePrompts, TEMPLATE_PROMPT_KEY } from '../../lib/templatePrompts';

const SESSION_TABLE = 'chat_sessions';

const CURRENT_SESSION_KEY = 'atelierui.currentSessionId';

function createSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [templatesOpen, setTemplatesOpen] = useState(false);

  React.useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }

    let isMounted = true;
    const loadSessions = async () => {
      const { data, error } = await supabase
        .from(SESSION_TABLE)
        .select('id, title, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(20);

      if (isMounted && !error && data) {
        setSessions(data);
      }
    };

    loadSessions();

    const channel = supabase
      .channel('sidebar-sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: SESSION_TABLE, filter: `user_id=eq.${user.id}` }, loadSessions)
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleNewChat = () => {
    localStorage.removeItem(TEMPLATE_PROMPT_KEY);
    localStorage.removeItem(CURRENT_SESSION_KEY);
    window.dispatchEvent(new CustomEvent('atelierui:reset-chat'));
    navigate('/');
    onClose();
  };

  const handleTemplateSelect = (prompt) => {
    const nextSessionId = createSessionId();
    localStorage.setItem(TEMPLATE_PROMPT_KEY, prompt);
    localStorage.setItem(CURRENT_SESSION_KEY, nextSessionId);
    navigate(`/?session=${nextSessionId}`);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar container */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 w-[280px] bg-[color:var(--panel-strong)] z-50 transform transition-transform duration-300 ease-in-out flex flex-col h-full border-r border-[color:var(--border)] ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full p-4 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1rem)] gap-4">
          {/* Top Section */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-xl font-bold font-display tracking-tight text-[color:var(--ink)]">Atelier UI</span>
            <button onClick={onClose} className="lg:hidden p-1 text-[color:var(--muted)] hover:text-[color:var(--ink)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>

          <button 
            onClick={handleNewChat}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[color:var(--ink)] text-[color:var(--bg)] hover:opacity-90 transition-all w-full text-sm font-semibold shadow-lg shadow-black/20"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>

          {/* History / Middle Section - This is the scrollable part */}
          <div className="flex-1 overflow-y-auto min-h-0 -mx-2 px-2 scrollbar-thin">
            <div className="mb-6">
              <button
                onClick={() => setTemplatesOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-2 mb-3 text-xs font-bold uppercase tracking-widest text-[color:var(--muted)] hover:text-[color:var(--ink)]"
              >
                <span>Templates</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${templatesOpen ? 'rotate-180' : ''}`} />
              </button>
              {templatesOpen && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  {templatePrompts.map((template) => (
                    <button
                      key={template.title}
                      onClick={() => handleTemplateSelect(template.prompt)}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left text-[color:var(--muted)] hover:bg-[color:var(--panel)] hover:text-[color:var(--ink)] group"
                    >
                      <Sparkles className="w-4 h-4 text-[color:var(--accent)]/50 group-hover:text-[color:var(--accent)]" />
                      <span className="truncate">{template.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs font-bold uppercase tracking-widest text-[color:var(--muted)] mb-3 px-2">Recent Chats</div>
            
            <div className="space-y-1">
              {sessions.map(session => (
                <button 
                  key={session.id}
                  onClick={() => { 
                    localStorage.setItem(CURRENT_SESSION_KEY, session.id);
                    navigate(`/?session=${session.id}`); 
                    onClose(); 
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm transition-all text-left truncate group ${
                    new URLSearchParams(location.search).get('session') === session.id
                      ? 'bg-[color:var(--panel)] text-[color:var(--ink)] shadow-sm'
                      : 'text-[color:var(--muted)] hover:bg-[color:var(--panel)]/50 hover:text-[color:var(--ink)]'
                  }`}
                >
                  <FileCode2 className={`w-4 h-4 shrink-0 transition-colors ${new URLSearchParams(location.search).get('session') === session.id ? 'text-[color:var(--accent)]' : 'text-[color:var(--muted)] group-hover:text-[color:var(--ink)]'}`} />
                  <span className="truncate">{session.title || 'Untitled chat'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Bottom Section */}
          <div className="pt-4 border-t border-[color:var(--border)] mt-auto flex flex-col gap-1.5">
            <button 
              onClick={() => { navigate('/components'); onClose(); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[color:var(--panel)] text-[color:var(--ink)] text-sm transition-all"
            >
              <FileCode2 className="w-5 h-5 text-[color:var(--muted)]" />
              Components
            </button>
            <button 
              onClick={() => { navigate('/settings'); onClose(); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-[color:var(--panel)] text-[color:var(--ink)] text-sm transition-all"
            >
              <Settings className="w-5 h-5 text-[color:var(--muted)]" />
              Settings
            </button>
            
            <div className="mt-2 p-3 bg-[color:var(--panel)] rounded-2xl border border-[color:var(--border)] flex items-center gap-3 overflow-hidden shadow-sm">
              <div className="w-9 h-9 rounded-full bg-[color:var(--ink)] flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-[color:var(--bg)]" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-[color:var(--ink)] truncate">{user?.email?.split('@')[0] || 'User'}</p>
                <p className="text-[10px] text-[color:var(--muted)] truncate uppercase tracking-tighter">Pro Account</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
