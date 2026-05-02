import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useData, Video } from '../../context/DataContext';
import { Plus, Pencil, Trash2, X, Loader2, Check } from 'lucide-react';
import { parseYouTubeUrl, isYouTubeUrl } from '../../lib/youtube';
import { canWriteToSanity, createVideo as createVideoInSanity } from '../../lib/sanity';
import { Toast, type ToastState } from '../../components/Toast';

type FormErrors = Partial<Record<'url' | 'title' | 'moduleId' | 'topicId', string>>;

interface OEmbedResponse {
  title?: string;
  author_name?: string;
  thumbnail_url?: string;
}

const initialState = {
  url: '',
  title: '',
  channel: '',
  moduleId: '',
  topicId: '',
  duration: '',
  thumbnail: '',
  youtubeId: '',
};

export const AdminVideos = () => {
  const { videos, topics, modules, addVideo, updateVideo, deleteVideo } = useData();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isFetchingMeta, setIsFetchingMeta] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const setField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const filteredTopics = useMemo(
    () => (form.moduleId ? topics.filter((t) => t.module_id === form.moduleId) : []),
    [topics, form.moduleId]
  );

  const resetForm = () => {
    setForm(initialState);
    setErrors({});
    setEditingId(null);
    setIsFetchingMeta(false);
    setHasFetched(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (video: Video) => {
    const topic = topics.find((t) => t.id === video.topic_id);
    setForm({
      url: video.youtube_url,
      title: video.title,
      channel: video.channel || '',
      moduleId: topic?.module_id || '',
      topicId: video.topic_id,
      duration: video.duration || '',
      thumbnail: video.thumbnail || '',
      youtubeId: video.youtube_id || '',
    });
    setErrors({});
    setEditingId(video.id);
    setHasFetched(Boolean(video.thumbnail));
    setIsModalOpen(true);
  };

  const handleUrlBlur = async () => {
    const trimmed = form.url.trim();
    if (!trimmed) {
      setErrors((e) => ({ ...e, url: 'YouTube URL is required' }));
      return;
    }
    if (!isYouTubeUrl(trimmed)) {
      setErrors((e) => ({ ...e, url: 'Must be a youtube.com or youtu.be link' }));
      return;
    }
    const parsed = parseYouTubeUrl(trimmed);
    if (!parsed.videoId) {
      setErrors((e) => ({ ...e, url: 'Could not find a video ID in that URL' }));
      return;
    }
    setErrors((e) => ({ ...e, url: undefined }));

    const id = parsed.videoId;
    setForm((prev) => ({
      ...prev,
      youtubeId: id,
      thumbnail: prev.thumbnail || `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    }));

    setIsFetchingMeta(true);
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(trimmed)}&format=json`
      );
      if (res.ok) {
        const data = (await res.json()) as OEmbedResponse;
        setForm((prev) => ({
          ...prev,
          title: prev.title || data.title || '',
          channel: prev.channel || data.author_name || '',
          thumbnail: data.thumbnail_url || prev.thumbnail,
        }));
        setHasFetched(true);
      }
    } catch (err) {
      console.error('oEmbed fetch failed', err);
    } finally {
      setIsFetchingMeta(false);
    }
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    const trimmed = form.url.trim();
    if (!trimmed) next.url = 'YouTube URL is required';
    else if (!isYouTubeUrl(trimmed)) next.url = 'Must be a youtube.com or youtu.be link';
    else if (!parseYouTubeUrl(trimmed).videoId) next.url = 'Could not find a video ID';

    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.moduleId) next.moduleId = 'Pick a module';
    if (!form.topicId) next.topicId = 'Pick a topic';
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setIsSaving(true);

    const topic = topics.find((t) => t.id === form.topicId);
    const payload = {
      title: form.title.trim(),
      channel: form.channel.trim() || 'Unknown',
      youtube_url: form.url.trim(),
      youtube_id: form.youtubeId,
      topic_id: form.topicId,
      topic: topic?.name || '',
      duration: form.duration.trim() || '',
      thumbnail: form.thumbnail || `https://img.youtube.com/vi/${form.youtubeId}/hqdefault.jpg`,
    };

    try {
      if (editingId) {
        updateVideo(editingId, payload);
      } else {
        addVideo(payload);
      }

      // Best-effort write to Sanity. Silent no-op if not configured.
      // The topic_id here is the local DataContext id; once Sanity holds the
      // canonical topics, swap this for the real Sanity topic _id.
      if (canWriteToSanity && !editingId) {
        try {
          await createVideoInSanity({
            title: payload.title,
            channel: payload.channel,
            youtubeUrl: payload.youtube_url,
            youtubeId: payload.youtube_id,
            thumbnail: payload.thumbnail,
            duration: payload.duration,
            topicRef: form.topicId,
          });
        } catch (err) {
          console.warn('Sanity write skipped:', err);
        }
      }

      setToast({
        message: editingId ? 'Video updated' : 'Video added',
        variant: 'success',
      });
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      setToast({
        message: 'Save failed. Check the console.',
        variant: 'error',
      });
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      deleteVideo(id);
      setToast({ message: 'Video deleted', variant: 'success' });
    }
  };

  const getModuleName = (topicId: string) => {
    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return '-';
    const m = modules.find((mm) => mm.id === topic.module_id);
    return m ? m.name : '-';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">Videos</h2>
          <p className="text-sm text-[#8a8f98]">Manage all your course videos.</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black font-semibold text-sm rounded-md hover:bg-gray-200 transition-colors"
        >
          <Plus size={16} strokeWidth={2.25} /> Add New Video
        </button>
      </div>

      <div className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0d0d0d] text-[#8a8f98] font-medium border-b border-[#1a1a1a]">
              <tr>
                <th className="px-4 py-3">Thumbnail</th>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {videos.map((video) => (
                <tr key={video.id} className="hover:bg-[#0d0d0d] transition-colors">
                  <td className="px-4 py-3">
                    <div className="w-20 h-11 bg-[#141414] rounded-md overflow-hidden">
                      {video.thumbnail ? (
                        <img src={video.thumbnail} alt="" className="w-full h-full object-cover" />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-white max-w-[220px] truncate" title={video.title}>
                    {video.title}
                  </td>
                  <td className="px-4 py-3 text-[#8a8f98]">{video.topic}</td>
                  <td className="px-4 py-3 text-[#8a8f98]">{getModuleName(video.topic_id)}</td>
                  <td className="px-4 py-3 text-[#8a8f98] tabular-nums">{video.duration || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(video)}
                        className="p-1.5 text-[#8a8f98] hover:text-white bg-[#141414] rounded hover:bg-[#1f1f1f] transition-colors"
                        aria-label="Edit"
                      >
                        <Pencil size={14} strokeWidth={1.75} />
                      </button>
                      <button
                        onClick={() => handleDelete(video.id)}
                        className="p-1.5 text-red-400/80 hover:text-red-400 bg-red-500/10 rounded hover:bg-red-500/15 transition-colors"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} strokeWidth={1.75} />
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

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => !isSaving && setIsModalOpen(false)}
          >
            <motion.div
              key="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 200, damping: 22 }}
              className="bg-[#0A0A0A] border border-[#1a1a1a] rounded-xl w-full max-w-lg shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-[#1a1a1a] flex-shrink-0">
                <h3 className="font-semibold text-white tracking-tight">
                  {editingId ? 'Edit Video' : 'Add New Video'}
                </h3>
                <button
                  onClick={() => !isSaving && setIsModalOpen(false)}
                  className="text-[#8a8f98] hover:text-white"
                  aria-label="Close"
                >
                  <X size={18} strokeWidth={1.75} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-5 overflow-y-auto">
                {/* YouTube URL */}
                <Field
                  label="YouTube URL"
                  htmlFor="yt-url"
                  required
                  error={errors.url}
                  hint="Paste a youtube.com or youtu.be link — we'll auto-fill the rest"
                >
                  <div className="relative">
                    <input
                      id="yt-url"
                      type="url"
                      value={form.url}
                      onChange={(e) => setField('url', e.target.value)}
                      onBlur={handleUrlBlur}
                      className={inputClass(errors.url)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      disabled={isSaving}
                    />
                    {isFetchingMeta && (
                      <Loader2
                        size={14}
                        className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#8a8f98]"
                      />
                    )}
                  </div>
                </Field>

                {/* Thumbnail preview */}
                <AnimatePresence initial={false}>
                  {form.thumbnail && hasFetched && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="aspect-video w-full rounded-lg overflow-hidden bg-[#0f0f0f] border border-[#1f1f1f]">
                        <img src={form.thumbnail} alt="" className="w-full h-full object-cover" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Title */}
                <Field label="Video Title" htmlFor="yt-title" required error={errors.title}>
                  {isFetchingMeta && !form.title ? (
                    <Skeleton className="h-9" />
                  ) : (
                    <input
                      id="yt-title"
                      type="text"
                      value={form.title}
                      onChange={(e) => setField('title', e.target.value)}
                      onBlur={() =>
                        setErrors((er) => ({
                          ...er,
                          title: form.title.trim() ? undefined : 'Title is required',
                        }))
                      }
                      className={inputClass(errors.title)}
                      placeholder="Auto-filled from YouTube"
                      disabled={isSaving}
                    />
                  )}
                </Field>

                {/* Channel */}
                <Field label="Channel" htmlFor="yt-channel">
                  {isFetchingMeta && !form.channel ? (
                    <Skeleton className="h-9" />
                  ) : (
                    <input
                      id="yt-channel"
                      type="text"
                      value={form.channel}
                      onChange={(e) => setField('channel', e.target.value)}
                      className={inputClass()}
                      placeholder="Auto-filled from YouTube"
                      disabled={isSaving}
                    />
                  )}
                </Field>

                {/* Module → Topic cascade */}
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Module" htmlFor="yt-module" required error={errors.moduleId}>
                    <select
                      id="yt-module"
                      value={form.moduleId}
                      onChange={(e) => {
                        setField('moduleId', e.target.value);
                        setField('topicId', '');
                        setErrors((er) => ({ ...er, moduleId: undefined, topicId: undefined }));
                      }}
                      className={selectClass(errors.moduleId)}
                      disabled={isSaving}
                    >
                      <option value="">Select module…</option>
                      {modules.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.emoji} {m.name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Topic" htmlFor="yt-topic" required error={errors.topicId}>
                    <motion.div
                      key={form.moduleId || 'none'}
                      initial={{ opacity: 0.4 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.18 }}
                    >
                      <select
                        id="yt-topic"
                        value={form.topicId}
                        onChange={(e) => {
                          setField('topicId', e.target.value);
                          setErrors((er) => ({ ...er, topicId: undefined }));
                        }}
                        className={selectClass(errors.topicId)}
                        disabled={!form.moduleId || isSaving}
                      >
                        <option value="">
                          {form.moduleId ? 'Select topic…' : 'Pick a module first'}
                        </option>
                        {filteredTopics.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.name}
                          </option>
                        ))}
                      </select>
                    </motion.div>
                  </Field>
                </div>

                {/* Duration (optional) */}
                <Field label="Duration" htmlFor="yt-duration" hint="Optional. Format: 15:30 or 1:02:45">
                  <input
                    id="yt-duration"
                    type="text"
                    value={form.duration}
                    onChange={(e) => setField('duration', e.target.value)}
                    className={inputClass()}
                    placeholder="e.g. 15:30"
                    disabled={isSaving}
                  />
                </Field>
              </form>

              <div className="px-5 py-4 border-t border-[#1a1a1a] flex justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => !isSaving && setIsModalOpen(false)}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm font-medium text-[#8a8f98] hover:text-white disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-semibold rounded-md hover:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors active:scale-[0.98]"
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Saving…
                    </>
                  ) : (
                    <>
                      <Check size={14} strokeWidth={2.5} /> {editingId ? 'Save Changes' : 'Save Video'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

// ----- helpers -----

const inputClass = (error?: string) =>
  [
    'w-full px-3 py-2 bg-[#0f0f0f] border rounded-md text-white text-sm placeholder:text-[#5a5f68] focus:outline-none transition-colors',
    error ? 'border-red-500/50 focus:border-red-500' : 'border-[#1f1f1f] focus:border-[#3a3a3a]',
  ].join(' ');

const selectClass = (error?: string) =>
  [
    'w-full px-3 py-2 bg-[#0f0f0f] border rounded-md text-white text-sm focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    error ? 'border-red-500/50 focus:border-red-500' : 'border-[#1f1f1f] focus:border-[#3a3a3a]',
  ].join(' ');

const Field: React.FC<{
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, required, error, hint, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-[12px] font-medium text-[#c8ccd1]">
      {label}
      {required && <span className="text-red-400/80">*</span>}
    </label>
    {children}
    {error ? (
      <p className="text-[11px] text-red-400/90">{error}</p>
    ) : hint ? (
      <p className="text-[11px] text-[#5a5f68]">{hint}</p>
    ) : null}
  </div>
);

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={
      'rounded-md bg-[#141414] relative overflow-hidden border border-[#1f1f1f] ' + className
    }
  >
    <div
      className="absolute inset-0"
      style={{
        background:
          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
        animation: 'pdp-shimmer 1.4s linear infinite',
      }}
    />
    <style>{`@keyframes pdp-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }`}</style>
  </div>
);
