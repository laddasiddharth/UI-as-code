import React, { useState } from 'react';
import { Plus, Settings, User, Sparkles, ChevronDown } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { templatePrompts, TEMPLATE_PROMPT_KEY } from '../../lib/templatePrompts';

const SESSION_TABLE = 'chat_sessions';

const CURRENT_SESSION_KEY = 'atelierui.currentSessionId';

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
    localStorage.removeItem(CURRENT_SESSION_KEY);
    navigate('/?new=1');
    onClose();
  };

  const handleTemplateSelect = (prompt) => {
    localStorage.setItem(TEMPLATE_PROMPT_KEY, prompt);
    localStorage.removeItem(CURRENT_SESSION_KEY);
    navigate('/?new=1');
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
        className={`fixed lg:static inset-y-0 left-0 w-[260px] bg-[color:var(--panel-strong)] z-30 transform transition-transform duration-300 ease-in-out flex flex-col h-full ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full p-3 gap-2">
          {/* Top Section */}
          <button 
            onClick={handleNewChat}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[color:var(--panel)] text-[color:var(--ink)] transition-colors w-full text-sm font-medium"
          >
            <div className="flex items-center justify-center w-7 h-7 rounded-full bg-[color:var(--ink)] text-[color:var(--bg)]">
              <Plus className="w-4 h-4" />
            </div>
            New chat
          </button>

          {/* History / Middle Section */}
          <div className="flex-1 overflow-y-auto mt-4 px-2">
            <div className="mb-4">
              <button
                onClick={() => setTemplatesOpen((prev) => !prev)}
                className="w-full flex items-center justify-between px-2 mb-2 text-xs font-medium text-[color:var(--muted)] hover:text-[color:var(--ink)]"
              >
                <span>Templates</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${templatesOpen ? 'rotate-180' : ''}`} />
              </button>
              {templatesOpen && (
                <div className="space-y-1">
                  {templatePrompts.map((template) => (
                    <button
                      key={template.title}
                      onClick={() => handleTemplateSelect(template.prompt)}
                      className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-xs transition-colors text-left text-[color:var(--muted)] hover:bg-[color:var(--panel)] hover:text-[color:var(--ink)]"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="truncate">{template.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs font-medium text-[color:var(--muted)] mb-2 px-2">Recent Chats</div>
            
            {sessions.map(session => (
              <button 
                key={session.id}
                onClick={() => { 
                  localStorage.setItem(CURRENT_SESSION_KEY, session.id);
                  navigate(`/?session=${session.id}`); 
                  onClose(); 
                }}
                className={`flex items-center gap-2 w-full px-2 py-2 rounded-lg text-sm transition-colors text-left truncate ${
                  new URLSearchParams(location.search).get('session') === session.id
                    ? 'bg-[color:var(--panel)] text-[color:var(--ink)]'
                    : 'text-[color:var(--muted)] hover:bg-[color:var(--panel)] hover:text-[color:var(--ink)]'
                }`}
              >
                <span className="truncate">{session.title || 'Untitled chat'}</span>
              </button>
            ))}


          </div>

          {/* Bottom Section */}
          <div className="pt-2 border-t border-[color:var(--border)] mt-auto flex flex-col gap-1">
            <button 
              onClick={() => { navigate('/settings'); onClose(); }}
              className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-[color:var(--panel)] text-[color:var(--ink)] text-sm transition-colors"
            >
              <Settings className="w-4 h-4 text-[color:var(--muted)]" />
              Settings
            </button>
            <div className="flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-[color:var(--panel)] text-[color:var(--ink)] text-sm transition-colors cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-[color:var(--panel)] flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-[color:var(--muted)]" />
              </div>
              <span className="truncate font-medium">User Account</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
