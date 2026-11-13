# Spec: peer comparison dashboard

*Your coding agent fills this in by interviewing you, and saves the result as
`SPEC.md`. You submit `SPEC.md`. A good spec is specific enough that a different
person (or agent) could build the same tool from it without asking you anything.*

## 1. Goal

One or two sentences. Who uses this tool, and what decision does it help them make?

## 2. Inputs

- How the user names the company (ticker on the command line).
- Optional settings: number of years, a list of peers to use instead of the
  automatic ones, a refresh flag, the output file name.
- An example of the exact command the user runs.

## 3. Peer selection

The rule for choosing peers automatically. Be exact:

- Same industry at what level (4-digit SIC, or the broader 2-digit group)?
- How size is measured, and how close a peer has to be.
- How many peers, and what happens if too few companies qualify.

## 4. Data sources

Each SEC endpoint or file the tool reads, and what it takes from it.

## 5. Metrics

One row per metric. Include the raw items as well as the ratios.

| Metric | Formula | XBRL tags (in the order to try them) |
|--------|---------|---------------------------------------|
| | | |

## 6. Output workbook

One row per sheet: what is on it, and for charts, the chart type and what it compares.
`Overview`, `Data`, and `Sources` are required; you can keep your charts on
`Overview` or add extra sheets (for example, one sheet per ratio family).

| Sheet | Contents |
|-------|----------|
| Overview | |
| Data | |
| *(optional extra sheets)* | |
| Sources | |

## 7. Acceptance checks

How you will know it works. Each check needs an expected result that can be
looked up or counted, for example:

- A known number: "Apple fiscal 2024 revenue is $391,035 million."
- A structural check: "The workbook has the expected sheets and at least 2 charts."
- A behavior check: "A ticker that does not exist prints a clear message and
  does not crash."

## 8. Out of scope

What this tool deliberately does not do. This keeps the agent from building
extra things you did not ask for.

## 9. Assumptions and open questions

Anything you and the agent were unsure about, and what you decided.

## 10. LLM commentary (homework)

Leave blank for the lab.

- What the LLM is asked to write, and where it appears in the workbook.
- Exactly which numbers are sent to it.
- What is computed by code and what is left to the LLM's judgment.
- What happens when the LLM call fails.

## Changes

Anything the build did differently from the spec above, and why.
