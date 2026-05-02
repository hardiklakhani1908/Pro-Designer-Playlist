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
    <div className="flex bg-[#000000] text-[#f7f8f8] min-h-screen">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <header className="md:hidden h-14 border-b border-[#1f1f1f] flex items-center px-4 bg-[#0A0A0A] flex-shrink-0">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="text-[#8a8f98] hover:text-white"
          >
            <Menu size={20} />
          </button>
          <span className="ml-4 font-semibold text-sm">Pro Designer</span>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl p-6 md:p-10 mb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
