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

  // Auth listener — sets `user`. Keep this callback synchronous: Supabase
  // recommends queueing async work elsewhere so the listener doesn't deadlock
  // the auth state machine.
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
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
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Whenever `user` changes (sign-in, sign-out, session restore), re-fetch
  // their progress + role from Supabase. The cancelled flag avoids state
  // updates from a stale fetch when the user signs out mid-flight.
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    if (!user) {
      setCompletedVideos({});
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data: progress, error: progressError } = await supabase!
          .from('user_progress')
          .select('video_id')
          .eq('user_id', user.id);
        if (cancelled) return;

        if (!progressError && progress) {
          const progressMap: Record<string, boolean> = {};
          for (const row of progress) progressMap[row.video_id] = true;
          setCompletedVideos(progressMap);
        }

        const { data: roleData, error: roleError } = await supabase!
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (cancelled) return;

        if (!roleError && roleData) {
          setIsAdmin(roleData.role === 'admin');
        } else {
          setIsAdmin(
            localStorage.getItem('isAdmin') === 'true' ||
              user.email === 'admin@prodesigner.com' ||
              user.email === 'hardiklakhani1908@gmail.com'
          );
        }
      } catch (e) {
        console.error('Error fetching user data:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  const toggleVideoCompletion = async (videoId: string) => {
    const isCompleted = completedVideos[videoId];
    const newProgress = { ...completedVideos, [videoId]: !isCompleted };
    setCompletedVideos(newProgress);

    if (!user || !supabase) {
      localStorage.setItem('pdp_progress', JSON.stringify(newProgress));
      return;
    }

    try {
      if (isCompleted) {
        await supabase
          .from('user_progress')
          .delete()
          .eq('user_id', user.id)
          .eq('video_id', videoId);
      } else {
        await supabase
          .from('user_progress')
          .insert({ user_id: user.id, video_id: videoId });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
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
