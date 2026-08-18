# site/content/

All course material lives here, authored as YAML (structure) and MDX (lectures).
This folder is intentionally code-free: you can write a whole course without ever
opening `site/src/`.

```
content/
├─ course.yaml          # the course singleton (title, term, brand, week order)
├─ weeks/               # one YAML file per week        — week-03.yaml
├─ decks/               # one MDX file per lecture       — week-03/lec-data-sources.mdx
└─ quizzes/             # optional standalone quizzes     — *.yaml
```

- **How to write a deck:** see [../README.md](../README.md).
- **The schemas your files are validated against:** `site/src/content.config.ts`.
  A typo'd reference or an out-of-range quiz answer **fails the build**, so you find
  out immediately.
- **How the app reads files here:** via Astro glob loaders with `base: 'content/...'`.
  See [../repo-structure.md](../repo-structure.md).

The actual files are seeded in Stage 1 (one course, one week, one quiz)
and the first real deck in Stage 4.
