// Per-module accent palette. Saturation kept low; no purple/lila tones.
// `accent` is the spine color; `tint` is its low-alpha companion for glows/halos.
export interface ModuleAccent {
  accent: string;
  tint: string;
}

const FALLBACK: ModuleAccent = {
  accent: '#a3a3a3',
  tint: 'rgba(163, 163, 163, 0.12)',
};

const PALETTE: Record<string, ModuleAccent> = {
  'module-1': { accent: '#f87171', tint: 'rgba(248, 113, 113, 0.14)' }, // rose
  'module-2': { accent: '#fbbf24', tint: 'rgba(251, 191, 36, 0.14)' },  // amber
  'module-3': { accent: '#38bdf8', tint: 'rgba(56, 189, 248, 0.14)' },  // sky
  'module-4': { accent: '#4ade80', tint: 'rgba(74, 222, 128, 0.14)' },  // emerald
  'module-5': { accent: '#fb923c', tint: 'rgba(251, 146, 60, 0.14)' },  // orange
};

export function getModuleAccent(moduleId: string): ModuleAccent {
  return PALETTE[moduleId] ?? FALLBACK;
}

export type ModuleStatus = 'not-started' | 'in-progress' | 'completed';

export function deriveStatus(completed: number, total: number): ModuleStatus {
  if (total === 0) return 'not-started';
  if (completed === 0) return 'not-started';
  if (completed >= total) return 'completed';
  return 'in-progress';
}

// Motivational copy keyed to overall progress. Plain, no exclamation overload.
export function motivationalLabel(percent: number): string {
  if (percent <= 0) return 'Just getting started';
  if (percent < 25) return 'Building momentum';
  if (percent < 50) return 'Hitting your stride';
  if (percent < 75) return 'More than halfway';
  if (percent < 100) return 'Almost there';
  return 'Mastered the playlist';
}
