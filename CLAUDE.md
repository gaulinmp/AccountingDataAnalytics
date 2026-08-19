# CLAUDE.md

@AGENTS.md

## Quick orientation

One repo, three content systems, all markdown-first and agent-editable:

| What | Where | Skill | Validate with |
|------|-------|-------|---------------|
| Lecture decks (website slides) | `site/content/decks/`, `site/content/weeks/` | `deck-author` | `cd site && npm run build` |
| Labs, homework, projects | `labs_hw/` | `lab-author` | `uv run python code/utils/convert_md.py <file.md>` (regenerates that file's HTML) |
| Site code: components, widgets, layout, styling | `site/src/` | `site-dev` | `cd site && npm run --silent gate` |

Source PPTX decks live in `slides/` and convert to site decks via `pptx-to-deck`
(wraps `code/utils/pptx2md.py`).

## Rules of the road

- **Content vs. code is a hard boundary.** Course *content* edits stay in
  `site/content/` and `labs_hw/`. Site *code* edits stay in `site/src/` and go
  through the `site-dev` skill so the component cheatsheet in `deck-author`
  stays in sync.
- **Never claim done without running the matching validation** from the table
  above. A green `astro build` is the schema check for content.
- **Data files** used by labs come from `data/`; labs copy or reference a
  week-local subset (e.g. `CompustatAnnual_subset-for-lab3.csv`) so each lab
  folder is self-contained for students.
- `data/`, `literature/`, `labs_hw/cases/`, `slides/`, and Office files are
  gitignored — don't try to commit them.
- **`slides/` is not in git at all.** It holds the source PPTX and the figures
  that feed them; Dropbox versions it. The site never builds from `slides/` —
  `pptx2md.py` reads the pptx and writes `site/public/decks/`, and *that* is the
  committed copy the site serves. So don't "restore" a deck image by pointing at
  `slides/`; a fresh clone won't have it.
- **Generated lab HTML is tracked.** The `convert_md.py` output
  (`Lab-N_Instructions.html`, project HTML) is committed alongside its source
  `.md` so the rendered handout is versioned with the text it came from —
  regenerate and commit both together. Solution HTML (`*solutions*.html`) is
  ignored, to keep answer keys out of the public repo.
  **Pass the one `.md` you edited** — `convert_md.py path/to/Lab-N_Instructions.md`
  converts just that file. With no argument it becomes a *watcher* over all of
  `labs_hw/` that never exits, and will happily generate HTML for scratch files
  (`notes.md`) and the MAcc variants the site deliberately excludes.
  Regenerating a long-untouched lab may also pull in accumulated `themes/*.css`
  drift — check `git diff` covers only what you meant to change.
- Python runs through **uv**: `uv run python …`, `uv run jupyter notebook`.

## Skills index (`.claude/skills/`)

- `deck-author` — write/revise MDX decks, week YAML, quizzes under `site/content/`.
- `lab-author` — write/revise lab & project instructions under `labs_hw/`.
- `pptx-to-deck` — convert `slides/**/*.pptx` into site decks, then clean up.
- `site-dev` — extend `site/src/`: new slide components, interactive islands,
  icons, styling, content-collection schema changes.
