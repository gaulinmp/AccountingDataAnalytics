// Base-path-safe URL helper. Every internal link goes through this (or Astro route
// helpers) so links survive the GitHub Pages subpath (spec §8). `BASE_URL` is '/'
// in dev and e.g. '/acctg5150/' once `base` is set in Stage 8.
import type { CollectionEntry } from 'astro:content';

const BASE = import.meta.env.BASE_URL;

export function href(path = ''): string {
  const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  if (!path) return `${base}/`;
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

// The canonical deck URL shape: /<week>/<deck-basename>/
// The deck route's getStaticPaths must produce params that match this (see
// [week]/[deck].astro). Defined once here so links can't drift.
export function deckSlug(deck: CollectionEntry<'decks'>): string {
  return deck.id.split('/').pop()!;
}

export function deckUrl(deck: CollectionEntry<'decks'>): string {
  return href(`${deck.data.week.id}/${deckSlug(deck)}/`);
}

export function weekUrl(weekId: string): string {
  return href(`${weekId}/`);
}
