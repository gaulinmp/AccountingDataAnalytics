# ACCTG 5150 — course context & teaching style

This is the pedagogical brief for authoring decks. The mechanics (components, schema) are in
[../SKILL.md](../SKILL.md); this file is *how to teach*, *to whom*, and *in what voice* — the
part that isn't written down elsewhere in the repo.

## Audience

University of Utah accounting students, in two tracks (some weeks have separate **MAcc**
lab instructions, signalling a graduate vs. undergraduate split):

- **Assume accounting domain expertise, not programming.** Students know debits/credits,
  financial statements, audit, tax, managerial accounting. Most do **not** code.
- **Excel-first.** Students start in Excel and grow into Python/SQL over the term. Frame
  tools as a progression, not a prerequisite.
- **Domain knowledge is the selling point.** A throughline of the course: "your accounting
  expertise is your competitive advantage in analytics." Reinforce it; don't condescend.

## Course arc (13 weeks)

Builds from data fundamentals → communication → infrastructure → modeling → AI. Each week's
`content/weeks/week-NN.yaml` `objectives` are the contract for that week's decks.

| Wk | Topic |
|----|-------|
| 1  | Intro to accounting data analytics; class goals; professional skepticism |
| 2  | Data in business — the 5 Vs, sources, types, storage, cloud, audit standards |
| 3  | Data visualization — storytelling, descriptives, chart types, best practices |
| 4  | Exploratory data analysis (EDA) — structure, distributions, quality, pitfalls |
| 5  | Relational databases & merging — joins, SQL, statistical merges |
| 6  | Automation & ETL — extract-transform-load, RPA |
| 7  | Unstructured data — text, images, NLP, embeddings, intro LLMs |
| 8  | Analytical modeling overview — lifecycle, model types, evaluation, fitting |
| 9  | Supervised learning: regression — cost estimation, time-series, causal |
| 10 | Supervised learning: classification — defaults, ROC/AUC, thresholds |
| 11 | Unsupervised learning — clustering, dimensionality reduction |
| 12 | Foundational models & LLMs — how AI works, embeddings, prompting, tools |
| 13 | Capstone & recap |

Decks per week run ~4–9. Project deadlines land around weeks 8/9/10 (Projects 1–3) and 13
(Project 4, choose-your-own-adventure). Course deliverables are themselves short slide decks
aimed at executives — model that "clear, concise, minimal jargon" standard in the content.

## Voice & tone

- **Scannable bullets over paragraphs.** Slides are dense but skimmable. Lead with the point.
- **Define jargon at first use.** Never assume an analytics term is known; accounting terms
  can be assumed.
- **Professional but conversational.** Plain language, the occasional apt quote (e.g. the
  Yogi Berra "you can see a lot just by looking" in the EDA deck), light humor — no hype.
- **Intellectually honest.** Name limitations, assumptions, and failure modes openly.
- **Minimal emoji.** A rare topical one (🤖 for AI) is fine; don't pepper them in.
- **Concrete first, abstract second.** Open with a real accounting scenario, then generalize
  to the concept — not the reverse.

## Recurring pedagogical patterns

Reuse these — they make new decks feel native:

- **Teach to the week's `objectives`.** Every deck maps to one or more of them.
- **Define → Collect → Model → Evaluate → Deploy → Iterate.** The standard framework for any
  method/workflow (used identically in the regression and classification weeks).
- **Real accounting scenarios, not toy ones:** general-ledger / forensic analysis (outliers,
  timing), cost estimation from purchase/payroll records, transaction categorization
  (bank → GL accounts), credit-default classification, cross-sectional financial-statement
  ratio analysis.
- **Always cover caveats & pitfalls:** overfitting, bias (confirmation/selection),
  correlation ≠ causation, multicollinearity, data quality / "dirty data."
- **Multi-modal framing:** show the same idea across Excel / Python / SQL where natural, and
  name the trade-offs (ease vs. power vs. reproducibility).
- **Professional skepticism as a throughline:** question the data, the model, the
  assumptions, the conclusion.
- **One `<Quiz>` per concept slide** as a check-for-understanding.
- **A `key="…"` Key-Concept line** on substantive slides (the one-sentence takeaway).
- **Visual-first communication:** prefer a chart/table/figure to a wall of text; the
  visualization week literally opens with Anscombe's quartet to make the point.

## Tools & datasets used in the course

- **Datasets:** Compustat fundamentals (`funda`), CRSP (daily stock returns/volume),
  journal-entry / general-ledger data, public financial statements.
- **Python:** pandas, matplotlib / seaborn, scikit-learn, Jupyter / Google Colab.
- **SQL:** SQLite, via the instructor's web SQL tool (mgaulin.com/ada/sql).
- **Other:** Excel (Power Query, pivot tables), GitHub Copilot (week 12), Tableau (mentioned).

## Exemplar decks to read before writing

Match the style of these real decks (under `site/content/decks/`):

- `week-01/1-1-course-welcome.mdx` — tone-setting; plain-Markdown bullets inside `<Slide>`.
- `week-03/3-1-vis-overview.mdx` — visual-first; `DataTable` (Anscombe's quartet); inline `Quiz`.
- `week-05/` decks — `SqlWalk`, `JoinCompare`, `Schema` in action (relational/joins week).
- `week-09/9-2-regression-example.mdx` — the Define→…→Deploy workflow on a real cost problem.
- `week-10/10-2-classification-example.mdx` — same workflow for classification (defaults, ROC).
