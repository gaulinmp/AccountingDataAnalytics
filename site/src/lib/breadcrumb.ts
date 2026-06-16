// Pure breadcrumb-trail derivation from the collection graph (spec §3.2). Kept
// DOM-free so it's unit-testable; Breadcrumb.astro resolves the typed references
// and the base-safe home href, then calls this.

export interface Crumb {
  label: string;
  href?: string;
  current?: boolean;
  /** tooltip (e.g. the week title behind a "Week 3" crumb) */
  title?: string;
}

export interface BreadcrumbInput {
  /** base-path-safe home URL (from href()) — never hardcode '/' */
  homeHref: string;
  weekHref: string;
  weekNumber: number;
  weekTitle: string;
  deckTitle: string;
}

export function buildBreadcrumb(i: BreadcrumbInput): Crumb[] {
  return [
    { label: 'Course', href: i.homeHref },
    {
      label: `Week ${i.weekNumber}`,
      href: i.weekHref,
      title: i.weekTitle,
    },
    { label: i.deckTitle, current: true },
  ];
}
