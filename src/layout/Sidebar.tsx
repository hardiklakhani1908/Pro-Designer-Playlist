import React from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { LogOut, User, Menu, X, ShieldAlert } from 'lucide-react';

export const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (o: boolean) => void }) => {
  const { user, signOut, isAdmin } = useAuth();
  const { modules } = useData();
  
  return (
    <>
      {/* Mobile nav overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 bg-[#0A0A0A] border-r border-[#1f1f1f] w-64 flex flex-col z-50 transform transition-transform duration-300 md:translate-x-0 md:relative",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#1f1f1f] flex-shrink-0">
          <NavLink to="/" className="font-semibold text-sm flex items-center gap-2 text-white">
            <span className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center font-bold text-xs">P</span>
            Pro Designer
          </NavLink>
          <button className="md:hidden text-[#8a8f98] hover:text-white" onClick={() => setIsOpen(false)}>
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 text-[13px] font-medium text-[#8a8f98]">
          <NavLink to="/" className={({isActive}) => cn("px-3 py-1.5 rounded-md hover:bg-[#1f1f1f] hover:text-white transition-colors", isActive && "bg-[#1f1f1f] text-white")}>
            Home
          </NavLink>
          
          <div className="mt-4 mb-1 px-3 text-[11px] font-semibold tracking-wider text-[#5a5f68] uppercase">
            Modules
          </div>
          {modules.map(mod => (
            <NavLink 
              key={mod.id} 
              to={`/module/${mod.slug}`}
              className={({isActive}) => cn("px-3 py-1.5 rounded-md hover:bg-[#1f1f1f] hover:text-white transition-colors flex items-center gap-2", isActive && "bg-[#1f1f1f] text-white")}
            >
              <span>{mod.emoji}</span>
              {mod.name}
            </NavLink>
          ))}
          
          {isAdmin && (
            <>
              <div className="mt-6 mb-1 px-3 text-[11px] font-semibold tracking-wider text-[#5a5f68] uppercase">
                Admin
              </div>
              <NavLink 
                to="/admin"
                className={({isActive}) => cn("px-3 py-1.5 rounded-md hover:bg-yellow-500/10 hover:text-yellow-500 transition-colors flex items-center gap-2", isActive && "bg-yellow-500/10 text-yellow-500")}
              >
                <ShieldAlert size={14} />
                Admin Panel
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-[#1f1f1f] flex flex-col gap-2 flex-shrink-0">
          {user ? (
            <div className="flex items-center justify-between px-3 py-2 text-[13px] text-[#8a8f98]">
              <div className="flex items-center gap-2 overflow-hidden">
                <User size={14} />
                <span className="truncate">{user.email}</span>
              </div>
              <button onClick={signOut} className="hover:text-white transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="px-3 py-2 flex items-center gap-2 rounded-md bg-white text-black hover:bg-gray-200 transition-colors text-[13px] font-medium shadow-sm w-full justify-center">
              Sign In
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
};
