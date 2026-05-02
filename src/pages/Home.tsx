import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Check, ArrowUpRight, Play } from 'lucide-react';
import { libraryData as staticData } from '../data/libraryData';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { cn } from '../lib/utils';
import { ProgressArc } from '../components/ProgressArc';
import { getModuleAccent, deriveStatus, motivationalLabel } from '../lib/modules';

const cardEnter = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 110, damping: 20 } },
};

const listEnter = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

export const Home = () => {
  const { completedVideos } = useAuth();
  const { modules, topics, videos } = useData();

  const overall = useMemo(() => {
    const total = videos.length;
    const watched = videos.filter((v) => completedVideos[v.id]).length;
    const percent = total === 0 ? 0 : Math.round((watched / total) * 100);
    return { total, watched, percent };
  }, [videos, completedVideos]);

  const getModuleStats = (moduleId: string) => {
    const moduleTopics = topics.filter((t) => t.module_id === moduleId);
    const moduleTopicIds = moduleTopics.map((t) => t.id);
    const moduleVideos = videos.filter((v) => moduleTopicIds.includes(v.topic_id));
    const total = moduleVideos.length;
    const completed = moduleVideos.filter((v) => completedVideos[v.id]).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    const topicsWithCompletion = moduleTopics.map((t) => {
      const tVideos = moduleVideos.filter((v) => v.topic_id === t.id);
      const allDone = tVideos.length > 0 && tVideos.every((v) => completedVideos[v.id]);
      return { topic: t, allDone };
    });
    const topicsTotal = moduleTopics.length;
    const topicsDone = topicsWithCompletion.filter((t) => t.allDone).length;

    const nextVideo = moduleVideos.find((v) => !completedVideos[v.id]) ?? null;

    return { total, completed, percent, topicsTotal, topicsDone, nextVideo };
  };

  return (
    <div>
      {/* HERO */}
      <motion.section
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 90, damping: 20 }}
        className="mb-14"
      >
        <div className="flex flex-col-reverse md:flex-row md:items-center md:justify-between gap-8 md:gap-12">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#5a5f68] mb-4">
              {staticData.project}
            </p>
            <h1 className="text-3xl md:text-5xl font-medium tracking-tight leading-[1.05] text-[#f7f8f8] mb-5 max-w-[18ch]">
              {motivationalLabel(overall.percent)}.
            </h1>
            <p className="text-[15px] text-[#8a8f98] leading-relaxed max-w-[58ch]">
              {staticData.description}
            </p>

            <div className="mt-8 flex items-center gap-8">
              <Stat label="Watched" value={`${overall.watched}`} />
              <Divider />
              <Stat label="Total videos" value={`${overall.total}`} />
              <Divider />
              <Stat label="Modules" value={`${modules.length}`} />
            </div>
          </div>

          <div className="relative flex-shrink-0">
            <ProgressArc percent={overall.percent} size={184} strokeWidth={10} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-medium tracking-tight text-[#f7f8f8] tabular-nums">
                {overall.percent}
                <span className="text-xl text-[#5a5f68] font-normal">%</span>
              </div>
              <div className="mt-1 text-[11px] font-mono uppercase tracking-wider text-[#5a5f68] tabular-nums">
                {overall.watched} / {overall.total}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* MODULES */}
      <div className="mb-5 flex items-baseline justify-between">
        <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-[#5a5f68]">
          Modules
        </h2>
        <span className="text-[11px] text-[#5a5f68] font-mono tabular-nums">
          {modules.length.toString().padStart(2, '0')}
        </span>
      </div>

      <motion.div
        variants={listEnter}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {modules.map((mod) => {
          const stats = getModuleStats(mod.id);
          const status = deriveStatus(stats.completed, stats.total);
          const { accent, tint } = getModuleAccent(mod.id);

          return (
            <motion.div key={mod.id} variants={cardEnter}>
              <Link
                to={`/module/${mod.slug}`}
                className={cn(
                  'group relative flex flex-col h-full rounded-xl bg-[#0A0A0A] border transition-colors overflow-hidden',
                  status === 'completed'
                    ? 'border-[#1f1f1f] hover:border-[#2a2a2a]'
                    : 'border-[#1a1a1a] hover:border-[#2a2a2a]'
                )}
                style={
                  status === 'completed'
                    ? { boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04), 0 0 0 1px ${tint}` }
                    : undefined
                }
              >
                {/* Module accent spine */}
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-0 top-3 bottom-3 w-[3px] rounded-full transition-opacity',
                    status === 'not-started' ? 'opacity-30' : 'opacity-100'
                  )}
                  style={{ background: accent }}
                />

                <div className="p-5 pl-6 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-2xl leading-none" aria-hidden>
                      {mod.emoji}
                    </div>
                    <StatusPill status={status} accent={accent} />
                  </div>

                  <h3 className="text-[15px] font-semibold text-[#f7f8f8] tracking-tight mb-1.5">
                    {mod.name}
                  </h3>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#5a5f68] tabular-nums mb-4">
                    {stats.topicsDone}/{stats.topicsTotal} topics · {stats.total} videos
                  </p>

                  {/* Next video pointer */}
                  {stats.nextVideo && status !== 'completed' && (
                    <div className="mb-4 px-3 py-2 rounded-md bg-[#0f0f0f] border border-[#161616] flex items-start gap-2">
                      <Play
                        size={11}
                        strokeWidth={2}
                        className="mt-0.5 flex-shrink-0 text-[#8a8f98]"
                        fill="#8a8f98"
                      />
                      <div className="min-w-0">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-[#5a5f68] mb-0.5">
                          Up next
                        </div>
                        <div className="text-[12px] text-[#c8ccd1] leading-snug line-clamp-2">
                          {stats.nextVideo.title}
                        </div>
                      </div>
                    </div>
                  )}

                  {status === 'completed' && (
                    <div className="mb-4 px-3 py-2 rounded-md bg-[#0f0f0f] border border-[#161616] flex items-center gap-2">
                      <Check size={12} strokeWidth={2.5} style={{ color: accent }} />
                      <span className="text-[12px] text-[#c8ccd1]">All videos watched</span>
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="mt-auto">
                    <div className="w-full bg-[#141414] rounded-full h-[3px] mb-2 overflow-hidden">
                      <motion.div
                        className="h-[3px] rounded-full"
                        style={{ background: accent, originX: 0 }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: stats.percent / 100 }}
                        transition={{ type: 'spring', stiffness: 70, damping: 18, delay: 0.25 }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-mono tabular-nums">
                      <span className="text-[#8a8f98]">{stats.percent}%</span>
                      <span className="flex items-center gap-1 text-[#5a5f68] group-hover:text-[#8a8f98] transition-colors">
                        Open <ArrowUpRight size={11} strokeWidth={2} />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <div className="text-2xl font-medium tracking-tight text-[#f7f8f8] tabular-nums">{value}</div>
    <div className="text-[10px] font-mono uppercase tracking-wider text-[#5a5f68] mt-0.5">
      {label}
    </div>
  </div>
);

const Divider = () => <span aria-hidden className="h-8 w-px bg-[#1a1a1a]" />;

const StatusPill: React.FC<{ status: 'not-started' | 'in-progress' | 'completed'; accent: string }> = ({
  status,
  accent,
}) => {
  if (status === 'completed') {
    return (
      <div
        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider"
        style={{ color: accent, background: 'rgba(255,255,255,0.02)', border: `1px solid ${accent}33` }}
      >
        <Check size={10} strokeWidth={2.5} /> Done
      </div>
    );
  }
  if (status === 'in-progress') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider text-[#c8ccd1] bg-white/[0.03] border border-[#1f1f1f]">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full"
          style={{ background: accent }}
          aria-hidden
        />
        In progress
      </div>
    );
  }
  return (
    <div className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider text-[#5a5f68] border border-[#1a1a1a]">
      Not started
    </div>
  );
};
