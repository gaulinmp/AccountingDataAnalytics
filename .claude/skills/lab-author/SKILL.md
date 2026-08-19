---
name: lab-author
description: >-
  Author or edit ACCTG 5150 lab, homework, and project instructions under labs_hw/.
  Use whenever the user asks to create, draft, revise, or convert a lab, homework,
  project, rubric, or assignment (e.g. "write the week 7 lab", "add a rubric to
  lab 4", "update the project 2 rubric", "regenerate the lab HTML"). Knows the
  markdown dialect, folder conventions, data-file sourcing, and the
  convert_md.py HTML pipeline.
---

# Authoring ACCTG 5150 labs & projects

Labs and projects are plain-Markdown instruction files in `labs_hw/`, converted to
standalone HTML (with inlined images) for distribution via Canvas. Students see the
HTML; you edit the `.md`.

## Folder & file conventions

```
labs_hw/
├── weekN_topic-slug/            e.g. week3_visualization, week6_ETL-SQL-LLM
│   ├── Lab-N_Instructions.md        ← the lab
│   ├── *.png                        screenshots referenced by relative path
│   ├── *.csv / *.xlsx / *.twbx      week-local data + tool files students download
│   ├── weekN_solutions.ipynb        instructor solutions (not distributed)
│   └── *.html                       GENERATED — never hand-edit
└── projectN/
    ├── ProjectN-Slug.md             e.g. Project1-FSA.md
    ├── figures/
    └── projectN_*.ipynb
```

- New weekly lab → new folder `weekN_topic-slug` matching the existing naming.
- **One lab per week, one audience.** There is no UG/MAcc split — the separate
  `*_MAcc_*` variants were retired in August 2026. Never create one.
- **Data**: source from `data/` at repo root. If students need a subset, generate a
  week-local copy named like `CompustatAnnual_subset-for-labN.csv` and put the code
  that made it in the week's notebook. Lab folders must be self-contained.
- Solutions live beside the lab as `weekN_solutions.ipynb` (+ `.html` export).
  Never reference solutions from the instructions file.

## Markdown dialect (python-markdown, not GFM)

The converter (`code/utils/convert_md.py`) uses python-markdown with: `toc`,
`tables`, `codehilite`, `sane_lists`, `pymdownx.details`, `pymdownx.superfences`,
plus custom extensions. Consequences:

- Put `[TOC]` on its own line after the intro paragraph — it renders a table of
  contents. Every lab has one.
- Attribute lists work: append `{: .note}` to a paragraph for a callout note.
- Numbered headings: `## 1. Assignment`, `### 1.1. Learning Objectives` — the
  numbering is manual and hierarchical; keep it consistent.
- Images: standard `![alt](file.png "title")` with paths relative to the lab
  folder. The converter inlines them base64 into the HTML, so never hot-link.
- Fenced code blocks get syntax highlighting (`codehilite`); collapsible blocks
  via `pymdownx.details` (`???` / `!!!` syntax) are available.
- External links auto-open in a new tab; don't add `target=` yourself.

## Standard lab skeleton

```markdown
# Lab N: Title

One-paragraph framing: what data, what goal, how it connects to the week's lecture.

[TOC]

## 1. Assignment

**Submission:** what and where (usually a Canvas quiz, sometimes file upload).

* Deliverable 1 (with `column_names` in backticks)
* Deliverable 2 …

*Note*: guidance/permissions (filtering, winsorizing, aesthetics). {: .note}

### 1.1. Learning Objectives
* "By the end of this lab, you will be able to …" bullets

### 1.2. Rubric and Grading
1. *Excellent*: … (5 pts)
2. *Good*: … (4 pts)
…

## 2. Walkthrough sections (Excel → Tableau → Python, in that order)
```

Voice and audience rules are the same as decks — read
`.claude/skills/deck-author/references/course-context.md` (accounting experts,
not programmers; Excel-first with Python/SQL as the growth path; define analytics
jargon; concrete accounting scenario before abstraction). Multi-modality is a
course theme: where practical, show the task in Excel, Tableau, *and* Python and
let students choose.

## Cross-links to the site

Week numbers align across systems: `labs_hw/week3_*` ↔ `site/content/weeks/week-03.yaml`
↔ `slides/3-Vis/`. When a lab changes what a week teaches, check the week's
`objectives` in the site YAML still match (that's `deck-author` territory).

## Validation (required before claiming done)

```bash
uv run python code/utils/convert_md.py            # watcher: regenerates HTML for changed .md, Ctrl-C after one pass
```

Then open the generated `.html` and confirm: TOC renders, images appear (inlined),
notes are styled, headings numbered correctly. The `.html` files are generated
artifacts — if your edit didn't show up, you edited the wrong file.
