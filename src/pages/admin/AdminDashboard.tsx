import React, { useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const AdminDashboard = () => {
  const { videos, topics, modules } = useData();

  const chartData = useMemo(() => {
    return modules.map(module => {
      const moduleTopicIds = topics.filter(t => t.module_id === module.id).map(t => t.id);
      const videoCount = videos.filter(v => moduleTopicIds.includes(v.topic_id)).length;
      return {
        name: module.name,
        emoji: module.emoji,
        videos: videoCount
      };
    });
  }, [videos, topics, modules]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <h2 className="text-xl font-bold text-white">Dashboard Overview</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0A0A0A] border border-[#1f1f1f] rounded-xl p-6">
          <div className="text-[#8a8f98] text-sm font-medium mb-2">Total Videos</div>
          <div className="text-4xl font-bold text-white">{videos.length}</div>
        </div>
        <div className="bg-[#0A0A0A] border border-[#1f1f1f] rounded-xl p-6">
          <div className="text-[#8a8f98] text-sm font-medium mb-2">Total Topics</div>
          <div className="text-4xl font-bold text-white">{topics.length}</div>
        </div>
        <div className="bg-[#0A0A0A] border border-[#1f1f1f] rounded-xl p-6">
          <div className="text-[#8a8f98] text-sm font-medium mb-2">Total Modules</div>
          <div className="text-4xl font-bold text-white">{modules.length}</div>
        </div>
      </div>

      <div className="bg-[#0A0A0A] border border-[#1f1f1f] rounded-xl p-6">
        <h3 className="font-semibold text-white mb-6">Videos per Module</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" stroke="#5a5f68" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#5a5f68" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip 
                cursor={{ fill: '#1f1f1f' }}
                contentStyle={{ backgroundColor: '#0A0A0A', borderColor: '#333', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="videos" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill="#ffffff" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-white mb-4">Recently Added Videos</h3>
        <div className="bg-[#0A0A0A] border border-[#1f1f1f] rounded-xl overflow-hidden">
          {videos.slice(0, 5).map((v, i) => (
            <div key={v.id} className={`flex items-center gap-4 p-4 ${i !== videos.slice(0, 5).length - 1 ? 'border-b border-[#1f1f1f]' : ''}`}>
              <div className="w-20 h-11 bg-[#1A1A1A] rounded-md overflow-hidden flex-shrink-0">
                <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white line-clamp-1">{v.title}</p>
                <p className="text-xs text-[#8a8f98]">{v.topic}</p>
              </div>
            </div>
          ))}
          {videos.length === 0 && (
            <div className="p-6 text-center text-[#8a8f98] text-sm">No videos yet</div>
          )}
        </div>
      </div>
    </div>
  );
};
