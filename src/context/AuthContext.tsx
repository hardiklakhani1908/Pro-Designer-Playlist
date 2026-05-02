import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  completedVideos: Record<string, boolean>;
  toggleVideoCompletion: (videoId: string) => Promise<void>;
  signOut: () => Promise<void>;
  isSupabaseConfigured: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  completedVideos: {},
  toggleVideoCompletion: async () => {},
  signOut: async () => {},
  isSupabaseConfigured: false,
  isAdmin: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedVideos, setCompletedVideos] = useState<Record<string, boolean>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setLoading(false);
      // One-time migration from old key, then load
      const legacy = localStorage.getItem('local_progress');
      if (legacy && !localStorage.getItem('pdp_progress')) {
        localStorage.setItem('pdp_progress', legacy);
        localStorage.removeItem('local_progress');
      }
      const localProgress = localStorage.getItem('pdp_progress');
      if (localProgress) {
        try {
          setCompletedVideos(JSON.parse(localProgress));
        } catch {}
      }
      setIsAdmin(localStorage.getItem('isAdmin') === 'true');
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user);
      } else {
        setCompletedVideos({});
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserData = async (currentUser: User) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('user_progress')
        .select('video_id')
        .eq('user_id', currentUser.id);
        
      if (!error && data) {
        const progressMap: Record<string, boolean> = {};
        data.forEach((row) => {
          progressMap[row.video_id] = true;
        });
        setCompletedVideos(progressMap);
      }

      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', currentUser.id)
        .single();
        
      if (!roleError && roleData) {
        setIsAdmin(roleData.role === 'admin');
      } else {
        // Fallback for mock if profile table doesn't exist yet
        setIsAdmin(localStorage.getItem('isAdmin') === 'true' || currentUser.email === 'admin@prodesigner.com' || currentUser.email === 'hardiklakhani1908@gmail.com');
      }

    } catch (e) {
      console.error('Error fetching data:', e);
    }
    setLoading(false);
  };


  const toggleVideoCompletion = async (videoId: string) => {
    const isCompleted = completedVideos[videoId];
    const newProgress = { ...completedVideos, [videoId]: !isCompleted };
    setCompletedVideos(newProgress);

    if (!user || !supabase) {
      // Local fallback
      localStorage.setItem('pdp_progress', JSON.stringify(newProgress));
      return;
    }

    try {
      if (isCompleted) {
        // Remove progress
        await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', videoId);
      } else {
        // Add progress
        await supabase
          .from('user_progress')
          .insert({ user_id: user.id, video_id: videoId });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
      // Revert on error
      setCompletedVideos(completedVideos);
    }
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, completedVideos, toggleVideoCompletion, signOut, isSupabaseConfigured, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
