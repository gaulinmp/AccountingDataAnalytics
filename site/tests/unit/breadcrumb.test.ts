import { describe, expect, it } from 'vitest';
import { buildBreadcrumb } from '../../src/lib/breadcrumb';

describe('breadcrumb derivation', () => {
  // A subpath home href simulates GitHub Pages' base (spec §8).
  const trail = buildBreadcrumb({
    homeHref: '/acctg5150/',
    weekHref: '/acctg5150/week-03/',
    weekNumber: 3,
    weekTitle: 'Where accounting data lives',
    deckTitle: 'Data Sources: Files, Databases, APIs',
  });

  it('renders Course > Week N > Deck in order', () => {
    expect(trail.map((c) => c.label)).toEqual([
      'Course',
      'Week 3',
      'Data Sources: Files, Databases, APIs',
    ]);
  });

  it('links the Course crumb through the base href (never hardcoded /)', () => {
    expect(trail[0].href).toBe('/acctg5150/');
  });

  it('links the Week crumb to the week page', () => {
    expect(trail[1].href).toBe('/acctg5150/week-03/');
  });

  it('marks only the deck as the current page', () => {
    expect(trail[2].current).toBe(true);
    expect(trail.slice(0, 2).every((c) => !c.current)).toBe(true);
  });

  it('keeps the week title as a tooltip behind the short label', () => {
    expect(trail[1].title).toBe('Where accounting data lives');
  });
});
