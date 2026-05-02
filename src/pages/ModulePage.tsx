import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { ArrowLeft, PlayCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export const ModulePage = () => {
  const { moduleSlug } = useParams();
  const { completedVideos } = useAuth();
  const { modules, topics: allTopics, videos: allVideos } = useData();
  
  const moduleData = modules.find(m => m.slug === moduleSlug);
  
  if (!moduleData) {
    return <Navigate to="/" />;
  }

  const topics = allTopics.filter(t => t.module_id === moduleData.id);

  const getTopicProgress = (topicId: string) => {
    const topicVideos = allVideos.filter(v => v.topic_id === topicId);
    const total = topicVideos.length;
    const completed = topicVideos.filter(v => completedVideos[v.id]).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percentage };
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="mb-8 flex items-center gap-4">
        <Link to="/" className="text-[#8a8f98] hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
          <span>{moduleData.emoji}</span> {moduleData.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {topics.map(topic => {
          const progress = getTopicProgress(topic.id);
          const isCompleted = progress.total > 0 && progress.completed === progress.total;

          return (
            <Link 
              key={topic.id}
              to={`/topic/${topic.slug}`}
              className={cn(
                "group flex flex-col p-5 rounded-xl bg-[#0A0A0A] border transition-all",
                isCompleted ? "border-[#4ade80]/30 hover:border-[#4ade80]/50" : "border-[#1f1f1f] hover:border-[#333] hover:bg-[#111]"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-medium text-[15px] group-hover:text-white text-[#f7f8f8]">
                  {topic.name}
                </h3>
                <PlayCircle size={18} className={cn("transition-colors", isCompleted ? "text-[#4ade80]" : "text-[#5a5f68] group-hover:text-[#8a8f98]")} />
              </div>
              
              <div className="mt-auto">
                <p className="text-xs text-[#8a8f98] mb-3">
                  {progress.total} videos
                </p>
                <div className="w-full bg-[#1A1A1A] rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500 ease-out flex-shrink-0",
                      isCompleted ? "bg-[#4ade80]" : "bg-white"
                    )}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
