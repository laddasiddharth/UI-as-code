import React from 'react';
import { Home, Layers, Settings, FileCode2, History, MessageSquareCode, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
      active 
        ? 'bg-[color:var(--accent)]/12 text-[color:var(--accent)]' 
        : 'text-[color:var(--muted)] hover:bg-[color:var(--panel)] hover:text-[color:var(--ink)]'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-[color:var(--accent)]' : 'text-[color:var(--muted)]'}`} />
    {label}
  </button>
);

const Sidebar = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 z-20 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar container */}
      <aside 
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-[color:var(--panel-strong)] border-r border-[color:var(--border)] z-30 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          
          <div className="space-y-1">
            <h3 className="px-3 text-[0.65rem] font-semibold text-[color:var(--muted)] uppercase tracking-[0.25em] mb-2">Workspace</h3>
            <NavItem icon={Home} label="Dashboard" active={location.pathname === '/'} onClick={() => { navigate('/'); onClose(); }} />
            <NavItem icon={Sparkles} label="Generate" active={location.pathname === '/generate'} onClick={() => { navigate('/generate'); onClose(); }} />
            <NavItem icon={Layers} label="Projects" active={location.pathname === '/projects'} onClick={() => { navigate('/projects'); onClose(); }} />
            <NavItem icon={MessageSquareCode} label="Generations" active={location.pathname === '/generations'} onClick={() => { navigate('/generations'); onClose(); }} />
          </div>

          <div className="space-y-1">
            <h3 className="px-3 text-[0.65rem] font-semibold text-[color:var(--muted)] uppercase tracking-[0.25em] mb-2">Assets</h3>
            <NavItem icon={FileCode2} label="Components" active={location.pathname === '/components'} onClick={() => { navigate('/components'); onClose(); }} />
            <NavItem
              icon={History}
              label="History"
              active={location.pathname === '/history'}
              onClick={() => { navigate('/history'); onClose(); }}
            />
          </div>

        </div>

        <div className="p-4 border-t border-[color:var(--border)]">
          <NavItem icon={Settings} label="Settings" active={location.pathname === '/settings'} onClick={() => { navigate('/settings'); onClose(); }} />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
