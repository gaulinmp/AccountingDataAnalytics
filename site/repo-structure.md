# Repository structure & the content-location decision

## The three-folder split

```
AI_Accounting/
├─ app_description.md   # canonical spec — read this for the "why"
├─ docs/                # documentation about the site & tech (incl. the build plan)
└─ site/                # the Astro application (self-contained)
   └─ content/          # all course material (YAML + MDX) — authored by humans / AI
```

The guiding principle (spec §11) is **separation of concerns**: content
(MDX/YAML) ≠ presentation (components) ≠ behavior (islands). The folder layout
makes that physical — an instructor only touches `site/content/` to write a
lecture, never `site/src/`.

## Where does content live?

Content lives at **`site/content/`**, a sibling of `site/src/`, so the whole app
(code + course material) is self-contained under `site/`. The Astro app reaches it
through the **Content Layer glob loaders**, whose `base` is resolved relative to
the Astro project root (`site/`):

```ts
// site/src/content.config.ts
const weeks = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: 'content/weeks' }),
  // ...
});
```

Because content sits inside the project root, the dev server reads it without any
`vite.server.fs.allow` escape hatch — `astro.config.mjs` needs no special access
config. (It's kept out of `site/src/content/` so it doesn't collide with Astro's
default content-collection directory and stays a clean, code-free home.)

## Path aliases (set in Stage 0)

Decks and components import by alias, never by deep relative path. Configure these
in `site/tsconfig.json` (and they flow into the MDX/Vite pipeline automatically):

| Alias          | Resolves to            |
|----------------|------------------------|
| `@components/*`| `site/src/components/*`|
| `@layout/*`    | `site/src/components/layout/*` |
| `@islands/*`   | `site/src/components/islands/*` |
| `@lib/*`       | `site/src/lib/*`       |
| `@styles/*`    | `site/src/styles/*`    |

So an MDX deck in `site/content/decks/` writes
`import { Slide, Quiz } from '@components/blocks';` and it resolves regardless of
where the file physically sits.

## Inside `site/` (target shape after Stage 8)

```
site/
├─ astro.config.mjs            # site, base, mdx integration
├─ tsconfig.json               # path aliases
├─ package.json
├─ content/                    # all course material: course.yaml, weeks/, decks/, quizzes/
├─ src/
│  ├─ content.config.ts        # collections + Zod schemas (Stage 1)
│  ├─ components/
│  │  ├─ blocks/               # Bullets, Schema, SqlWalk, Quiz, … (Stage 3)
│  │  ├─ layout/               # Layout, BrandStrip, Breadcrumb, Footer (Stage 2)
│  │  └─ islands/              # DeckController, QuizCard (Stage 5)
│  ├─ pages/
│  │  ├─ index.astro           # course home (Stage 4)
│  │  ├─ 404.astro             # friendly not-found (Stage 8)
│  │  └─ [week]/[deck].astro   # deck route (Stage 4)
│  ├─ styles/tokens.css        # design tokens (Stage 2)
│  └─ lib/icons.ts             # inline-SVG icon map (Stage 2)
├─ packages/ai-tutor/          # the <ai-tutor> web component (Stage 6)
├─ public/{.nojekyll, CNAME, assets/}   # (Stage 8)
├─ tests/                      # Vitest unit + Playwright e2e (Stage 7)
└─ .github/workflows/deploy.yml         # (Stage 8 — may live at repo root instead)
```

> Note on `.github/`: GitHub Actions only runs workflows from `.github/workflows/`
> **at the repository root**. Since `site/` is a subfolder, the workflow lives at
> the repo root and `cd site` (or sets a working-directory) before building. Stage
> 8 covers this.
