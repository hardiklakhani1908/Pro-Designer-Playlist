import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { LogOut, User, X, ShieldAlert, Check } from 'lucide-react';
import { getModuleAccent, deriveStatus } from '../lib/modules';

export const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (o: boolean) => void }) => {
  const { user, signOut, isAdmin, completedVideos } = useAuth();
  const { modules, topics, videos } = useData();

  const moduleProgress = useMemo(() => {
    const map: Record<string, { completed: number; total: number; percent: number }> = {};
    for (const mod of modules) {
      const topicIds = topics.filter((t) => t.module_id === mod.id).map((t) => t.id);
      const moduleVideos = videos.filter((v) => topicIds.includes(v.topic_id));
      const total = moduleVideos.length;
      const completed = moduleVideos.filter((v) => completedVideos[v.id]).length;
      const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
      map[mod.id] = { completed, total, percent };
    }
    return map;
  }, [modules, topics, videos, completedVideos]);

  return (
    <>
      {/* Mobile nav overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 bg-[#0A0A0A] border-r border-[#1a1a1a] w-64 flex flex-col z-50 transform transition-transform duration-300 md:translate-x-0 md:relative',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="h-14 px-4 flex items-center justify-between border-b border-[#1a1a1a] flex-shrink-0">
          <NavLink to="/" className="font-semibold text-[13px] flex items-center gap-2 text-white tracking-tight">
            <span className="w-6 h-6 rounded-md bg-white text-black flex items-center justify-center font-bold text-[11px]">
              P
            </span>
            Pro Designer
          </NavLink>
          <button
            className="md:hidden text-[#8a8f98] hover:text-white"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-0.5 text-[13px] text-[#8a8f98]">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              cn(
                'relative px-3 py-1.5 rounded-md transition-colors',
                isActive
                  ? 'bg-white/[0.04] text-white'
                  : 'hover:bg-white/[0.03] hover:text-white'
              )
            }
          >
            {({ isActive }) => (
              <span className="flex items-center gap-2">
                {isActive && (
                  <span className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full bg-white" aria-hidden />
                )}
                Home
              </span>
            )}
          </NavLink>

          <div className="mt-5 mb-2 px-3 text-[10px] font-mono font-semibold tracking-[0.18em] text-[#5a5f68] uppercase">
            Modules
          </div>

          {modules.map((mod) => {
            const stats = moduleProgress[mod.id];
            const status = deriveStatus(stats?.completed ?? 0, stats?.total ?? 0);
            const { accent } = getModuleAccent(mod.id);

            return (
              <NavLink
                key={mod.id}
                to={`/module/${mod.slug}`}
                className={({ isActive }) =>
                  cn(
                    'relative pl-3 pr-3 py-1.5 rounded-md transition-colors flex items-center gap-2',
                    isActive
                      ? 'bg-white/[0.04] text-white'
                      : 'hover:bg-white/[0.03] hover:text-[#e7e8ea]'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <span
                        className="absolute left-0 top-2 bottom-2 w-[2px] rounded-full"
                        style={{ background: accent }}
                        aria-hidden
                      />
                    )}
                    <span aria-hidden className="text-base leading-none">
                      {mod.emoji}
                    </span>
                    <span className="flex-1 truncate">{mod.name}</span>
                    <ProgressIndicator status={status} percent={stats?.percent ?? 0} accent={accent} />
                  </>
                )}
              </NavLink>
            );
          })}

          {isAdmin && (
            <>
              <div className="mt-6 mb-2 px-3 text-[10px] font-mono font-semibold tracking-[0.18em] text-[#5a5f68] uppercase">
                Admin
              </div>
              <NavLink
                to="/admin"
                className={({ isActive }) =>
                  cn(
                    'px-3 py-1.5 rounded-md transition-colors flex items-center gap-2',
                    isActive
                      ? 'bg-yellow-500/10 text-yellow-500'
                      : 'hover:bg-yellow-500/10 hover:text-yellow-500'
                  )
                }
              >
                <ShieldAlert size={14} strokeWidth={1.75} />
                Admin Panel
              </NavLink>
            </>
          )}
        </nav>

        <div className="p-3 border-t border-[#1a1a1a] flex flex-col gap-2 flex-shrink-0">
          {user ? (
            <div className="flex items-center justify-between px-3 py-2 text-[12px] text-[#8a8f98]">
              <div className="flex items-center gap-2 overflow-hidden">
                <User size={14} strokeWidth={1.75} />
                <span className="truncate">{user.email}</span>
              </div>
              <button
                onClick={signOut}
                className="hover:text-white transition-colors"
                aria-label="Sign out"
              >
                <LogOut size={14} strokeWidth={1.75} />
              </button>
            </div>
          ) : (
            <NavLink
              to="/login"
              className="px-3 py-2 flex items-center gap-2 rounded-md bg-white text-black hover:bg-gray-200 transition-colors text-[13px] font-medium w-full justify-center"
            >
              Sign In
            </NavLink>
          )}
        </div>
      </aside>
    </>
  );
};

const ProgressIndicator: React.FC<{
  status: 'not-started' | 'in-progress' | 'completed';
  percent: number;
  accent: string;
}> = ({ status, percent, accent }) => {
  if (status === 'completed') {
    return (
      <span
        className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: accent }}
        aria-label="Completed"
      >
        <Check size={9} strokeWidth={3} className="text-black" />
      </span>
    );
  }
  if (status === 'in-progress') {
    const radius = 5;
    const circ = 2 * Math.PI * radius;
    const offset = circ * (1 - percent / 100);
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" className="-rotate-90 flex-shrink-0" aria-label={`${percent}% complete`}>
        <circle cx="7" cy="7" r={radius} stroke="#1f1f1f" strokeWidth="1.5" fill="none" />
        <circle
          cx="7"
          cy="7"
          r={radius}
          stroke={accent}
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
    );
  }
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-[#2a2a2a] flex-shrink-0"
      aria-label="Not started"
    />
  );
};
