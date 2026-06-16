import { defineCollection, reference, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { quizSchema } from '@lib/quiz';

// All content lives in `site/content/` (a sibling of `src/`), so loader
// `base`/path values are relative to the project root. See docs/repo-structure.md.

// The course singleton. `course.yaml` is a keyed object, so the `file()` loader
// emits one entry whose id is the top-level key (`course`).
const course = defineCollection({
  loader: file('content/course.yaml'),
  schema: z.object({
    title: z.string(), // "Accounting Analytics"
    code: z.string(), // "ACCTG 5150"
    term: z.string(), // "Fall 2026"
    school: z.string(),
    instructors: z.array(z.string()),
    brand: z.object({ primary: z.string().default('#CC0000') }),
    weekOrder: z.array(reference('weeks')),
  }),
});

const weeks = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: 'content/weeks' }),
  schema: z.object({
    number: z.number().int(),
    title: z.string(),
    summary: z.string().optional(),
    description: z.string().optional(),
    objectives: z.array(z.string()).optional(),
  }),
});

// `quizSchema` (the standalone-quiz validator, also reused by the inline <Quiz>
// component) lives in @lib/quiz so component and content share one definition.

const decks = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: 'content/decks' }),
  schema: z.object({
    week: reference('weeks'),
    title: z.string(),
    subtitle: z.string().optional(),
    instructors: z.array(z.string()).optional(),
    date: z.coerce.date().optional(),
    estMinutes: z.number().optional(),
    topic: z.string().optional(), // deck-level AI-tutor topic; a <Slide topic> overrides it
    aiPrompt: z.string().optional(), // per-deck system-prompt addendum
  }),
});

const quizzes = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: 'content/quizzes' }),
  schema: quizSchema,
});

export const collections = { course, weeks, decks, quizzes };
