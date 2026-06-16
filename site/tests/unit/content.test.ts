import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

// We validate the raw content files directly rather than booting `astro:content`
// inside Vitest. The Zod schemas + reference() checks are enforced by
// `astro build` (the real gate); this test is a fast belt-and-suspenders that the
// seeded graph is internally consistent.

const root = (rel: string) => fileURLToPath(new URL(`../../content/${rel}`, import.meta.url));

const loadYaml = <T>(rel: string): T => parse(readFileSync(root(rel), 'utf8')) as T;

/** ids = filenames (sans .yaml) in a content dir, matching Astro's glob loader. */
const idsIn = (dir: string) =>
  readdirSync(root(dir))
    .filter((f) => f.endsWith('.yaml'))
    .map((f) => f.replace(/\.yaml$/, ''));

/** Extract + parse a deck's MDX frontmatter block. */
const deckFrontmatter = (rel: string) => {
  const src = readFileSync(root(rel), 'utf8');
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  if (!m) throw new Error(`no frontmatter in ${rel}`);
  return parse(m[1]) as { week: string; title: string };
};

describe('content graph', () => {
  const weekIds = idsIn('weeks');

  it('course.weekOrder references existing weeks', () => {
    const course = loadYaml<{ course: { weekOrder: string[] } }>('course.yaml').course;
    for (const w of course.weekOrder) expect(weekIds).toContain(w);
  });

  it('the deck resolves its week', () => {
    const fm = deckFrontmatter('decks/week-03/3-1-vis-overview.mdx');
    expect(weekIds).toContain(fm.week);
  });

  it('every quiz `correct` is a valid index into `opts`', () => {
    for (const id of idsIn('quizzes')) {
      const quiz = loadYaml<{ opts: string[]; correct: number }>(`quizzes/${id}.yaml`);
      expect(quiz.correct).toBeGreaterThanOrEqual(0);
      expect(quiz.correct).toBeLessThan(quiz.opts.length);
    }
  });
});
