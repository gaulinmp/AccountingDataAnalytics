# Peer comparison dashboard: starter folder

Starter files for ACCTG 5150 Lab 12. You will use an AI coding agent to build a
tool that takes a stock ticker, finds the company's peers, pulls their financial
data from the SEC, and writes an Excel dashboard comparing them.

## What is in this folder

| File | What it is for |
|------|----------------|
| `AGENTS.md` | Instructions your coding agent reads automatically. You do not need to edit it. |
| `SPEC_TEMPLATE.md` | The outline of the plan you and your agent will write together. |
| `sec_companies.csv` | Every SEC-listed ticker with its company name, industry (SIC) code, latest annual revenue, and the accession number of the 10-K that revenue came from (which builds a link to the filing). |
| `.env.example` | A template for your settings (your name and email for the SEC, and later an API key). |
| `pyproject.toml` | Tells the Python tooling this folder is a project. Your agent manages it. |

## How to start

1. Unzip this folder somewhere you can find it again, such as Documents.
2. In VS Code, choose **File > Open Folder** and pick this folder.
3. Open your coding agent's chat panel, in agent mode.
4. Follow the lab instructions from there. Your first prompt will ask the agent
   to interview you and write `SPEC.md`. It should not write any code yet.
