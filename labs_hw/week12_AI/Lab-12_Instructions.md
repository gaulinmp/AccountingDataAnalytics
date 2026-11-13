# Lab 12: AI-Assisted Development (Vibe Coding a Peer Comparison Dashboard)

Lab 12 introduces you to using AI coding agents to build a real tool on your own computer. You will install one (the instructions use [Antigravity](https://antigravity.google/download) but you can use whatever you know or prefer), then work with its agent in two phases: first you and the agent write a plan for the tool (a *spec*), and then have the agent build it. The tool takes a stock ticker, finds the company's peers, pulls everyone's financial statement data straight from the [SEC](https://www.sec.gov/search-filings/edgar-application-programming-interfaces), computes ratios, and writes an Excel dashboard comparing them. In other words, it automates the comparison you did by hand in Project 1. The homework then adds a Large Language Model (LLM) that writes analyst commentary on the numbers your tool computed. This lab emphasizes learning to work effectively with AI coding assistants: planning before building, understanding when to trust AI output, and verifying what it made.

*Note*: This lab is meant to demonstrate the power of AI-assisted development. For those of you who haven't been using Python for these labs and homework, I want to clarify that you won't have to write any Python yourself, the agent will. You'll provide the design, the LLM will implement that design in code. So this lab isn't intended to force you to program, but instead demonstrate how AI tools can make development easier for beginners and experts alike. Your job is the part the AI can't do: knowing which ratios matter, what a sensible peer is, and whether the numbers that come out are right. {: .note}


[TOC]


## 1. Assignment

To complete this lab, complete the Canvas quiz by uploading three things: your spec (`SPEC.md`), your Excel dashboard, and a screenshot of the dashboard's Overview sheet open in Excel. The general steps will be:

1. *Antigravity Setup*: Install Antigravity and sign in with Google
2. *Starter Folder*: Download the starter folder, open it in Antigravity, and have the agent check your setup
3. *Write the Spec*: Have the agent interview you about what the tool should do, and write the answers down as `SPEC.md`
4. *Build from the Spec*: Have the agent implement `SPEC.md` and run its own checks
5. *Verify*: Open the workbook in Excel, check the numbers and charts, and take your screenshot

Your dashboard needs to meet these minimums (your spec can, and I hope will, go beyond them):

* One company of your choice plus at least 3 peers
* At least 5 fiscal years of data
* At least 4 ratios, from at least 2 different families (e.g., profitability, liquidity, leverage, efficiency)
* An Excel workbook with an *Overview* sheet (the headline comparison), a *Data* sheet (every number pulled), at least 2 charts, and a *Sources* sheet (where each number came from). I will only grade the *Overview* and *Data* sheets (plus your screenshot and `SPEC.md`), so how you organize the rest, whether you keep the charts on *Overview* or add extra sheets for each ratio family, is completely up to you
* At least 3 acceptance checks in your spec, including one number you looked up yourself in the company's 10-K

This lab demonstrates how AI tools can accelerate development workflows while teaching you to critically evaluate AI-generated solutions. You'll learn how to use LLMs to conduct tasks (here, vibe coding, but you can use the agent to write papers, create Excel files, or anything else your heart desires), to ask for clarification when you don't understand what it's asking for permission about, and how to troubleshoot when things don't work as expected. This lab is not meant to be a slog through programming and environment setup details, if you're stuck on anything before you get to the AI Agent step (or after as well, of course), don't hesitate and flag me down for help. I don't want you discouraged by computer shenanigans, but rather amazed by AI doing everything for you.


### 1.1. Learning objectives

By the end of this lab, you will be able to:

* Install and configure an AI-enabled code editor (Antigravity)
* Use an AI coding agent effectively to solve development problems
* Write a spec with an AI agent *before* any code is written, and judge whether the spec is good enough to build from
* Vibe-code an application from that spec
* Pull financial statement data from the SEC's public data service
* Export data and charts to usable formats (e.g., Excel)
* Verify and debug AI-built output using what you know about accounting


### 1.2. Rubric and grading

Your submission (`SPEC.md`, the Excel workbook, and the *Overview* screenshot) will be graded on:

1. *Excellent*: Complete, specific `SPEC.md` (with at least 3 acceptance checks including a verified 10-K number), and a clean, well-formatted Excel dashboard whose *Overview* and *Data* sheets and charts accurately reflect the spec.
2. *Good*: Working dashboard and spec with minor issues (e.g., a missing label, formatting clutter on *Overview*, or vague spec sections).
3. *Needs improvement*: Incomplete spec, broken or unreadable charts/tables on *Overview* or *Data*, or unverified numbers that do not match SEC filings.


### 1.3. Tools

This lab focuses on learning to use professional development tools with AI assistance:

* **[Antigravity](https://antigravity.google/)**: Google's free, agent-first code editor (a VS Code fork) with the AI agent built in. Sign in with a Google account and you're ready to rock
* **[uv](https://docs.astral.sh/uv/)**: A small tool that installs and runs [Python](https://www.python.org/) for you, so you never have to install Python yourself (if you're moving beyond Python, e.g. to Javascript for web dev, look into [pixi](https://pixi.prefix.dev/latest/) for similar but broader functionality)
* **[SEC EDGAR data](https://www.sec.gov/search-filings/edgar-application-programming-interfaces)**: The SEC's free service for the numbers companies report in their filings
* **[XlsxWriter](https://xlsxwriter.readthedocs.io/)**: A Python library that writes Excel workbooks, including real Excel charts


#### Alternatives

The lab is written for Antigravity because it is the simplest setup, but any AI coding agent that reads `AGENTS.md` works. Prompts in this lab are the same everywhere; only where you type them changes:

* **[VS Code](https://code.visualstudio.com/)**: Install it, sign in to GitHub, and use the built-in Copilot Chat in *Agent* mode (free for students via the [Student Developer Pack](https://education.github.com/pack)). Or install the Claude Code or Gemini Code Assist extension from the Extensions tab (Cmd/Ctrl+Shift+X)
* **[Claude Code](https://claude.com/product/claude-code)**: Use the Code tab in the downloaded [Claude desktop app](https://claude.com/download), pointed at the starter folder (needs a paid Claude plan), or install the VS Code extension
* **[Cursor](https://cursor.com/)**: A VS Code fork like Antigravity. Install, sign in, open the folder, and use the Agent chat panel (Cmd/Ctrl+L). Free tier is limited
* **[Gemini CLI](https://geminicli.com/)** / **[Codex](https://openai.com/codex/)**: Terminal tools. Open a terminal in the starter folder and run `gemini` or `codex`. For the comfortable-with-a-terminal crowd

*Note*: If you use something other than Antigravity, wherever the steps below say "the agent," read "your tool's agent chat." Section 3.1's install steps are Antigravity-specific; skip to step 3 (open the starter folder) once your tool is running. {: .note}


## 2. Background: AI-assisted development (vibe coding)

Modern software development increasingly involves AI coding assistants like [GitHub Copilot](https://github.com/features/copilot), [Claude](https://www.anthropic.com/claude), [Antigravity](https://antigravity.google/), and others. These tools can dramatically accelerate development by:

* Answering technical questions about libraries, syntax, and best practices
* Generating code for common patterns
* Generating specific code given more refined requests
* Running the code, reading the errors, and fixing them
* Explaining code in plain language

However, AI assistants have important limitations:

* *They can be confidently wrong*: output may look correct but contain bugs, such as a ratio with the wrong denominator timing
* *They don't understand your full context*: you need to tell them clearly and specifically what you want
* *They may suggest outdated approaches*: libraries and best practices evolve (e.g. yours might suggest the more popular `openpyxl` instead of `xlsxwriter` which handles charts better)
* *They can't replace understanding*: you still need to verify the output if you want to use it in a robust, professional environment

This lab gives you practice with AI assisted development, including:

1. Planning with the AI before it builds anything
2. Writing clear requests that specify what you need
3. Evaluating whether AI output makes sense
4. Testing and verifying AI-generated work
5. Debugging with natural language when things don't work


### 2.1. About spec-driven development

The most common way vibe coding goes wrong is not bad code, it's that the AI built the wrong thing. You type a two-sentence request, the agent fills in the hundred decisions you didn't make with its own guesses, and thirty minutes later you have something that runs but isn't what you wanted. Worse, you can't tell which of its guesses were wrong.

The fix is the same one you'd use with a new staff accountant: agree on the plan in writing before the work starts. In software that written plan is called a **spec** (short for specification). A spec says what the tool does, what goes in, what comes out, and how you'll know it works. For this lab the workflow is:

* *Interview*: the agent asks you questions, one at a time, and you make the decisions (which ratios, how to pick peers, what goes on each sheet in the output Excel file, etc.)
* *Spec*: the agent writes your answers into a file we'll call `SPEC.md`, you read it and ask for edits until you feel good about it. Importantly, the spec should include tests to verify that the agent's code properly fulfills the requirements
* *Build*: the agent implements the spec, and nothing but the spec
* *Verify*: the agent runs the tests written in the spec, and then you check what it can't

A good spec is specific enough that a different AI (or a human, if we're feeling anachronistic) could build the same tool from it without asking you anything. "Compare profitability" is not a spec. "Gross margin = (Revenue - Cost of Revenue) / Revenue, for the last 5 fiscal years, shown as a line chart with one line per company" is.

This is a practical, real-world approach to AI development because:

* *You stay in charge*: the accounting decisions are yours, written down, and not left to the AI's guesses
* *Debugging gets easier*: when something is wrong, you can ask "does this match the spec?" If it doesn't, the code is wrong. If it does, the spec is wrong. Either way you know where to look
* *It's reusable*: the homework adds to this same spec instead of starting over
* *It's how professionals use these tools*: the people getting the most out of coding agents spend most of their effort on the plan (see, e.g., [spec-kit](https://github.com/github/spec-kit))

The piece of the spec that is critical is the **acceptance checks**: specific, checkable statements of what "working" means. For example, "Apple's fiscal 2024 revenue shows as $391,035 million" or "a ticker that doesn't exist prints a clear message instead of crashing." The agent can run these itself, which means it can catch and fix its own mistakes before you ever see them.


### 2.2. Where the data comes from: the SEC's data service

We've used Compustat all semester, which is a paid, cleaned-up version of what companies file with the SEC. The SEC also hosts the raw version publicly (for free!). Since 2009, companies have had to tag every number in their financial statements with a standard label (a system called [XBRL](https://www.sec.gov/data-research/structured-data/inline-xbrl)), so that "Revenue" in Apple's 10-K and "Revenue" in Dell's 10-K can be found by a computer, not just read by a human.

The SEC makes those tagged numbers available through an **API** (Application Programming Interface), which is just a web address that returns data instead of a web page meant for reading. You can try it right now: [this link](https://www.sec.gov/files/company_tickers.json) returns every ticker the SEC knows about. It's ugly, but it's ugly in a perfectly consistent way, which is exactly what computers excel at (this is semi-structured data!).

A few things about the SEC's data that you (not just the agent) should know:

* *It's free and needs no account*, but the SEC requires every request to say who is asking, with a name and email. Your agent will ask you for these.
* *There's a speed limit* of 10 requests per second. Your tool will save what it downloads, so it only has to ask once.
* *The labels are messy.* Companies choose their own tags, so revenue might be `Revenues` at one firm and `RevenueFromContractWithCustomerExcludingAssessedTax` at another. This is the single most likely reason for a blank cell in your dashboard, and it's a great example of why you need to look at the output with an accountant's eye.
* *Industry codes.* The SEC classifies companies by [SIC code](https://www.sec.gov/search-filings/standard-industrial-classification-sic-code-list), which is how your tool will find peers. The starter folder includes a file, `sec_companies.csv`, that lists every ticker with its SIC code and latest revenue so your tool can pick same-industry companies of similar size.


## 3. Step-by-step instructions

This lab walks you through setting up a complete development environment using AI assistance, then planning and building the Excel dashboard.



### 3.1. Install Antigravity

[Antigravity](https://antigravity.google/) is Google's free code editor with an AI agent built in. Because it's a fork of VS Code, it looks and behaves like VS Code, but there are no extensions to install and no GitHub account needed. The agent can answer questions, write, edit, and debug code, and run scripts (like Python), meaning you could conceivably never touch the command line yourself and just interact with the agent in plain English.


1. **Download and install Antigravity**
    * Go to [antigravity.google/download](https://antigravity.google/download)
    * Download the installer for your operating system (Windows, Mac, or Linux)
    * Run the installer and follow the prompts (default settings are fine)
    * Launch Antigravity when installation completes

2. **Sign in with Google**
    * Follow the first-run setup. Defaults are fine, and when asked, sign in with your Google account (a personal account is simplest, and [students can get free AI pro access](https://gemini.google/students/))
    * Antigravity may offer to import settings from VS Code, which is useful if you already have used VS Code and want to keep your preferences

3. **Download and open the starter folder**
    * Download [comp-dashboard-starter.zip](https://github.com/gaulinmp/AccountingDataAnalytics/raw/main/labs_hw/week12_AI/comp-dashboard-starter.zip) (also posted on Canvas with this lab)
    * Unzip it somewhere you can find it again, such as your class folder
    * Open the unzipped `comp-dashboard-starter` folder in Antigravity: either choose *File > Open Folder* in the editor window, or click **Projects** in the left-hand sidebar of the main agent window and add the folder there. Both views share the same agent, so use whichever interface you prefer as long as `comp-dashboard-starter` is the active project
    * If it asks whether you trust the authors of the files in this folder, say yes (it's me, and I think I'm trustworthy)
    * You should see a handful of files in the folder (`AGENTS.md`, `SPEC_TEMPLATE.md`, `sec_companies.csv`, etc.). The important one is `AGENTS.md`, which is a set of instructions I wrote for your agent. The agent reads it automatically, and it's why it will already know to plan first, where the SEC data lives, and which mistakes to avoid. Have a read through it, it's written in plain English. Also you should get your AI agents to create these `AGENTS.md` files for any new projects you start, they are incredibly helpful for customizing the agent's functionality and making them actually useful for your specific work

4. **Open the agent and test it**
    * Start a new conversation in the agent chat (either in the central chat canvas or the right-hand sidebar chat panel in the editor)
        * You may need to click some approval dialogs the first time you open it
    * Verify it works by asking it to perform a simple task: "list the files in the current directory"
    * If it asks about permissions for running terminal commands, the default "ask me first" (or "proceed in sandbox") setting is what you want

5. **Have the agent check your setup**
    * You do not need to install Python. A tool called `uv` does that for us, and the agent can install `uv`
    * Ask the agent: "Check whether uv is installed, and install it if it isn't. Then run `uv run python --version` to confirm Python works."
    * It will ask permission to run a command or two (including running outside the sandbox so it can reach the internet). Say yes
    * If it installs `uv` and then says it can't find it, that's normal: **quit Antigravity completely, reopen it, open the folder again, and repeat the request**. A freshly installed tool doesn't show up until the program restarts
    * You're done with setup when the agent shows you a Python version number (something like `Python 3.13.1`)

*Note*: By default, Antigravity runs commands inside a **sandbox** which is a secure, fenced-off environment that can only touch your project folder and has no internet access. This keeps you safe because a mistake (or a confused AI) can't accidentally delete your personal files or send private data online. Whenever the agent genuinely needs the internet (like installing `uv`, downloading Python packages, or pulling SEC filings) it will ask your permission to run that specific command outside the sandbox. {: .note}




### 3.2. Write the spec with the agent

This is the most important part of the lab, and you won't write (or generate) a single line of code in it. You and the agent are going to agree on exactly what gets built.

1. **Pick your company**
    * Any US public company works. One you analyzed in Project 1 is a good choice, since you already know what its numbers should look like
    * Have its most recent 10-K handy (search the company on [EDGAR](https://www.sec.gov/edgar/search/)). You'll need one or two numbers from it for your acceptance checks

2. **Start the interview**
    * Ask the agent (change the part in square brackets [] to your company):

    ```
    Read AGENTS.md and SPEC_TEMPLATE.md. I want to build the peer comparison
    dashboard for [AAPL].

    Interview me one question at a time to fill in the spec, and suggest a
    sensible default with each question. Do not write any code yet.

    When we have covered every section, save the result as SPEC.md.
    ```

    *Tip*: Most AI coding tools also have built-in shortcuts you can type right in the chat box. Typing `@` lets you attach specific files directly to your message (e.g., `@AGENTS.md` and `@SPEC_TEMPLATE.md`). Typing `/` brings up **slash commands** which are pre-built skills for common tasks. For example, Antigravity has `/grill-me` (which tells the agent to interview you to resolve design decisions) and `/plan` (which puts the agent into a step-by-step planning mode before writing code; `/plan` also works in Claude Code!). Other editors like Cursor and VS Code Copilot have their own `/` commands and `@` mentions, so taking two minutes to explore what pops up when you type `/` or `@` will make you much faster in any tool. {: .tip}

3. **Answer the questions like an accountant**
    * The agent will ask about things like which ratios, how to choose peers, how many years, and what goes on each sheet. In Antigravity, it may ask using clickable multiple-choice cards (with a `(Recommended)` option first and an "Other" box where you can type your own answer) or in plain text. Either way, it will suggest defaults, and choosing the recommended default is fine for many of them
    * But this is where your expertise comes in, so don't just say yes to everything. Some decisions worth actually thinking about:
        * *Peers*: The same 4-digit SIC code is a narrow industry, the first 2 digits is a broad one. Closest in revenue? How many? Is there a company you know belongs in the list regardless of what the rule picks?
        * *Ratios*: Which ones actually matter for this industry? Inventory turnover means a lot for Walmart and nothing for a software company
        * *Overview and extra sheets*: If a manager only looked at the *Overview* sheet for 30 seconds, what should they see? And do you want your charts right on *Overview*, or on separate sheets for each ratio family (e.g., *Profitability*, *Leverage*)? Remember, I am only grading the *Overview* and *Data* sheets, so any extra sheets are completely up to you
    * If you don't understand a question, say so: "I don't know what that means, explain it and recommend an option"

4. **Read `SPEC.md` and push back**
    * When the agent saves `SPEC.md`, open it (click it in the file list) and actually read it. This is what you're submitting, and it's what gets built
    * Check that it meets the minimums in [Section 1](#1-assignment)
    * Then ask the agent to poke holes in its own work. Some prompts I find useful:
        * "What in this spec is ambiguous? What would a different developer have to guess at?"
        * "For each ratio, show me the exact formula and which reported items it uses"
        * "What happens if a peer doesn't report one of these items?"
    * Add your own acceptance check: look up a number in your company's 10-K (total revenue is the easy one) and tell the agent: "add an acceptance check that [company]'s fiscal [year] revenue equals [number from the 10-K]"
    * Keep going until you'd be comfortable handing the spec to someone else to build

*Tip*: The interview should feel like a conversation, not a form. If the agent dumps ten questions on you at once, tell it: "one question at a time, please." If it starts writing code, tell it: "stop, we're still writing the spec." {: .tip}



### 3.3. Build the dashboard from the spec

Now the fun part. You might be thinking "but I haven't installed anything except Antigravity, how can code run?" Great question! The point of vibe coding with the agent is that it will install what it needs (using `uv`), write the code, run it, read its own errors, and fix them. What a world!

1. **Give the go-ahead**
    * Ask the agent:

    ```
    Implement SPEC.md. When you are finished, run every acceptance check in
    the spec and show me the results.
    ```

2. **Babysit the agent as it writes the code**
    * As the agent chugs away, it may ask you questions, or for permission to create files and run commands (including running outside the sandbox when it installs packages or calls the SEC API). Be responsive and guide it as needed, but if it wants to run some commands that you do not recognize, ask it "what does that command do?" before allowing it. If you want a second opinion, copy the command into a web-based LLM chat (e.g. ChatGPT, Claude, Gemini) and ask there
    * Early on it will ask for your name and email. That's for the SEC's "who is asking" requirement from [Section 2.2](#22-where-the-data-comes-from-the-secs-data-service), and it gets saved in a file called `.env` on your computer
    * This step takes a while (10 to 20 minutes is normal). The agent will write several files, run them, hit errors, and fix them. That's it working as intended, not a sign something is wrong

3. **Look at the acceptance checks**
    * When the agent says it's done, it should show you each acceptance check and whether it passed
    * If any failed, tell it: "acceptance check [N] failed, fix it and run all the checks again"
    * If it didn't show you the checks at all, ask: "run the acceptance checks in SPEC.md and show me the output of each one"

4. **Open the workbook and check it yourself**
    * Find the Excel file in the folder (ask the agent "where is the output file?" if you can't see it) and open it in Excel
    * The agent can read the numbers in the workbook, but it *cannot see the charts*. You are the only one who can tell whether they look right. Look for:
        * Charts that are empty, or overlapping each other
        * A company missing from a chart, or blank cells where you expected numbers
        * Numbers that can't be right (a gross margin of 400%, a current ratio of exactly zero)
        * Fiscal years that are off by one
    * Spot check one more number against the 10-K, one that *isn't* already an acceptance check
    * Check the *Sources* sheet. Does each number say where it came from?

5. **Debug and refine**
    * **Close the workbook in Excel first!** On Windows especially, Excel locks any file you have open, so Python will fail with a "Permission denied" error if the agent tries to overwrite the workbook while you're still looking at it
    * Tell the agent what you saw, as specifically as you can:
        * "the gross margin chart on the Overview sheet (or your Profitability sheet) is empty" is good
        * "the charts are broken" is too vague, but it's worth trying once to see what happens
    * For blank cells: "[TICKER] has no revenue in the Data sheet. Check which revenue tags that company actually reports and update the tag list"
    * If you want to change *what the tool does* (a new ratio, a different peer rule, a different chart), change the plan first: "update SPEC.md to add [the change], then implement it." The spec should always describe what you actually built
    * Keep iterating until the workbook is something you'd be willing to show a manager

6. **Submit**
    * Take a screenshot of the *Overview* sheet open in Excel
    * Upload `SPEC.md`, the Excel workbook, and the screenshot to the Canvas quiz


## 4. Technical guidance

This section provides additional context and troubleshooting tips for working with the agent.


### 4.1. Effective agent prompting

Getting good results from the agent requires clear, action-oriented prompts. Here are tips:

* Good agent prompts are:
    * *Direct*: Tell the agent what to do, not ask how to do it
    * *Action-oriented*: "create a file..."; "run the script..."; "update the spec..."
    * *Specific about outcomes*: "put the peer median next to each ratio on the Overview sheet" not "make it better"
    * *Anchored to the spec*: "that doesn't match section 5 of SPEC.md" is the fastest way to get a fix

* Follow up on prompts
    * Try out what the agent creates, then ask for fixes if it doesn't work (see below)
    * Review what the agent did and ask for explanations: "explain what you just built, in terms an accountant would understand"
    * Ask for new features, or for features to work better/more simply
    * Iterate until satisfied


### 4.2. Troubleshooting with the agent

When things go wrong, the agent can help fix issues directly:

* `uv` is "not recognized" or "command not found"
    * Quit Antigravity completely and reopen it, then try again. This fixes it almost every time
    * If it still isn't found, tell the agent: "uv was installed but isn't being found, figure out where it was installed and fix it"

* "PermissionError" or "Permission denied" when saving the Excel file
    * You still have the `.xlsx` file open in Excel! Close the file in Excel and tell the agent to try again

* The SEC refuses the request (a "403" error)
    * This means the SEC didn't get a name and email with the request
    * Tell the agent: "the SEC is returning 403, check that the User-Agent from .env is being sent with every request"

* Blank cells or a missing company
    * Usually the company uses a different label for that item (see [Section 2.2](#22-where-the-data-comes-from-the-secs-data-service))
    * Tell the agent: "[TICKER] is missing [item]. Look at what that company actually reports and add the right tag"
    * Sometimes the company genuinely doesn't report the item (banks don't report cost of goods sold). A blank cell is the right answer then, and a zero is not

* Numbers don't match the 10-K
    * Tell the agent exactly what you see: "the dashboard shows [X] for fiscal 2024 revenue, the 10-K says [Y]"
    * Common causes: a quarterly number picked up as an annual one, or the fiscal year labeled one year off

* Script not working or has errors
    * Simply tell the agent: "the script has an error, please fix it"
    * The agent can see the error output and will modify the code
    * If the agent's fix doesn't work: "that didn't fix it, try a different approach"

* The agent goes in circles
    * If it has tried the same fix three times, stop it and start a new chat. Tell the new chat: "Read AGENTS.md and SPEC.md, then look at the existing code. [Describe the problem.]" A fresh start with a written spec is often faster than arguing, and it's one more reason the spec is worth having

* General debugging approach with the agent
    1. Describe the problem, specifically: "the chart for Leverage is missing"
    2. The agent will try to fix it
    3. If the fix doesn't work: "that didn't solve it, try another approach"
    4. Ask for explanations: "explain what you changed and why"
    5. Ask it to re-run the acceptance checks, to make sure the fix didn't break something else
    6. Iterate until it works
    7. Ask me for help if you're stuck!


*Tip*: The agent can access files, run commands, and see output automatically. You shouldn't need to copy/paste error messages, just describe what's wrong and the agent will investigate. The one thing it can't see is what the workbook looks like in Excel, so that part you do have to describe. {: .tip}



### 4.3. Understanding what the agent creates

When the agent builds your dashboard tool, the key concepts are the same as in traditional coding:

* Command-line interface (CLI)
    * The agent (or you, as you get more advanced) needs to run the Python script somehow. A command-line interface is a common way to do this. It's kind of like when you run an app on your computer, but instead of clicking an icon, you type commands in a terminal window.
    * Taking arguments (like the ticker, or `--years 10`) makes the script flexible, acting like different settings for the same app. The same tool works for Apple or for Ford.

* `uv` and packages
    * Python on its own can't write Excel files or talk to websites. Those abilities come from *packages*, which are add-ons other people wrote
    * `uv` downloads Python and the packages into this one folder, so nothing else on your computer is affected. If it all goes wrong, you can delete the folder and start over

* APIs and JSON
    * Your tool asks the SEC for data by requesting a specific web address, one per company
    * The answer comes back as **JSON**, a text format for structured data (think of it as nested bullet points that a program can read)
    * The tool saves each answer in a `cache` folder, so the second run is fast and doesn't bother the SEC again

* XBRL tags
    * Every number in the SEC's data has a tag (like `NetIncomeLoss` or `AssetsCurrent`), a period, and a value
    * Your tool's job is mostly bookkeeping: find the right tag, keep only the annual values, line up the years across companies, and compute the ratios

* Separate pieces
    * Your agent was told (in `AGENTS.md`) to keep fetching data, computing ratios, and writing Excel in separate files. That's so the homework can reuse the first two without touching them

* Data export
    * Once the script computes the numbers, it needs to save them in useful formats
    * Excel format (`.xlsx`) because we're Accountants, and it's just the best for viewing data in rows and columns, sorting, filtering
    * The charts are real Excel charts pointing at cells in the workbook. You can click on one and restyle it like any chart you made yourself



### 4.4. Going further (optional improvements, if you're feeling adventurous)

If you want to explore more, try asking the agent to add more features. Remember to have it update `SPEC.md` first! Here are some example prompts:

1. **Add command-line options**:
    * `add a --peers option so I can list my own peers instead of the automatic ones`
    * `add a --years option to control how many fiscal years are included`

2. **Deeper analysis**:
    * `add a DuPont decomposition of ROE (on Overview or a dedicated Profitability sheet)`
    * `add common-size income statements for each company`
    * `rank each company on each ratio, and color the best and worst on the Overview sheet`

3. **Better presentation**:
    * `add conditional formatting to the Overview sheet so ratios worse than the peer median are highlighted`
    * `add small trend lines (sparklines) next to each ratio on the Overview sheet`

4. **Add project documentation**:
    * `create a README.md that explains how to run this tool, written for an accountant`

5. **Add LLM commentary** (spoiler alert: this is the homework!):
    * `update SPEC.md section 10, then add Gemini LLM commentary (https://github.com/googleapis/python-genai) on the Overview sheet that interprets the computed ratios`
    * The key idea: *code does the arithmetic, the LLM does the judgment*. Your tool computes every number, and hands those numbers to the LLM to interpret. You never ask an LLM to do the math
    * Also consider `add instructions to automate as much of the generation of the API key as possible, to make it user friendly to non-technical users`

6. **Turn it into a website** (spoiler alert: this is the homework's extra credit!):
    * `add a local web version: a small Python web server that reuses the existing code, and a page where I can type any ticker and see the comparison`
    * This runs only on your own computer (the address will start with `localhost`), which is all we want. Note that in Antigravity, the agent must start this local server in the background and *outside* the sandbox so your web browser can reach it


### 4.5. Responsible use checklist

*Note*: This lab is intended to show you the very basics of vibe coding and pulling public data, and as such shouldn't raise many ethical concerns. However, these considerations are relevant if you take this further, on other data sources or at work. {: .note}

Before building a tool like this, ask yourself:

<input type="checkbox" /> Could this data be obtained through an official [API](https://en.wikipedia.org/wiki/API)? (always prefer APIs to scraping web pages) <br />
<input type="checkbox" /> Have I read the data provider's rules? (the SEC's are [here](https://www.sec.gov/search-filings/edgar-search-assistance/accessing-edgar-data)) <br />
<input type="checkbox" /> Am I identifying myself honestly and making requests at a reasonable rate? <br />
<input type="checkbox" /> Am I only using public data? (not bypassing a login or paywall) <br />
<input type="checkbox" /> Are my passwords and API keys kept out of the code and out of anything I share? <br />
<input type="checkbox" /> Am I keeping confidential or client data out of AI tools that aren't approved for it? <br />
<input type="checkbox" /> Have I verified the output against a source I trust before relying on it? <br />
<input type="checkbox" /> Could I explain to a manager or an auditor where every number came from? <br />
