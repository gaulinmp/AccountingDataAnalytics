// Base-path-safe URL helper. Every internal link goes through this (or Astro route
// helpers) so links survive the GitHub Pages subpath (spec §8). `BASE_URL` is '/'
// in dev and e.g. '/acctg5150/' once `base` is set in Stage 8.

const BASE = import.meta.env.BASE_URL;

export function href(path = ''): string {
  const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  if (!path) return `${base}/`;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

// The canonical week sub-page URL shape: /<week>/<tab>/ (e.g. /week-06/slides/).
// The week tab routes ([week]/slides.astro etc.) own these paths; links go
// through this helper so routes and links can't drift apart.
export type WeekTab = 'slides' | 'activity' | 'lab' | 'homework' | 'quiz';

export function weekTabUrl(weekId: string, tab: WeekTab): string {
  return href(`${weekId}/${tab}/`);
}

export function weekUrl(weekId: string): string {
  return href(`${weekId}/`);
}
