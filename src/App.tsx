import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { Home } from './pages/Home';
import { ModulePage } from './pages/ModulePage';
import { TopicPage } from './pages/TopicPage';
import { PlaylistPage } from './pages/PlaylistPage';
import { Login } from './pages/Login';
import { useAuth } from './context/AuthContext';

// Admin Components
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminVideos } from './pages/admin/AdminVideos';
import { AdminTopics } from './pages/admin/AdminTopics';
import { AdminModules } from './pages/admin/AdminModules';

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/module/:moduleSlug" element={<ModulePage />} />
        <Route path="/topic/:topicSlug" element={<TopicPage />} />
        <Route path="/playlist/:playlistId" element={<PlaylistPage />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="videos" element={<AdminVideos />} />
          <Route path="topics" element={<AdminTopics />} />
          <Route path="modules" element={<AdminModules />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
}
