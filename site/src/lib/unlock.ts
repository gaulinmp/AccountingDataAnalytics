// Week date-gating. Any element carrying data-unlock-on="<ISO date>" gets an
// `is-locked` class while the student's clock is before that instant; the
// header nav and the home-page syllabus use that class to grey the entry out
// and stop its links from being followed. A locked week stays *visible* — the
// upcoming term is part of the syllabus — it just reads as not-yet-open, with
// an "Unlocks <date>" note. Week 1 is exempt — see gateDate() — so the course
// always has an open door. Individual week pages are not gated: a student who
// knows (or guesses) a URL gets the normal page. The gate is a listing
// courtesy, to keep attention on this week; there is nothing to secure here.
//
// The *preview clock* below flips the gate off so the instructor can see the
// gated entries as students will get them. Append `?preview=…` to any URL:
//
//   ?preview=all           every week reads as unlocked
//   ?preview=2026-09-21    pretend "now" is that date (bare dates = noon UTC)
//   ?preview=off           back to the real clock
//
// The choice persists in localStorage, so it survives clicking around the site,
// and a badge in the corner shows it is on (click it to clear). Works in `npm
// run dev` and against the built/deployed site alike.

import { NS } from './deck';

const PREVIEW_KEY = `${NS}:preview-clock`;
const PARAM = 'preview';

/** `all` = ignore every gate; `date` = pretend now is `at`. */
export type Preview = { mode: 'all' } | { mode: 'date'; at: number } | null;

