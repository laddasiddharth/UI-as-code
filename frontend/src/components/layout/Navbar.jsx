import React from 'react';
import { Menu, Bell, UserCircle, Code2, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Navbar = ({ onMenuToggle }) => {
  const { signOut } = useAuth();

  return (
    <nav className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 z-10 sticky top-0">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuToggle}
          className="p-2 -ml-2 rounded-md hover:bg-gray-100 text-gray-500 lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-purple-600 to-blue-500 p-1.5 rounded-lg">
            <Code2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight text-gray-900 hidden sm:block">
            UI-as-Code
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4">
        <button className="flex items-center gap-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full transition-colors border border-purple-200">
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Upgrade</span>
        </button>
        <div className="w-px h-6 bg-gray-200 mx-1"></div>
        <button className="p-2 rounded-full hover:bg-gray-100 text-gray-500 relative transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>
        <button 
          onClick={signOut}
          className="flex items-center gap-2 p-2 rounded-full hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
