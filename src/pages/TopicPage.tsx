import React, { useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { VideoModal } from '../components/VideoModal';

export const TopicPage = () => {
  const { topicSlug } = useParams();
  const { completedVideos, toggleVideoCompletion } = useAuth();
  const { modules, topics, videos: allVideos } = useData();
  const [selectedVideo, setSelectedVideo] = useState<{id: string, title: string} | null>(null);
  
  const topic = topics.find(t => t.slug === topicSlug);
  
  if (!topic) {
    return <Navigate to="/" />;
  }

  const moduleData = modules.find(m => m.id === topic.module_id);
  const videos = allVideos.filter(v => v.topic_id === topic.id);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-4 flex items-center gap-2 text-sm text-[#8a8f98]">
        {moduleData && (
          <>
            <Link to={`/module/${moduleData.slug}`} className="hover:text-white transition-colors flex items-center gap-1.5">
              <ArrowLeft size={16} />
              {moduleData.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-[#f7f8f8]">{topic.name}</span>
      </div>

      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          {topic.name}
        </h1>
        <p className="text-sm text-[#8a8f98]">
          {videos.length} {videos.length === 1 ? 'video' : 'videos'}
        </p>
      </header>

      {videos.length === 0 ? (
        <div className="py-12 text-center rounded-xl border border-dashed border-[#1f1f1f] text-[#8a8f98] text-sm">
          No videos available for this topic yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {videos.map(video => {
            const isCompleted = completedVideos[video.id];
            
            return (
              <div 
                key={video.id} 
                className={cn(
                  "group relative rounded-xl overflow-hidden bg-[#0A0A0A] border transition-all duration-300",
                  isCompleted ? "border-[#4ade80]/30" : "border-[#1f1f1f] hover:border-[#333]"
                )}
              >
                <button 
                  onClick={() => setSelectedVideo({ id: video.youtube_id, title: video.title })} 
                  className="block w-full relative aspect-video overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-[#f7f8f8] focus:ring-offset-2 focus:ring-offset-[#0A0A0A]"
                >
                  <img 
                    src={video.thumbnail} 
                    alt={video.title} 
                    className={cn(
                      "w-full h-full object-cover transition-transform duration-500 group-hover:scale-105",
                      isCompleted && "opacity-60 grayscale"
                    )}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-medium border border-white/20">
                      Play Video
                    </div>
                  </div>
                </button>
                
                <div className="p-4 flex gap-3">
                  <button 
                    onClick={() => toggleVideoCompletion(video.id)}
                    className="flex-shrink-0 mt-0.5 text-[#8a8f98] hover:text-white transition-colors"
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={18} className="text-[#4ade80]" />
                    ) : (
                      <Circle size={18} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#8a8f98] mb-1.5 truncate">
                      {video.channel}
                    </p>
                    <button 
                      onClick={() => setSelectedVideo({ id: video.youtube_id, title: video.title })}
                      className="text-left w-full hover:underline focus:outline-none"
                    >
                      <h3 className={cn(
                        "text-sm font-medium leading-snug line-clamp-2 transition-colors hover:text-white",
                        isCompleted ? "text-[#8a8f98] line-through decoration-[#8a8f98]/50" : "text-[#f7f8f8]"
                      )}>
                        {video.title}
                      </h3>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <VideoModal 
        isOpen={selectedVideo !== null} 
        onClose={() => setSelectedVideo(null)} 
        youtubeId={selectedVideo?.id || null}
        title={selectedVideo?.title || null}
      />
    </div>
  );
};
