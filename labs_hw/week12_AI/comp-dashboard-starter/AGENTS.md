# AGENTS.md: peer comparison dashboard

You are helping a student in ACCTG 5150 (Accounting Analytics) build a small
Python tool in this folder. Read this whole file before you do anything.

## Who you are working with

The student is an accounting major. They know financial statements, ratios and
Excel well. Most of them have never programmed and have never used a terminal.

- Do the technical work yourself: create files, install packages, run commands.
  Do not ask the student to edit code or type terminal commands.
- Before you ask permission to run a command, say in one plain sentence what it does.
- When something fails, read the error yourself and fix it. Do not ask the
  student to paste error messages.
- Ask the student about accounting and design choices (which ratios, which
  peers, what the workbook should show). Those are theirs to decide.

## Workflow: spec first, then code

1. **Write no code until `SPEC.md` exists and the student has approved it.**
2. To write the spec, interview the student **one question at a time**, working
   through the headings in `SPEC_TEMPLATE.md`. Offer a sensible default with
   each question so they can just say "yes". Then write `SPEC.md`.
3. Implement only what `SPEC.md` says. If you have to deviate, update `SPEC.md`
   first, add a line to its "Changes" section, and tell the student.
4. You are done when every acceptance check in `SPEC.md` passes. Run the checks
   and show the student the output.

## What is being built

| Stage | What | Build it when |
|-------|------|---------------|
| Lab | A command-line script: ticker in, Excel dashboard out, comparing the company with its peers | Now |
| Homework | Adds LLM-written commentary on the computed numbers | Only when the student asks |
| Extra credit | A local web version of the dashboard | Only when the student asks |

Keep fetching, computing and output in separate modules (for example `sec.py`,
`ratios.py`, `workbook.py`, and `dashboard.py` as the entry point), so the later
stages can reuse the first two unchanged.

## Environment: uv and sandbox

- This folder is a **uv** project (`pyproject.toml` is already here). uv installs
  Python by itself, so do not install Python, Anaconda, Miniconda or pip separately.
- **Terminal sandbox (Antigravity):** By default, commands run in an isolated
  sandbox with no internet access and no write access outside this folder.
  Installing `uv`, running `uv add`, and fetching live SEC or Gemini API data
  require network access, so run those commands **outside the sandbox**
  (`BypassSandbox: true`). Keep local file processing and offline checks inside
  the sandbox.
- Check uv first with `uv --version`. If it is missing, install it:
    - macOS: `curl -LsSf https://astral.sh/uv/install.sh | sh`
    - Windows: `powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"`
    - After installing, the terminal must be closed and reopened before `uv` is
      found. Tell the student to restart their editor (e.g., Antigravity) if `uv`
      is still not recognized.
- Add packages with `uv add <package>`. Never use `pip install` or `conda`.
- Run code with `uv run python dashboard.py AAPL`. Never call `python` directly.

## SEC data

All data comes from the SEC's free JSON APIs. There is no API key and no HTML scraping.

**Every request needs a `User-Agent` header with a real name and email**, or the
SEC answers 403. Read it from `SEC_USER_AGENT` in `.env`. If `.env` does not
exist, ask the student for their name and school email, then create it from
`.env.example`.

Stay under 10 requests per second. Save every response in a `cache/` folder and
reuse it on later runs unless the student passes `--refresh`.

| Need | Endpoint |
|------|----------|
| CIK, name, latest 10-K accession number, SIC industry, size, ticker | `sec_companies.csv` in this folder (no request needed) |
| Every reported number for one company | `https://data.sec.gov/api/xbrl/companyfacts/CIK##########.json` |
| One number for every company in one period | `https://data.sec.gov/api/xbrl/frames/us-gaap/{Tag}/USD/CY2024.json` |
| Company profile and filing list | `https://data.sec.gov/submissions/CIK##########.json` |
| A filing's page, for a person to click | `https://www.sec.gov/Archives/edgar/data/{cik}/{accession}/{accession}-index.htm` |

The CIK in the `data.sec.gov` URLs is zero-padded to 10 digits. For balance
sheet items in the frames endpoint, the period looks like `CY2024Q4I` (a point
in time).

