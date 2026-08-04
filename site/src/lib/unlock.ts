// Week date-gating. Any element carrying data-unlock-on="<ISO date>" gets an
// `is-locked` class while the student's clock is before that instant; each
// component styles its own locked state. This is a courtesy curtain, not
// security: the content ships in the static build, and the check is trivially
// bypassed with a clock change or devtools — by design (spec: spare students
// info overload, don't build a fortress).

/** Client-side: toggle `is-locked` on every date-gated element. */
export function applyLocks(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-unlock-on]').forEach((el) => {
    el.classList.toggle('is-locked', Date.parse(el.dataset.unlockOn ?? '') > Date.now());
  });
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
