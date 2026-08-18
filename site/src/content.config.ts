import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';
import { quizSchema } from '@lib/quiz';
import { icons } from '@lib/icons';

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
    /** Short label under the week icon in the header nav (e.g. "Viz"). */
    navLabel: z.string().optional(),
    /** Header-nav icon; must be a name from src/lib/icons.ts. */
    icon: z
      .string()
      .refine((n) => n in icons, { message: 'unknown icon name — see src/lib/icons.ts' })
      .optional(),
    summary: z.string().optional(),
    description: z.string().optional(),
    objectives: z.array(z.string()).optional(),
    /** Date-gate: before this instant the week is greyed in nav and its pages
     *  show an "Unlocks …" placeholder. Checked client-side against the
     *  student's clock — deliberately unsecured (spares students info
     *  overload; trivially bypassable by design). A bare `YYYY-MM-DD` parses
     *  as midnight UTC, i.e. the evening before in Mountain Time. */
    unlockOn: z.coerce.date().optional(),
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

// Lab & homework instruction sheets live outside the site, in the repo-level
// `labs_hw/` tree (one folder per week, e.g. `week5_RDB/Lab-5_Instructions.md`).
// They are authored for the python-markdown pipeline; remark-scrub-pymd strips
// the extension artifacts at render time. `generateId` keeps the raw path (the
// default would slugify it) so pages can parse week/type from the id.
// The site serves the ACCTG 5150 (undergrad) sheets only — the `_MAcc_`
// variants that also live in `labs_hw/` are excluded here.
const labs = defineCollection({
  loader: glob({
    pattern: ['week*/{Lab,Homework}-*_Instructions.md', '!**/*_MAcc_*'],
    base: '../labs_hw',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
});

const quizzes = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: 'content/quizzes' }),
  schema: quizSchema,
});

export const collections = { course, weeks, decks, labs, quizzes };