/** Parse a stored/query value into a preview state. Invalid input ⇒ null. */
export function parsePreview(raw: string | null | undefined): Preview {
  const v = raw?.trim().toLowerCase();
  if (!v || ['off', 'none', 'reset', 'clear', 'false'].includes(v)) return null;
  if (['all', 'unlock', 'unlocked', 'open', 'true'].includes(v)) return { mode: 'all' };
  // A bare YYYY-MM-DD lands at noon UTC, so the simulated day reads the same in
  // every timezone (unlockOn dates are midnight UTC — see content.config.ts).
  const at = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T12:00:00Z` : v);
  return Number.isNaN(at) ? null : { mode: 'date', at };
}

/** The date a listing entry actually gates on. The **first week of the term is
 *  never gated** — it is the way into the course (and into the syllabus itself),
 *  so it stays open no matter what its `unlockOn` says or how early a student
 *  arrives. Every later week gates on its own date. Callers pass the week's
 *  index in `course.weekOrder`; the returned date is what goes in
 *  `data-unlock-on` (and drives the "Unlocks …" note), so `undefined` means the
 *  entry emits no gate at all. */
export function gateDate(unlockOn: Date | undefined, index: number): Date | undefined {
  return index === 0 ? undefined : unlockOn;
}

/** Is `unlockOn` still in the future, given the (possibly simulated) clock? */
export function isLocked(unlockOn: string | undefined, preview: Preview): boolean {
  if (preview?.mode === 'all') return false;
  const at = Date.parse(unlockOn ?? '');
  if (Number.isNaN(at)) return false;
  return at > (preview?.mode === 'date' ? preview.at : Date.now());
}

/** Storage is best-effort: private mode / file:// origins can throw. */
function readStored(): string | null {
  try {
    return localStorage.getItem(PREVIEW_KEY);
  } catch {
    return null;
  }
}

function writeStored(value: string | null) {
  try {
    if (value === null) localStorage.removeItem(PREVIEW_KEY);
    else localStorage.setItem(PREVIEW_KEY, value);
  } catch {
    /* ignore — the preview clock is a convenience, never a requirement */
  }
}

/** Consume `?preview=…` (if present) into storage, then strip it from the URL
 *  so it does not ride along in copied links. Returns the active preview. */
export function syncPreviewFromUrl(): Preview {
  const url = new URL(location.href);
  const param = url.searchParams.get(PARAM);
  if (param === null) return parsePreview(readStored());

  const preview = parsePreview(param);
  writeStored(preview ? param.trim().toLowerCase() : null);
  url.searchParams.delete(PARAM);
  history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  return preview;
}

/** Turn the preview clock off and reload into the real dates. */
export function clearPreview() {
  writeStored(null);
  location.reload();
}

/** Tooltip for a gated entry: the element's own title plus, while locked, when
 *  it opens. Pure so the wording is unit-testable. */
export function lockTitle(base: string, label: string | undefined, locked: boolean): string {
  if (!locked || !label) return base;
  return base ? `${base} · Unlocks ${label}` : `Unlocks ${label}`;
}

/** Disable/re-enable a link inside a gated entry. CSS greys it out and blocks
 *  the pointer; this is the keyboard/AT half. The original tabindex is parked
 *  in a data attribute so unlocking (preview clock) restores it exactly. */
function setLinkDisabled(a: HTMLAnchorElement, disabled: boolean) {
  const PARKED = 'lockTabindex';
  if (disabled) {
    a.setAttribute('aria-disabled', 'true');
    if (!(PARKED in a.dataset)) {
      a.dataset[PARKED] = a.getAttribute('tabindex') ?? '';
      a.setAttribute('tabindex', '-1');
    }
  } else {
    a.removeAttribute('aria-disabled');
    if (PARKED in a.dataset) {
      const parked = a.dataset[PARKED]!;
      if (parked) a.setAttribute('tabindex', parked);
      else a.removeAttribute('tabindex');
      delete a.dataset[PARKED];
    }
  }
}

/** Client-side: toggle `is-locked` on every date-gated element, disable the
 *  links inside the locked ones, and note the unlock date in their tooltip. */
export function applyLocks(root: ParentNode = document, preview: Preview = parsePreview(readStored())) {
  root.querySelectorAll<HTMLElement>('[data-unlock-on]').forEach((el) => {
    const locked = isLocked(el.dataset.unlockOn, preview);
    el.classList.toggle('is-locked', locked);

    if (el.dataset.unlockLabel) {
      const base = (el.dataset.lockBaseTitle ??= el.getAttribute('title') ?? '');
      const title = lockTitle(base, el.dataset.unlockLabel, locked);
      if (title) el.setAttribute('title', title);
      else el.removeAttribute('title');
    }

    const links = el instanceof HTMLAnchorElement ? [el] : [];
    links.push(...el.querySelectorAll('a'));
    links.forEach((a) => setLinkDisabled(a, locked));
  });
}

/** Swallow clicks (and Enter) on links inside a locked entry, so a greyed-out
 *  week cannot be navigated into by any route the CSS pointer block misses. */
export function guardLockedLinks(doc: Document = document) {
  if (doc.documentElement.dataset.lockGuard) return;
  doc.documentElement.dataset.lockGuard = '';
  doc.addEventListener(
    'click',
    (event) => {
      const link = (event.target as Element | null)?.closest?.('a');
      if (link?.closest('[data-unlock-on].is-locked')) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );
}

/** Corner badge so a preview session is never mistaken for the real site. */
export function mountPreviewBadge(preview: Preview) {
  if (!preview || document.querySelector('[data-preview-badge]')) return;

  const badge = document.createElement('button');
  badge.type = 'button';
  badge.dataset.previewBadge = '';
  badge.title = 'Preview clock is on — click to return to the real dates';
  badge.textContent =
    preview.mode === 'all'
      ? 'Preview: all weeks unlocked'
      : `Preview: ${unlockLabel(new Date(preview.at))}`;
  badge.addEventListener('click', clearPreview);

  const style = document.createElement('style');
  style.textContent = `
    [data-preview-badge] {
      position: fixed;
      inset-block-end: var(--space-4, 1rem);
      inset-inline-start: var(--space-4, 1rem);
      z-index: 999;
      padding: var(--space-2, 0.5rem) var(--space-4, 1rem);
      border: 0;
      border-radius: var(--radius-pill, 999px);
      background: var(--ink, #1a1a1a);
      color: var(--surface, #fff);
      font: inherit;
      font-size: var(--fs-xs, 0.8rem);
      font-weight: 600;
      box-shadow: var(--shadow-2, 0 4px 12px rgba(0, 0, 0, 0.2));
      cursor: pointer;
      opacity: 0.85;
    }
    [data-preview-badge]:hover { opacity: 1; }
    @media print { [data-preview-badge] { display: none; } }
  `;
  document.head.append(style);
  document.body.append(badge);
}

/** Build-time: human date for "Unlocks …" notices. UTC keeps a bare
 *  `YYYY-MM-DD` from drifting a day in the build machine's timezone. */
export function unlockLabel(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}
