import React from 'react';
import { Link } from 'react-router-dom';
import { libraryData as staticData } from '../data/libraryData';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { cn } from '../lib/utils';

export const Home = () => {
  const { completedVideos } = useAuth();
  const { modules, topics, videos } = useData();

  const getModuleProgress = (moduleId: string) => {
    const moduleTopics = topics.filter(t => t.module_id === moduleId).map(t => t.id);
    const moduleVideos = videos.filter(v => moduleTopics.includes(v.topic_id));
    const total = moduleVideos.length;
    const completed = moduleVideos.filter(v => completedVideos[v.id]).length;
    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);
    return { total, completed, percentage };
  };

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          {staticData.project}
        </h1>
        <p className="text-[#8a8f98] text-sm max-w-2xl leading-relaxed">
          {staticData.description}
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {modules.map(mod => {
          const progress = getModuleProgress(mod.id);
          const isCompleted = progress.total > 0 && progress.completed === progress.total;

          return (
            <Link 
              key={mod.id} 
              to={`/module/${mod.slug}`}
              className={cn(
                "group flex flex-col p-5 rounded-xl bg-[#0A0A0A] border transition-colors",
                isCompleted ? "border-[#4ade80]/30 hover:border-[#4ade80]/50" : "border-[#1f1f1f] hover:border-[#333]"
              )}
            >
              <div className="text-3xl mb-4">{mod.emoji}</div>
              <h2 className="text-lg font-semibold mb-1 group-hover:text-white text-[#f7f8f8]">
                {mod.name}
              </h2>
              <p className="text-[#8a8f98] text-xs font-medium mb-5">
                {mod.topics.length} Topics • {progress.total} Videos
              </p>
              
              <div className="mt-auto">
                <div className="w-full bg-[#1A1A1A] rounded-full h-1.5 mb-2 overflow-hidden">
                  <div 
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-500 ease-out flex-shrink-0",
                      isCompleted ? "bg-[#4ade80]" : "bg-white"
                    )}
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-[#5a5f68]">
                  <span>{progress.percentage}%</span>
                  <span>{progress.completed}/{progress.total}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
