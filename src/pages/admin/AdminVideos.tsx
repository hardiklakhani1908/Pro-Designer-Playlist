import React, { useState, useEffect } from 'react';
import { useData, Video } from '../../context/DataContext';
import { Plus, Pencil, Trash2, X, Loader2 } from 'lucide-react';

export const AdminVideos = () => {
  const { videos, topics, modules, addVideo, updateVideo, deleteVideo } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [topicId, setTopicId] = useState(topics[0]?.id || '');
  const [duration, setDuration] = useState('');
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

  const resetForm = () => {
    setUrl('');
    setTitle('');
    setTopicId(topics[0]?.id || '');
    setDuration('');
    setThumbnailPreview('');
    setYoutubeId('');
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (video: Video) => {
    setUrl(video.youtube_url);
    setTitle(video.title);
    setTopicId(video.topic_id);
    setDuration(video.duration);
    setThumbnailPreview(video.thumbnail);
    setYoutubeId(video.youtube_id);
    setEditingId(video.id);
    setIsModalOpen(true);
  };

  const extractYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  useEffect(() => {
    const handleUrlChange = async () => {
      if (!url || editingId) return; // Don't auto-fetch if editing unless url changed significantly
      
      const id = extractYoutubeId(url);
      if (id && id !== youtubeId) {
        setYoutubeId(id);
        setThumbnailPreview(`https://img.youtube.com/vi/${id}/maxresdefault.jpg`);
        setIsFetchingInfo(true);
        
        try {
          // Using a proxy or cors-anywhere might be needed if oembed restricts CORS. 
          // YouTube oembed usually allows CORS for GET, but occasionally has issues.
          const res = await fetch(`https://www.youtube.com/oembed?url=${url}&format=json`);
          if (res.ok) {
            const data = await res.json();
            if (data.title && !title) {
              setTitle(data.title);
            }
          }
        } catch (error) {
          console.error("Failed to fetch youtube info", error);
        } finally {
          setIsFetchingInfo(false);
        }
      }
    };

    const debounce = setTimeout(handleUrlChange, 500);
    return () => clearTimeout(debounce);
  }, [url]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeId || !title || !topicId) return;

    if (editingId) {
      updateVideo(editingId, {
        title,
        youtube_url: url,
        youtube_id: youtubeId,
        topic_id: topicId,
        duration,
        thumbnail: thumbnailPreview
      });
    } else {
      addVideo({
        title,
        channel: "Pro Designer", // default channel name
        youtube_url: url,
        youtube_id: youtubeId,
        topic_id: topicId,
        topic: topics.find(t => t.id === topicId)?.name || '',
        duration: duration || '10:00',
        thumbnail: thumbnailPreview
      });
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this video?")) {
      deleteVideo(id);
    }
  };

  const getModuleName = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    if (!topic) return '-';
    const module = modules.find(m => m.id === topic.module_id);
    return module ? module.name : '-';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-white">Videos</h2>
          <p className="text-sm text-[#8a8f98]">Manage all your course videos.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold text-sm rounded-md hover:bg-gray-200 transition-colors"
        >
          <Plus size={16} /> Add New Video
        </button>
      </div>

      <div className="bg-[#0A0A0A] border border-[#1f1f1f] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#111] text-[#8a8f98] font-medium border-b border-[#1f1f1f]">
              <tr>
                <th className="px-4 py-3 pb-3">Thumbnail</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f1f1f]">
              {videos.map(video => (
                <tr key={video.id} className="hover:bg-[#111] transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-20 h-11 bg-[#1A1A1A] rounded-md overflow-hidden relative">
                      <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate" title={video.title}>
                    {video.title}
                  </td>
                  <td className="px-4 py-3 text-[#8a8f98]">{video.topic}</td>
                  <td className="px-4 py-3 text-[#8a8f98]">{getModuleName(video.topic_id)}</td>
                  <td className="px-4 py-3 text-[#8a8f98]">{video.duration}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => openEditModal(video)}
                        className="p-1.5 text-[#8a8f98] hover:text-white bg-[#1a1a1a] rounded hover:bg-[#333] transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(video.id)}
                        className="p-1.5 text-red-500/70 hover:text-red-500 bg-red-500/10 rounded hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {videos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#8a8f98]">
                    No videos found. Click "Add New Video" to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#0A0A0A] border border-[#1f1f1f] rounded-xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#1f1f1f]">
              <h3 className="font-semibold text-white">{editingId ? 'Edit Video' : 'Add New Video'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8a8f98] hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#8a8f98] mb-1">YouTube URL</label>
                <input 
                  type="url" 
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-md text-white text-sm focus:outline-none focus:border-gray-500"
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
              </div>

              {thumbnailPreview && (
                <div className="aspect-video w-full rounded-md overflow-hidden bg-[#111] relative border border-[#333]">
                  <img src={thumbnailPreview} className="w-full h-full object-cover" alt="Thumbnail Preview" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#8a8f98] mb-1">
                  Video Title 
                  {isFetchingInfo && <Loader2 size={12} className="inline ml-2 animate-spin text-white" />}
                </label>
                <input 
                  type="text" 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-md text-white text-sm focus:outline-none focus:border-gray-500"
                  placeholder="Video Title"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#8a8f98] mb-1">Topic</label>
                  <select 
                    value={topicId}
                    onChange={e => setTopicId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-md text-white text-sm focus:outline-none focus:border-gray-500"
                    required
                  >
                    {topics.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#8a8f98] mb-1">Duration</label>
                  <input 
                    type="text" 
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111] border border-[#333] rounded-md text-white text-sm focus:outline-none focus:border-gray-500"
                    placeholder="e.g. 15:30"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#1f1f1f] flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[#8a8f98] hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-md hover:bg-gray-200"
                >
                  {editingId ? 'Save Changes' : 'Save Video'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
