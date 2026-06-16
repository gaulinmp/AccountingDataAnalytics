// Inline-SVG icon map (Lucide, ISC-licensed). Each value is the inner markup of a
// 24×24 stroke icon, rendered by <Icon> (src/components/Icon.astro). No icon font,
// no runtime/network cost — the SVG is inlined where referenced and tree-shaken
// per page. Names are a union, so a typo'd icon name fails type-check (spec §3.1).

export type IconName =
  | 'layers'
  | 'database'
  | 'splitSquare'
  | 'playCircle'
  | 'grid'
  | 'chart'
  | 'tools'
  | 'terminal'
  | 'document'
  | 'clipboard'
  | 'trend'
  | 'gitMerge'
  | 'bubble'
  | 'sparkles'
  | 'award'
  | 'book'
  | 'chevronLeft'
  | 'chevronRight'
  | 'search'
  | 'user'
  | 'slides'
  | 'info';

export const icons: Record<IconName, string> = {
  // lucide: layers
  layers:
    '<path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/>' +
    '<path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/>' +
    '<path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  // lucide: database
  database:
    '<ellipse cx="12" cy="5" rx="9" ry="3"/>' +
    '<path d="M3 5V19A9 3 0 0 0 21 19V5"/>' +
    '<path d="M3 12A9 3 0 0 0 21 12"/>',
  // lucide: square-split-horizontal
  splitSquare:
    '<path d="M8 19H5c-1 0-2-1-2-2V7c0-1 1-2 2-2h3"/>' +
    '<path d="M16 5h3c1 0 2 1 2 2v10c0 1-1 2-2 2h-3"/>' +
    '<line x1="12" x2="12" y1="4" y2="20"/>',
  playCircle:
    '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>',
  grid:
    '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>',
  chart:
    '<line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/>',
  tools:
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  terminal:
    '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',
  document:
    '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
  clipboard:
    '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 14h6"/><path d="M9 18h6"/><path d="M9 10h6"/>',
  trend:
    '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  gitMerge:
    '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 9a9 9 0 0 1 9 9"/>',
  bubble:
    '<circle cx="9" cy="9" r="6"/><circle cx="15" cy="15" r="6"/>',
  sparkles:
    '<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/><path d="m5 3 1 2.5L8.5 6 6 7 5 9.5 4 7 1.5 6 4 5.5Z"/><path d="m19 17 1 2.5 2.5.5-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1Z"/>',
  award:
    '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"/><path d="M12 2a6 6 0 0 1 6 6v3.5a6 6 0 0 1-6 6 6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z"/>',
  book:
    '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
  chevronLeft:
    '<polyline points="15 18 9 12 15 6"/>',
  chevronRight:
    '<polyline points="9 18 15 12 9 6"/>',
  search:
    '<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/>',
  user:
    '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  slides:
    '<path d="M2 3h20"/><path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3"/><path d="m12 16 4 5"/><path d="m12 16-4 5"/><path d="M10 8h4"/>',
  info:
    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
};