The filing link takes the CIK without padding and the accession number twice:
the folder works with or without the dashes, and the file name keeps them. For
example, Apple's latest 10-K is
`https://www.sec.gov/Archives/edgar/data/320193/000032019325000079/0000320193-25-000079-index.htm`.
The `accession` column in `sec_companies.csv` gives each company's latest 10-K,
and every fact in companyfacts carries its own accession number in `accn`, so
any number in the dashboard can link back to the filing it came from.

Known traps:

- **Revenue has several tags.** Try `RevenueFromContractWithCustomerExcludingAssessedTax`,
  then `Revenues`, then `SalesRevenueNet`. Other items have the same problem.
  Record which tag you used for each company on the Sources sheet.
- **Do not trust the `fy` field.** It is the fiscal year of the filing that
  reported the number, so prior-year comparatives carry the later year. Identify
  the period from the `start` and `end` dates instead.
- **Keep annual values only.** Use facts from 10-K filings whose `start` to `end`
  span is about one year, and drop duplicates of the same period.
- **Missing is normal.** A peer may not report a tag at all. Leave the cell
  blank and note it; never fill in zero.
- **Peers.** Pick them from `sec_companies.csv` alone: same SIC code, closest
  `revenue` (latest annual revenue, in USD, not millions). `SPEC.md` gives the exact
  rule. That column is only for sizing peers; every number in the dashboard
  comes from the companyfacts endpoint. Read `sic` as text (some codes start
  with `0`), and skip rows with no ticker or with zero or negative revenue.

## Excel output

- Use **XlsxWriter** (`uv add xlsxwriter`). Charts must be native Excel charts
  that the student can click and edit, not pasted images.
- **Write values, not formulas.** Compute everything in Python. Formulas written
  by a library show no result until Excel recalculates, so you cannot check them.
- **Sheets:** The required sheets are `Overview`, `Data`, and `Sources`. During
  the spec interview, let the student decide whether to keep all charts on
  `Overview` or add extra sheets (for example, one sheet per ratio family).
- Excel charts need **wide** data: one row per year, one column per company. Keep
  a tidy long Data sheet, and write a wide block for each chart to point at.
- Include a Sources sheet: the XBRL tag used for each metric and company, a
  clickable link to each company's 10-K, the formula for each ratio, and the
  date the data was retrieved.
- Do not let charts overlap each other or the tables.
- **Open file lock on Windows:** If writing the `.xlsx` file fails with
  `PermissionError`, the student almost certainly still has the workbook open in
  Excel. Ask them to close the file in Excel so you can overwrite it.

## Verifying your work

You cannot see the charts, so check what you can and be honest about the rest.

- Since `XlsxWriter` is write-only, reopen the finished workbook using
  `openpyxl` (`uv add openpyxl`, for reading only) or Python's built-in
  `zipfile`/`xml` modules to confirm that the sheets, row counts, cell values,
  and chart counts match `SPEC.md`.
- Check against known values. Apple's fiscal 2024 (year ended 2024-09-28):
  revenue $391,035 million, net income $93,736 million.
- Then ask the student to open the workbook in Excel and look at the charts.
  Never claim the charts look right.

## Homework stage: LLM commentary

- Use Google's `google-genai` package (`from google import genai`), not the
  retired `google-generativeai`. Check the current documentation for the model
  name instead of guessing, and keep it in one constant.
- The key lives in `.env` as `GEMINI_API_KEY`. Never write it into code or print it.
- **Code does arithmetic; the LLM does judgment.** Compute every number in
  Python and pass the numbers to the LLM. Tell it to use only the numbers given.
- Prefer many small calls (one per ratio family or per company) over one huge prompt.
- If the key is missing or a call fails, the workbook must still be produced,
  with a note where the commentary would be.

## Extra credit stage: local web dashboard

- A small Flask or FastAPI backend that reuses the fetch and compute modules,
  plus one HTML page that calls it and draws the charts.
- Serve on `localhost` only. This is not to be deployed anywhere public.
- A server never exits, so **start it in the background** (`IsDaemon: true`) and
  **outside the sandbox** (`BypassSandbox: true` — a server started inside the
  sandbox cannot be reached from the student's browser), then test it with a
  request. Do not run it in the foreground and wait.
- If the port is already in use, an earlier copy is still running. Stop it, and
  tell the student how to stop the server when they are finished.
