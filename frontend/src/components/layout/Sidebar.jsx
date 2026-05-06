import React from 'react';
import { Home, Layers, Settings, FileCode2, History, MessageSquareCode, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavItem = ({ icon: Icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      active 
        ? 'bg-purple-50 text-purple-700' 
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-purple-600' : 'text-gray-400'}`} />
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
        className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-gray-200 z-30 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
          
          <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Workspace</h3>
            <NavItem icon={Home} label="Dashboard" active={location.pathname === '/'} onClick={() => { navigate('/'); onClose(); }} />
            <NavItem icon={Sparkles} label="Generate" active={location.pathname === '/generate'} onClick={() => { navigate('/generate'); onClose(); }} />
            <NavItem icon={Layers} label="Projects" active={false} />
            <NavItem icon={MessageSquareCode} label="Generations" active={false} />
          </div>

          <div className="space-y-1">
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Assets</h3>
            <NavItem icon={FileCode2} label="Components" active={false} />
            <NavItem icon={History} label="History" active={false} />
          </div>

        </div>

        <div className="p-4 border-t border-gray-200">
          <NavItem icon={Settings} label="Settings" />
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
