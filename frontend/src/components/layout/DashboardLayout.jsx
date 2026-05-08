import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children, fullscreen = false }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-[100svh] w-full bg-[color:var(--bg)] overflow-hidden">
      {/* Mobile Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[color:var(--bg)] border-b border-[color:var(--border)] flex items-center justify-between px-4 z-20">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-[color:var(--muted)] hover:text-[color:var(--ink)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <span className="font-semibold text-[color:var(--ink)]">Atelier UI</span>
        <div className="w-8"></div> {/* Spacer for centering */}
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className={`flex-1 flex flex-col min-w-0 h-full pt-14 lg:pt-0`}>
        {fullscreen ? (
          children
        ) : (
          <div className="max-w-4xl mx-auto w-full h-full p-4 lg:p-8">
            {children}
          </div>
        )}
      </main>
    </div>
  );
};

export default DashboardLayout;
