import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on navigation on mobile
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  return (
    <div className="flex bg-[#000000] text-[#f7f8f8] min-h-dvh">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

      <div className="flex-1 flex flex-col min-w-0 h-dvh">
        <header className="md:hidden h-14 border-b border-[#1f1f1f] flex items-center px-4 bg-[#0A0A0A] flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-[#8a8f98] hover:text-white p-2 -ml-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu size={20} strokeWidth={1.75} />
          </button>
          <span className="ml-2 font-semibold text-sm tracking-tight">Pro Designer</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8 md:p-10 pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
