import { z } from 'astro:content';

// Single source of truth for the Quiz shape. Used as:
//  - the `quizzes` collection schema (build-time validation of standalone quizzes)
//  - the inline <Quiz> prop validator (Quiz.astro parses props at build time, so a
//    bad inline quiz in MDX fails `astro build` — astro check does NOT type-check
//    MDX component props, so this runtime parse is what enforces the contract).
export const quizSchema = z
  .object({
    id: z.string(), // stable analytics / localStorage key
    q: z.string(),
    opts: z.array(z.string()).min(2),
    correct: z.number().int(), // 0-based index into `opts`
    why: z.string(), // shown after answering
  })
  // Catch the most common authoring mistake: a `correct` index with no matching option.
  .refine((d) => d.correct >= 0 && d.correct < d.opts.length, {
    message: '`correct` must be a 0-based index within `opts`',
    path: ['correct'],
  });

// Mirrors quizSchema. (Kept explicit rather than z.infer because astro:content's
// `z` re-export isn't usable as a type namespace.)
export interface Quiz {
  id: string;
  q: string;
  opts: string[];
  correct: number;
  why: string;
}
