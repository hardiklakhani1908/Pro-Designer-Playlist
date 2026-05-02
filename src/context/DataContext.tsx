import React, { createContext, useContext, useState, useEffect } from 'react';
import { libraryData as initialData } from '../data/libraryData';

export interface Module {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  topics: string[];
}

export interface Topic {
  id: string;
  name: string;
  slug: string;
  module_id: string;
  module_name: string;
  video_count: number;
}

export interface Video {
  id: string;
  title: string;
  channel: string;
  youtube_url: string;
  youtube_id: string;
  thumbnail: string;
  topic: string;
  duration: string;
  completed?: boolean;
  topic_id: string;
  playlist_id?: string;
}

export interface Playlist {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  video_count: number;
  topic_id: string;
}

interface DataContextType {
  modules: Module[];
  topics: Topic[];
  videos: Video[];
  playlists: Playlist[];
  addVideo: (video: Omit<Video, 'id'>) => void;
  updateVideo: (id: string, video: Partial<Video>) => void;
  deleteVideo: (id: string) => void;
  updateModule: (id: string, module: Partial<Module>) => void;
  updateTopic: (id: string, topic: Partial<Topic>) => void;
  addTopic: (topic: Omit<Topic, 'id'>) => void;
  deleteTopic: (id: string) => void;
  addPlaylistWithVideos: (input: {
    playlist: Playlist;
    videos: Omit<Video, 'id'>[];
  }) => { added: boolean; reason?: string };
  deletePlaylist: (id: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<{ modules: Module[], topics: Topic[], videos: Video[], playlists: Playlist[] }>(() => {
    const fresh = {
      modules: initialData.modules,
      topics: initialData.topics,
      videos: initialData.videos as Video[],
      playlists: (initialData as { playlists?: Playlist[] }).playlists ?? [],
    };
    const saved = localStorage.getItem('app_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Stale-shape detector: reject caches that predate the playlists field
        // or were saved with fewer playlists than ship in code.
        const hasPlaylistField = Array.isArray(parsed.playlists);
        const hasEnoughPlaylists = hasPlaylistField && parsed.playlists.length >= fresh.playlists.length;
        if (hasPlaylistField && hasEnoughPlaylists) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse app_data', e);
      }
    }
    return fresh;
  });

  useEffect(() => {
    localStorage.setItem('app_data', JSON.stringify(data));
  }, [data]);

  const addVideo = (video: Omit<Video, 'id'>) => {
    const id = `vid-${Date.now()}`;
    setData(prev => {
      const topic = prev.topics.find(t => t.id === video.topic_id);
      const updatedTopics = topic 
        ? prev.topics.map(t => t.id === topic.id ? { ...t, video_count: t.video_count + 1 } : t)
        : prev.topics;

      return {
        ...prev,
        topics: updatedTopics,
        videos: [{ ...video, id, topic: topic?.name || video.topic_id }, ...prev.videos]
      };
    });
  };

  const updateVideo = (id: string, updates: Partial<Video>) => {
    setData(prev => {
      let updatedTopics = prev.topics;
      const oldVideo = prev.videos.find(v => v.id === id);
      
      // Handle topic change
      if (oldVideo && updates.topic_id && oldVideo.topic_id !== updates.topic_id) {
        const newTopic = prev.topics.find(t => t.id === updates.topic_id);
        updates.topic = newTopic?.name || updates.topic_id;
        
        updatedTopics = prev.topics.map(t => {
          if (t.id === oldVideo.topic_id) return { ...t, video_count: Math.max(0, t.video_count - 1) };
          if (t.id === updates.topic_id) return { ...t, video_count: t.video_count + 1 };
          return t;
        });
      }

      return {
        ...prev,
        topics: updatedTopics,
        videos: prev.videos.map(v => v.id === id ? { ...v, ...updates } : v)
      };
    });
  };

  const deleteVideo = (id: string) => {
    setData(prev => {
      const video = prev.videos.find(v => v.id === id);
      const updatedTopics = video 
        ? prev.topics.map(t => t.id === video.topic_id ? { ...t, video_count: Math.max(0, t.video_count - 1) } : t)
        : prev.topics;

      return {
        ...prev,
        topics: updatedTopics,
        videos: prev.videos.filter(v => v.id !== id)
      };
    });
  };

  const updateModule = (id: string, moduleUpdate: Partial<Module>) => {
    setData(prev => ({
      ...prev,
      modules: prev.modules.map(m => m.id === id ? { ...m, ...moduleUpdate } : m)
    }));
  };

  const updateTopic = (id: string, topicUpdate: Partial<Topic>) => {
    setData(prev => ({
      ...prev,
      topics: prev.topics.map(t => t.id === id ? { ...t, ...topicUpdate } : t)
    }));
  };

  const addTopic = (topic: Omit<Topic, 'id'>) => {
    const id = `top-${Date.now()}`;
    setData(prev => {
      const updatedModules = prev.modules.map(m => 
        m.id === topic.module_id ? { ...m, topics: [...m.topics, id] } : m
      );
      return {
        ...prev,
        modules: updatedModules,
        topics: [...prev.topics, { ...topic, id }]
      };
    });
  };

  const addPlaylistWithVideos = (input: {
    playlist: Playlist;
    videos: Omit<Video, 'id'>[];
  }): { added: boolean; reason?: string } => {
    let result: { added: boolean; reason?: string } = { added: true };
    setData((prev) => {
      if (prev.playlists.some((p) => p.id === input.playlist.id)) {
        result = { added: false, reason: 'A playlist with this ID is already in the library' };
        return prev;
      }
      const topic = prev.topics.find((t) => t.id === input.playlist.topic_id);
      const videos: Video[] = input.videos.map((v, idx) => ({
        ...v,
        id: `vid-${input.playlist.id}-${idx}`,
        topic: topic?.name || v.topic_id,
      }));
      const updatedTopics = topic
        ? prev.topics.map((t) =>
            t.id === topic.id ? { ...t, video_count: t.video_count + videos.length } : t
          )
        : prev.topics;
      return {
        ...prev,
        topics: updatedTopics,
        playlists: [...prev.playlists, input.playlist],
        videos: [...videos, ...prev.videos],
      };
    });
    return result;
  };

  const deletePlaylist = (id: string) => {
    setData((prev) => {
      const removed = prev.videos.filter((v) => v.playlist_id === id);
      const removedByTopic: Record<string, number> = {};
      for (const v of removed) {
        removedByTopic[v.topic_id] = (removedByTopic[v.topic_id] || 0) + 1;
      }
      const updatedTopics = prev.topics.map((t) =>
        removedByTopic[t.id]
          ? { ...t, video_count: Math.max(0, t.video_count - removedByTopic[t.id]) }
          : t
      );
      return {
        ...prev,
        topics: updatedTopics,
        playlists: prev.playlists.filter((p) => p.id !== id),
        videos: prev.videos.filter((v) => v.playlist_id !== id),
      };
    });
  };

  const deleteTopic = (id: string) => {
    setData(prev => ({
      ...prev,
      modules: prev.modules.map(m => ({
        ...m,
        topics: m.topics.filter(tId => tId !== id)
      })),
      topics: prev.topics.filter(t => t.id !== id),
      videos: prev.videos.filter(v => v.topic_id !== id)
    }));
  };

  return (
    <DataContext.Provider value={{
      modules: data.modules,
      topics: data.topics,
      videos: data.videos,
      playlists: data.playlists,
      addVideo,
      updateVideo,
      deleteVideo,
      updateModule,
      updateTopic,
      addTopic,
      deleteTopic,
      addPlaylistWithVideos,
      deletePlaylist,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};
