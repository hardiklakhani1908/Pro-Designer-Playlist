import React, { useMemo, useState } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, CheckCircle2, Circle, ListVideo, ArrowUpRight } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { VideoModal } from '../components/VideoModal';
import { parseYouTubeUrl, getThumbnailUrl } from '../lib/youtube';

interface SelectedMedia {
  videoId: string | null;
  playlistId: string | null;
  title: string;
}

export const TopicPage = () => {
  const { topicSlug } = useParams();
  const { completedVideos, toggleVideoCompletion } = useAuth();
  const { modules, topics, videos: allVideos, playlists } = useData();
  const [selectedVideo, setSelectedVideo] = useState<SelectedMedia | null>(null);

  const topic = topics.find((t) => t.slug === topicSlug);
  if (!topic) return <Navigate to="/" />;

  const moduleData = modules.find((m) => m.id === topic.module_id);

  const { soloVideos, topicPlaylists } = useMemo(() => {
    const inTopic = allVideos.filter((v) => v.topic_id === topic.id);
    const solo = inTopic.filter((v) => !v.playlist_id);
    const lists = playlists.filter((p) => p.topic_id === topic.id);
    return { soloVideos: solo, topicPlaylists: lists };
  }, [allVideos, playlists, topic.id]);

  const totalCount = useMemo(
    () => soloVideos.length + topicPlaylists.reduce((sum, p) => sum + p.video_count, 0),
    [soloVideos, topicPlaylists]
  );

  return (
    <div>
      <div className="mb-4 flex items-center gap-2 text-sm text-[#8a8f98]">
        {moduleData && (
          <>
            <Link to={`/module/${moduleData.slug}`} className="hover:text-white transition-colors flex items-center gap-1.5">
              <ArrowLeft size={16} strokeWidth={1.75} />
              {moduleData.name}
            </Link>
            <span className="text-[#3a3a3a]">/</span>
          </>
        )}
        <span className="text-[#f7f8f8]">{topic.name}</span>
      </div>

      <header className="mb-8">
        <h1 className="text-2xl md:text-3xl font-medium tracking-tight mb-2 text-[#f7f8f8]">
          {topic.name}
        </h1>
        <p className="text-sm text-[#8a8f98] tabular-nums">
          {totalCount} {totalCount === 1 ? 'video' : 'videos'}
          {topicPlaylists.length > 0 && (
            <span className="text-[#5a5f68]">
              {' '}· {topicPlaylists.length} {topicPlaylists.length === 1 ? 'playlist' : 'playlists'}
            </span>
          )}
        </p>
      </header>

      {soloVideos.length === 0 && topicPlaylists.length === 0 && (
        <div className="py-12 text-center rounded-xl border border-dashed border-[#1f1f1f] text-[#8a8f98] text-sm">
          No videos available for this topic yet.
        </div>
      )}

      {/* Playlists */}
      {topicPlaylists.length > 0 && (
        <section className="mb-12">
          <SectionHeader label="Playlists" count={topicPlaylists.length} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {topicPlaylists.map((playlist) => {
              const videosInList = allVideos.filter((v) => v.playlist_id === playlist.id);
              const watched = videosInList.filter((v) => completedVideos[v.id]).length;
              const total = videosInList.length || playlist.video_count;
              const percent = total === 0 ? 0 : Math.round((watched / total) * 100);
              const isComplete = total > 0 && watched === total;

              return (
                <Link
                  key={playlist.id}
                  to={`/playlist/${playlist.id}`}
                  className="group relative block"
                >
                  {/* Stacked card backdrops to telegraph multiple items */}
                  <span
                    aria-hidden
                    className="absolute -bottom-1.5 left-2 right-2 h-2 rounded-b-xl bg-[#0a0a0a] border border-[#1a1a1a] border-t-0"
                  />
                  <span
                    aria-hidden
                    className="absolute -bottom-3 left-4 right-4 h-2 rounded-b-xl bg-[#080808] border border-[#1a1a1a] border-t-0"
                  />

                  <div
                    className={cn(
                      'relative rounded-xl overflow-hidden bg-[#0A0A0A] border transition-colors',
                      isComplete ? 'border-[#4ade80]/30' : 'border-[#1a1a1a] group-hover:border-[#2a2a2a]'
                    )}
                  >
                    <div className="relative aspect-video overflow-hidden bg-[#141414]">
                      {playlist.thumbnail ? (
                        <img
                          src={playlist.thumbnail}
                          alt=""
                          className={cn(
                            'w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]',
                            isComplete && 'opacity-60'
                          )}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a1a1a] via-[#111] to-[#0a0a0a]">
                          <ListVideo size={36} className="text-[#5a5f68]" strokeWidth={1.5} />
                        </div>
                      )}

                      <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 border border-white/10">
                        <ListVideo size={11} strokeWidth={2} /> Playlist
                      </div>

                      <div className="absolute top-2 right-2 px-2 py-1 rounded-md bg-black/70 backdrop-blur-sm text-white text-[10px] font-mono tabular-nums border border-white/10">
                        {total} videos
                      </div>

                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-medium border border-white/20 flex items-center gap-1.5">
                          Open Playlist <ArrowUpRight size={12} strokeWidth={2} />
                        </div>
                      </div>
                    </div>

                    <div className="p-4">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-[#5a5f68] mb-1.5 truncate">
                        {playlist.channel || '—'}
                      </p>
                      <h3 className="text-sm font-medium text-[#f7f8f8] leading-snug line-clamp-2 mb-3 group-hover:text-white transition-colors">
                        {playlist.title}
                      </h3>

                      <div className="w-full bg-[#141414] rounded-full h-[3px] mb-2 overflow-hidden">
                        <motion.div
                          className={cn('h-[3px] rounded-full', isComplete ? 'bg-[#4ade80]' : 'bg-[#f7f8f8]')}
                          style={{ originX: 0 }}
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: percent / 100 }}
                          transition={{ type: 'spring', stiffness: 80, damping: 18 }}
                        />
                      </div>
                      <div className="flex justify-between items-center text-[11px] font-mono tabular-nums">
                        <span className="text-[#8a8f98]">{percent}%</span>
                        <span className="text-[#5a5f68]">
                          {watched} / {total} watched
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Solo videos */}
      {soloVideos.length > 0 && (
        <section>
          {topicPlaylists.length > 0 && <SectionHeader label="Videos" count={soloVideos.length} />}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {soloVideos.map((video) => {
              const isCompleted = completedVideos[video.id];
              const parsed = parseYouTubeUrl(video.youtube_url);
              const videoId = video.youtube_id || parsed.videoId;
              const thumbnail = getThumbnailUrl({ videoId, thumbnail: video.thumbnail });
              const open = () => {
                if (!videoId) return;
                setSelectedVideo({ videoId, playlistId: null, title: video.title });
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
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-medium border border-white/20">
                        Play Video
                      </div>
                    </div>
                  </button>

                  <div className="p-4 flex gap-3">
                    <button
                      onClick={() => toggleVideoCompletion(video.id)}
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
                      <button onClick={open} className="text-left w-full hover:underline focus:outline-none">
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
        </section>
      )}

      <VideoModal
        isOpen={selectedVideo !== null}
        onClose={() => setSelectedVideo(null)}
        videoId={selectedVideo?.videoId || null}
        playlistId={selectedVideo?.playlistId || null}
        title={selectedVideo?.title || null}
      />
    </div>
  );
};

const SectionHeader: React.FC<{ label: string; count: number }> = ({ label, count }) => (
  <div className="mb-5 flex items-baseline justify-between">
    <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-[#5a5f68]">{label}</h2>
    <span className="text-[11px] text-[#5a5f68] font-mono tabular-nums">
      {count.toString().padStart(2, '0')}
    </span>
  </div>
);
