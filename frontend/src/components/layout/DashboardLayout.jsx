import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DashboardLayout = ({ children, fullscreen = false }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="app-shell flex flex-col min-h-screen">
      <Navbar onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

      <div className="content-surface flex-1 flex overflow-hidden items-start">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        <main className={`flex-1 flex flex-col min-w-0 ${fullscreen ? 'overflow-y-auto' : 'overflow-y-auto p-5 sm:p-6 lg:p-10'}`}>
          {fullscreen ? (
            children
          ) : (
            <div className="max-w-7xl mx-auto w-full">
              {children}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
