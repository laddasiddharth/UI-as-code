import React, { useState } from 'react';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children, fullscreen = false }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh w-full bg-[color:var(--bg)] overflow-hidden">
      {/* Mobile Navbar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-[color:var(--panel-strong)]/80 backdrop-blur-md border-b border-[color:var(--border)] flex items-center justify-between pt-[max(env(safe-area-inset-top),0.5rem)] pb-2 px-[max(env(safe-area-inset-left),1rem)] pr-[max(env(safe-area-inset-right),1rem)] z-40">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 text-[color:var(--muted)] hover:text-[color:var(--ink)]">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <span className="font-semibold text-[color:var(--ink)]">Atelier UI</span>
        <div className="w-8"></div> {/* Spacer for centering */}
      </div>

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="flex-1 flex flex-col min-w-0 h-full pt-14 lg:pt-0 overflow-hidden relative">
        <div className="flex-1 min-h-0 flex flex-col">
          {fullscreen ? (
            <div className="flex-1 min-h-0">
              {children}
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto px-[max(env(safe-area-inset-left),0px)] pr-[max(env(safe-area-inset-right),0px)] pb-[max(env(safe-area-inset-bottom),0px)]">
              <div className="max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
              {children}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
