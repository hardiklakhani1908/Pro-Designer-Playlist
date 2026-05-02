import React from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';
import { LayoutDashboard, Video, FolderTree, Blocks, ArrowLeft } from 'lucide-react';

export const AdminLayout = () => {
  const { user, isAdmin } = useAuth();
  
  if (!isAdmin) {
    if (!user) {
      return <Navigate to="/login" />;
    }
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
        <p className="text-[#8a8f98] mb-6">You need administrator privileges to view this page.</p>
        <button 
          onClick={() => { localStorage.setItem('isAdmin', 'true'); window.location.reload(); }}
          className="px-4 py-2 bg-[#1f1f1f] text-white rounded-md text-sm font-medium hover:bg-[#333] transition-colors"
        >
          Mock Admin Access (For Testing)
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4 border-b border-[#1f1f1f] pb-4">
        <NavLink to="/" className="text-[#8a8f98] hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </NavLink>
        <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-56 flex-shrink-0">
          <nav className="flex flex-col gap-1">
            <NavLink 
              to="/admin" 
              end
              className={({isActive}) => cn(
                "px-3 py-2 rounded-md font-medium text-sm flex items-center gap-3 transition-colors",
                isActive ? "bg-white text-black" : "text-[#8a8f98] hover:bg-[#1f1f1f] hover:text-white"
              )}
            >
              <LayoutDashboard size={18} /> Dashboard
            </NavLink>
            <NavLink 
              to="/admin/videos" 
              className={({isActive}) => cn(
                "px-3 py-2 rounded-md font-medium text-sm flex items-center gap-3 transition-colors",
                isActive ? "bg-white text-black" : "text-[#8a8f98] hover:bg-[#1f1f1f] hover:text-white"
              )}
            >
              <Video size={18} /> Videos
            </NavLink>
            <NavLink 
              to="/admin/topics" 
              className={({isActive}) => cn(
                "px-3 py-2 rounded-md font-medium text-sm flex items-center gap-3 transition-colors",
                isActive ? "bg-white text-black" : "text-[#8a8f98] hover:bg-[#1f1f1f] hover:text-white"
              )}
            >
              <FolderTree size={18} /> Topics
            </NavLink>
            <NavLink 
              to="/admin/modules" 
              className={({isActive}) => cn(
                "px-3 py-2 rounded-md font-medium text-sm flex items-center gap-3 transition-colors",
                isActive ? "bg-white text-black" : "text-[#8a8f98] hover:bg-[#1f1f1f] hover:text-white"
              )}
            >
              <Blocks size={18} /> Modules
            </NavLink>
          </nav>
        </aside>
        
        <div className="flex-1 min-w-0 pb-12">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
