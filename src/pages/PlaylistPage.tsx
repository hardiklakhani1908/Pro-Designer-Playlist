import React, { useMemo, useState } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Circle, ListVideo } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { VideoModal } from '../components/VideoModal';
import { Toast, type ToastState } from '../components/Toast';
import { parseYouTubeUrl, getThumbnailUrl } from '../lib/youtube';

interface SelectedMedia {
  videoId: string | null;
  playlistId: string | null;
  title: string;
}

export const PlaylistPage = () => {
  const { playlistId } = useParams();
  const navigate = useNavigate();
  const { user, completedVideos, toggleVideoCompletion } = useAuth();
  const { modules, topics, videos: allVideos, playlists } = useData();
  const [selected, setSelected] = useState<SelectedMedia | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const handleToggle = (videoId: string) => {
    if (!user) {
      setToast({
        message: 'Sign in to save your progress',
        variant: 'info',
        action: { label: 'Sign in', onClick: () => navigate('/login') },
      });
      return;
    }
    toggleVideoCompletion(videoId);
  };

  const playlist = playlists.find((p) => p.id === playlistId);
  if (!playlist) return <Navigate to="/" replace />;

  const topic = topics.find((t) => t.id === playlist.topic_id);
  const moduleData = topic ? modules.find((m) => m.id === topic.module_id) : null;
  const playlistVideos = useMemo(
    () => allVideos.filter((v) => v.playlist_id === playlist.id),
    [allVideos, playlist.id]
  );

  const watched = playlistVideos.filter((v) => completedVideos[v.id]).length;
  const percent = playlistVideos.length === 0 ? 0 : Math.round((watched / playlistVideos.length) * 100);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center gap-2 text-sm text-[#8a8f98] flex-wrap">
        {moduleData && (
          <>
            <Link to={`/module/${moduleData.slug}`} className="hover:text-white transition-colors flex items-center gap-1.5">
              <ArrowLeft size={16} strokeWidth={1.75} />
              {moduleData.name}
            </Link>
            <span className="text-[#3a3a3a]">/</span>
          </>
        )}
        {topic && (
          <>
            <Link to={`/topic/${topic.slug}`} className="hover:text-white transition-colors">
              {topic.name}
            </Link>
            <span className="text-[#3a3a3a]">/</span>
          </>
        )}
        <span className="text-[#f7f8f8] truncate">{playlist.title}</span>
      </div>

      {/* Header */}
      <header className="mb-8 md:mb-10 flex flex-col md:flex-row md:items-end gap-5 md:gap-8">
        <div className="flex-shrink-0 w-full md:w-72 aspect-video rounded-xl overflow-hidden bg-[#0f0f0f] border border-[#1a1a1a] relative">
          {playlist.thumbnail ? (
            <img src={playlist.thumbnail} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] via-[#111] to-[#0a0a0a]">
              <ListVideo size={36} className="text-[#5a5f68]" strokeWidth={1.5} />
            </div>
          )}
          <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 border border-white/10">
            <ListVideo size={11} strokeWidth={2} /> Playlist
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#5a5f68] mb-2 md:mb-3">
            {playlist.channel}
          </p>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-medium tracking-tight text-[#f7f8f8] leading-tight mb-4">
            {playlist.title}
          </h1>
          <div className="flex items-center gap-4 sm:gap-5 md:gap-6">
            <div className="flex-shrink-0">
              <div className="text-[10px] md:text-[11px] font-mono uppercase tracking-wider text-[#5a5f68] mb-1">
                Progress
              </div>
              <div className="text-base md:text-lg font-medium text-[#f7f8f8] tabular-nums">
                {watched}
                <span className="text-[#5a5f68]"> / </span>
                {playlistVideos.length}
              </div>
            </div>
            <div className="h-9 md:h-10 w-px bg-[#1a1a1a] flex-shrink-0" aria-hidden />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] md:text-[11px] font-mono uppercase tracking-wider text-[#5a5f68] mb-1.5 tabular-nums">
                {percent}%
              </div>
              <div className="w-full bg-[#141414] rounded-full h-[3px] overflow-hidden">
                <motion.div
                  className="h-[3px] rounded-full bg-[#f7f8f8]"
                  style={{ originX: 0 }}
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: percent / 100 }}
                  transition={{ type: 'spring', stiffness: 70, damping: 18, delay: 0.1 }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Video grid */}
      {playlistVideos.length === 0 ? (
        <div className="py-12 text-center rounded-xl border border-dashed border-[#1f1f1f] text-[#8a8f98] text-sm">
          No videos in this playlist yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {playlistVideos.map((video, idx) => {
            const isCompleted = completedVideos[video.id];
            const parsed = parseYouTubeUrl(video.youtube_url);
            const videoId = video.youtube_id || parsed.videoId;
            const thumbnail = getThumbnailUrl({ videoId, thumbnail: video.thumbnail });
            const open = () => {
              if (!videoId) return;
              setSelected({ videoId, playlistId: null, title: video.title });
            };

            return (
              <div
                key={video.id}
                className={cn(
                  'group relative rounded-xl overflow-hidden bg-[#0A0A0A] border transition-colors',
                  isCompleted ? 'border-[#4ade80]/30' : 'border-[#1a1a1a] hover:border-[#2a2a2a]'
                )}
              >
                <button
                  onClick={open}
                  className="block w-full relative aspect-video overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-[#f7f8f8] focus:ring-offset-2 focus:ring-offset-[#0A0A0A]"
                >
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={video.title}
                      className={cn(
                        'w-full h-full object-cover transition-transform duration-500 group-hover:scale-105',
                        isCompleted && 'opacity-60 grayscale'
                      )}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#141414]" />
                  )}
                  <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono tabular-nums border border-white/10">
                    {String(idx + 1).padStart(2, '0')}
                  </div>
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-medium border border-white/20">
                      Play Video
                    </div>
                  </div>
                </button>

                <div className="p-4 flex gap-3">
                  <button
                    onClick={() => handleToggle(video.id)}
                    className="relative flex-shrink-0 mt-0.5 text-[#8a8f98] hover:text-white transition-colors before:content-[''] before:absolute before:-inset-3"
                    aria-label={isCompleted ? 'Mark as not watched' : 'Mark as watched'}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={18} className="text-[#4ade80]" strokeWidth={1.75} />
                    ) : (
                      <Circle size={18} strokeWidth={1.75} />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase font-mono tracking-wider font-semibold text-[#5a5f68] mb-1.5 truncate tabular-nums flex items-center gap-2">
                      {video.duration && <span>{video.duration}</span>}
                      {video.duration && video.channel && <span className="text-[#2a2a2a]">·</span>}
                      <span className="truncate">{video.channel}</span>
                    </p>
                    <button
                      onClick={open}
                      className="text-left w-full hover:underline focus:outline-none"
                    >
                      <h3
                        className={cn(
                          'text-sm font-medium leading-snug line-clamp-2 transition-colors hover:text-white',
                          isCompleted ? 'text-[#8a8f98] line-through decoration-[#8a8f98]/50' : 'text-[#f7f8f8]'
                        )}
                      >
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
        isOpen={selected !== null}
        onClose={() => setSelected(null)}
        videoId={selected?.videoId || null}
        playlistId={selected?.playlistId || null}
        title={selected?.title || null}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};
