// Inline-SVG icon map (Lucide, ISC-licensed). Each value is the inner markup of a
// 24×24 stroke icon, rendered by <Icon> (src/components/Icon.astro). No icon font,
// no runtime/network cost — the SVG is inlined where referenced and tree-shaken
// per page. Names are a union, so a typo'd icon name fails type-check (spec §3.1).

export type IconName = 'layers' | 'database' | 'splitSquare';

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
};
