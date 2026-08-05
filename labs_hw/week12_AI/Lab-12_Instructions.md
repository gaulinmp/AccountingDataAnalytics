# Lab 12: AI-Assisted Web Scraping

Lab 12 introduces you to using AI tools ([GitHub Copilot](https://github.com/features/copilot) or [Antigravity](https://antigravity.google/)) to assist with development environment setup, coding, and web scraping tasks. You will install and configure [VS Code](https://code.visualstudio.com/), use Copilot Chat to install [Python](https://www.python.org/) and web scraping tools, and then build a scraper using [Playwright](https://playwright.dev/) to collect data from a provided URL (using an event site as my example) and export it. This foundational scraper will then be enhanced in the homework using Large Language Models (LLMs) to automatically adapt to any site layout. This lab emphasizes learning to work effectively with AI coding assistants, understanding when to trust AI suggestions, and developing the skills to verify and debug AI-generated code.

*Note*: This lab is meant to demonstrate the power of AI-assisted development. For those of you who haven't been using Python for these labs and homework, I want to clarify that using Copilot to install, write, run, and test python code is far easier than doing it more manually, e.g. in Colab. This lab isn't intended to force you to learn to program, but instead demonstrate how AI tools can make development easier for beginners and experts alike. Focus on learning to use Copilot effectively rather than struggling with low-level Python details. {: .note}


[TOC]


## 1. Assignment

To complete this lab, complete the Canvas quiz by uploading your final working python script, and your excel output. The general steps will be:

1. *VS Code Setup*: Install Visual Studio Code and GitHub Copilot extension
2. *Python Environment*: Use Copilot Chat to guide installation of Python and virtual environment setup using Minoconda
3. *Playwright Installation*: Install Playwright web scraping framework with Copilot's assistance
4. *Scraper Implementation*: Build a command-line scraper that extracts data from a provided URL (using an event site as an example)
5. *Data Export*: Export scraped data to Excel formats for analysis


This lab demonstrates how AI tools can accelerate development workflows while teaching you to critically evaluate AI-generated solutions. You'll how to use LLMs to conduct tasks (here, vibe coding, but you can use copilot to write papers, create excel files, or anything else your heart desires), to ask for clarification when you don't understand what it's asking for permission about, and how to troubleshoot when things don't work as expected. This lab is not meant to be a slog through programming and environment setup details, if you're stuck on anything before you get to the AI Agent step (or after as well, of course), don't hesitate and flag me down for help. I don't want you discouraged by computer shenanigans, but rather amazed by AI doing everything for you.


### 1.1. Learning objectives

By the end of this lab, you will be able to:

* Install and configure Visual Studio Code as a development environment
* Use GitHub Copilot Chat effectively to solve development problems
* Vibe-code an application
* Scrape data from websites starting from a URL
* Export data to usable formats (e.g., Excel)
* Debug issues with AI assistance


### 1.2. Tools

This lab focuses on learning to use professional development tools with AI assistance:

* **[VS Code](https://code.visualstudio.com/)**: A powerful, free code editor from Microsoft
* **[GitHub Copilot](https://github.com/features/copilot)**: AI pair programmer that provides code suggestions and answers questions
* **[Python](https://www.python.org/)**: Programming language for scripting and data manipulation
* **[Playwright](https://playwright.dev/)**: Modern web automation and scraping framework
* **[pandas](https://pandas.pydata.org/)**: Data manipulation library for Python


## 2. Background: AI-assisted development (vibe coding)

Modern software development increasingly involves AI coding assistants like [GitHub Copilot](https://github.com/features/copilot), [Claude](https://www.anthropic.com/claude), [Antigravity](https://antigravity.google/), and others. These tools can dramatically accelerate development by:

* Suggesting code completions as you type
* Answering technical questions about libraries, syntax, and best practices
* Generating code for common patterns
* Generating specific code given more refined requests
* Explaining code in plain language
* Debugging errors by analyzing error messages

However, AI assistants have important limitations:

* *They can be confidently wrong*: suggestions may look correct but contain bugs
* *They don't understand your full context*: you need to provide clear, specific prompts
* *They may suggest outdated approaches*: libraries and best practices evolve (e.g. yours will probably use the old `google-generativeai` library instead of the newer `google-genai`)
* *They can't replace understanding*: you still need to verify and understand the code if you want to use it in a robust, professional environment

This lab gives you practice with AI assisted development, including:

1. Writing clear prompts that specify what you need
2. Evaluating whether AI suggestions make sense
3. Testing and verifying AI-generated code
4. Debugging with natural language when code doesn't work


### 2.1. About web scraping (with an event scraper example)

For this lab, you'll build a tool that scrapes data from a given URL. You can prompt your AI agent to scrape any website you wish (e.g., great time to get data for Project 4), all the Lab & Homework submissions will require is your python code, and output Excel file. To provide an example, below I've given instructions for scraping a Salt Lake City events page. The general steps will be:

* Start with a URL for the site (or sites) you wish to scrape
* Extract data from the site (e.g., event names, dates, locations, and URLs for an event site)
* Optionally add relevent data (e.g., adding categories to the events based on their text)
* Export the extracted records to Excel for further use (in my code, I asked it to also export to an ical file so I could import the events into a calendar)

This is a practical, real-world application because:

* *Useful output*: You could actually use the resulting spreadsheet to track data or events
* *Flexible design*: By starting with a different event URL, you could target different locations, event types, etc. The homework will further increase this flexibility by using LLMs to parse the site data regardless of its exact HTML structure
* *Professional patterns*: Command-line interface, argument parsing, error handling.
* *Educational value*: Demonstrates software development with AI assistance and sets up a foundation for AI-assisted parsing in the homework

Example sites you might target to scrape include:

* SEC [EDGAR](m for firm filings
* Sports stats sites (note that this might be hard if the site tries to block bots / scrapers)
* Bitcoin price history from [Yahoo Finance](https://finance.yahoo.com/quote/BTC-USD/history/?p=BTC-USD)
* Desktop wallpapers (e.g., [Unsplash](https://unsplash.com/t/wallpapers))


*Note*: Always check a website's `robots.txt` file and terms of service before scraping ([explanation](https://en.wikipedia.org/wiki/Robots.txt)). Be respectful and don't make too many requests too quickly. {: .note}


### 2.2. What is web scraping?

**Web scraping** is the automated process of extracting data from websites. While humans browse websites and read information, web scrapers programmatically download web pages, parse the HTML structure, and extract specific data elements.

Common use cases include:

* Price monitoring to track competitor pricing across e-commerce sites
* Market research to collect product reviews, ratings, and customer feedback
* Lead generation to gather business contact information
* Financial analysis to extract financial data from company websites
* Academic research to collect data for research studies
* News aggregation to monitor news sources for relevant stories
* Project 4 maybe?


**Ethical and Legal Considerations:**

* Respect robots.txt which tells scrapers which parts of a site can be accessed
* Check terms of service, as some sites explicitly prohibit scraping
* Rate limiting avoids overwhelming servers with too many requests
* Personal data is sensitive, be careful with personally identifiable information (GDPR, etc.)
* Copyright may apply to scraped content, which makes it legally protected
* Authentication should be legitimate, don't scrape behind login walls without permission/paying


**Why Playwright?**

We're using **Playwright** instead of simpler tools like `requests` + `BeautifulSoup` because it handles JavaScript-rendered content, is reliable and fast (developed by Microsoft and used in production environments), can be run "headed" which means you can watch the browser window as it operates, and works with Chrome, Firefox, Safari, etc. 

If you don't want to use Playwright, you could try using `requests` + `BeautifulSoup`, but you'll likely run into issues with modern websites that heavily rely on JavaScript for content rendering.


## 3. Step-by-step instructions

This lab walks you through setting up a complete development environment using AI assistance, then building a web scraper.



### 3.1. Install VS Code and GitHub Copilot

VS Code is a free & wonderful code editor from Microsoft that has quickly become one of the most widely used code editors. GitHub Copilot is an AI pair programmer that provides code suggestions and answers questions directly in the editor, and can directly write, edit, and debug code for you, as well as run scripts (like python), meaning you could conceivably never touch the command line yourself, and just interact with copilot in plain English.


1. **Download and install VS Code**
    * Go to [code.visualstudio.com](https://code.visualstudio.com/Download)
    * Download the installer for your operating system (Windows, Mac, or Linux)
    * Run the installer and follow the prompts (default settings are fine)
    * Launch VS Code when installation completes

2. **Sign in to GitHub** (required for Copilot)
    * If you don't have a GitHub account, create one at [github.com](https://github.com/signup)
    * In VS Code, click the account icon in the bottom-left corner
    * Choose "Sign in with GitHub" and follow the authentication flow
    * Verify you're signed in (your GitHub username should appear in the bottom-left)

3. **Activate GitHub Copilot**
    * (Optional) As a student, you get free access to GitHub Copilot. Go to [education.github.com/pack](https://education.github.com/pack) and sign up for the Student Developer Pack
    * Install the "GitHub Copilot" and "GitHub Copilot Chat" in VSCode by clicking [this link](vscode://github.copilot-chat) (if it works on your computer) or manually installing extensions:
        * Click the Extensions icon in the left sidebar (or press `Ctrl+Shift+X`/`Cmd+Shift+X`)
        * Search for "GitHub Copilot"
        * Click "Install" on both "GitHub Copilot" and "GitHub Copilot Chat"
    * After installation, you may need to restart VS Code

4. **Test Copilot Chat**
    * Open Copilot Chat by clicking the chat icon in the left sidebar (or press `Ctrl+Alt+I`/`Cmd+Ctrl+I`)
        * You may need to click some approval dialogs the first time you open it
    * Type a test question, such as "What are some tips and tricks for using Copilot effectively?"
    * Verify you get a response
  
5. **Enable Agent Mode**
    * In Copilot Chat, click the Down arrow next to the "Send" button, and select "Agent"
    * Verify that Agent mode is enabled by asking it to perform a simple task: "list the files in the current directory"

6. **Check Python installation**
    * Python may already be installed on your system
    * Ask Copilot: "check for an existing python installation"
    * If Python is not installed, or you want to set up a clean, platform-agnostic environment, you should use Miniconda:
        * *Option A (Recommended - Agent Mode):* Ask Copilot Agent: "Help me install python by first installing Miniconda (https://www.anaconda.com/docs/getting-started/miniconda/install/overview)."
        * *Option B (Manual):* Follow instructions online to install [Miniconda](https://www.anaconda.com/docs/getting-started/miniconda/install/overview).
    * Verify that python is installed, by asking Copilot: "what's my python version?" or running `python --version` in a terminal (open a terminal in VS Code ``Ctrl+` ``, which is control key and the backtick key, on both Windows and Mac (a rare instance of `ctrl` not `cmd` on Mac))

*Note*: You could also use other AI coding assistants like [Antigravity](https://antigravity.google/) which is Google's version of VSCode, or if you're fancy, [Gemini CLI](https://geminicli.com/) or [Claude Code](https://claude.com/product/claude-code). {: .note}



### 3.2. Build a web scraper with Copilot Agent

This is where you'll use Copilot Agent to build a complete scraping script. You'll provide the high-level requirements and let Copilot create, run, and debug the code for you. You might be thinking "but I haven't done anything yet, how can code run?" Great question! The point of vibe coding with Copilot Agent is that we will ask it to, as part of the scraping script we write, add some code to automatically install the required software we need to do the scraping. What a world!

This whole lab basically boils down to the prompt that you will give to Copilot Agent. Everything else is just scaffolding to get you to this point. Below is an example prompt, but feel free to modify it as you see fit. The key is to be as clear and specific as possible about what you want the scraper to do.


1. Ask Copilot to make a new folder and open it as a workspace in VS Code
    * "create a new folder called scraper_lab and open it as a workspace in VS Code"
2. **Create the web scraper**:
    * Ask Copilot Agent (change the part in square brackets [] to match your interests): 
    
    ```
    Build a Python one-file script that scrapes [event data from the event site: https://www.visitsaltlake.com/events/] and exports it. The script should have a good software architecture, and should be easy to maintain and update (e.g. passing the content of the website into an LLM api call, down the line, to have it extract the data flexibly).

    First, install all dependencies including playwright, pandas, and openpyxl, then install Playwright's chromium browser.

    Then, write the single-file python script that has a CLI interface using `click`, to:
    
    * take the hard-coded `url` (e.g., `[https://www.visitsaltlake.com/events/]`). There should be an optional --url flag to specify a different url.
    * open the page using Playwright
    * extract relevant information ([such as event name, date, location, event type/category, event URL])
    * export the results to an Excel spreadsheet
    * there should be an optional `--output` flag to specify an output filename prefix

    The scraper should use good, easy to maintain python software architecture. The scraper should handle errors gracefully with try/except blocks, network timeouts, and failed element extraction, use `headless=False` so users can see the browser, add waits for JavaScript to load. There should also be a --debug flag to enable more verbose logging, with the intent being that feeding the debug logging output to an LLM would allow it to fix the scraper. The scrape script should also have human in the loop functionality (disabled by default) to allow for users to click potential "are you human" popups, or to change the URL if desired (take control back from the human with, e.g., `input()` calls).

    Please make sure the code is clear and well commented, so new programmers can understand how it works.
    ```

3. **Babysit Copilot Agent as it writes the code**
    * As Copilot chugs away, it may ask you questions, or for permission to create files and run commands. Be responsive and guide it as needed, but if it wants to run some commands that you do not recognize, copy the command into a web-based LLM chat (e.g. ChatGPT, Claude, Gemini) and ask it to explain what the command does before allowing Copilot to run it.
    * If any part seems confusing or overly complex, ask: "can you simplify the [specific section] of the code?"

4. **Test the script**
    * Now, find a URL for an event site (e.g., from Visit Salt Lake, a local university, or a venue) to test with.
    * Ask Copilot Agent: "run the script targeting [INSERT URL HERE]"
    * If you get an error about missing dependencies or browsers, ask Copilot to install them (e.g., "run the playwright install command").
    * Watch the browser visit the configured site
    * Wait for scraping to complete
    * Ask Copilot Agent: "show me the first 10 rows of the excel output"
    * At this point, you may see data, but you may not (since different sites have different HTML structures requiring different selectors). If not, continue on to the next step for debugging. If you do, then verify that the data looks correct and celebrate your success!

5. **Debug and refine**
    * If scraping fails or finds no events, you could try telling Copilot:
        * "the scraper isn't finding any events, please debug and fix" (this likely won't work, because it's too vague, but it's worth demonstrating that fact)
        * "inspect the CSS selectors for the event website [INSERT URL HERE] and update the code if needed" (this is less vague, but still unlikely to work because Copilot can't actually see the website structure unless you give it that information)
        * "use playwright to save the HTML of one of the event pages to a file, so we can inspect it, and then use that HTML page to refine the CSS selectors" (this is a great way to get the HTML structure so you can then provide it to Copilot for further debugging)
    * If dates aren't parsing correctly:
        * "the date parsing isn't working correctly, improve the function to handle more formats"
        * "use the python library `dateutil` to help parse dates more robustly"
    * Let Copilot Agent make the fixes and re-run tests
    * Keep iterating until your scraper gives you data


## 4. Technical guidance

This section provides additional context and troubleshooting tips for working with Copilot Agent.


### 4.1. Effective Copilot Agent prompting

Getting good results from Copilot Agent requires clear, action-oriented prompts. Here are tips:

* Good Agent prompts are:
    * *Direct*: Tell Agent what to do, not ask how to do it
    * *Action-oriented*: "create a file..." "run the script..." "install packages..."
    * *Specific about outcomes*: "improve the scrape function to allow for a human verification step" not "make it better"
    * *Include program output for debugging*: Specify logging, error handling, and verbose output so Copilot can see what's happening

* Follow up on prompts
    * Try out the code Agent creates, then ask for fixes if it doesn't work (see below)
    * Review what Agent did and ask for explanations: "explain the code you just created"
    * Ask for new features, or for features to work better/more simply
    * Iterate until satisfied


### 4.2. Troubleshooting with Agent mode

When things go wrong, Copilot Agent can help fix issues directly:

* Script not working or has errors
    * Simply tell Agent: "the script has an error, please fix it"
    * Agent can see the error output and will modify the code
    * If Agent's fix doesn't work: "that didn't fix it, try a different approach"

* Dependencies not installing
    * Tell Agent: "install the missing dependencies"
    * Agent should automatically run pip install commands
    * If there's a conflict: "resolve the dependency conflict"
    * Also consider asking Agent to "use conda to create and manage a virtual environment for this project"
        * The nice thing about vibe coding is you don't necessarily have to care about the details of virtual environments, Agent can handle that for you. It's not bad to ask what it's doing though, if you're curious and want to learn.

* Date parsing not working
    * Tell Agent: "dates aren't parsing correctly, improve the date parser to handle more formats"
    * Agent will modify the appropriate function
    * Ask Agent to: "test the date parser with some example dates"

* Google blocks the bot
    * If your script triggers a bot check on a website, tell Agent: "add human in the loop functionality so I can complete verification"
    * Complete the verification manually in the browser, then press Enter in the terminal that VS Code opened

* General debugging approach with Agent
    1. Describe the problem: "the scraper isn't working"
    2. Agent will try to fix it
    3. If the fix doesn't work: "that didn't solve it, try another approach"
    4. Ask for explanations: "explain what you changed and why"
    5. Ask for logging so Agent gets more information to help it: "add logging to a file so you can see error messages"
    6. Iterate until it works
    7. Ask me for help if you're stuck!


*Tip*: Agent mode can access files, run commands, and see output automatically. You shouldn't need to copy/paste error messages, just describe what's wrong and Agent will investigate. If it can't see the error output, ask it to add logging to file so that it can. {: .tip}



### 4.3. Understanding what Agent creates

When Copilot Agent generates the script (in my example, an event scraper), the key concepts remain the same as traditional coding:

* Command-line interface (CLI)
    * Copilot (or you, as you get more advanced) needs to run the Python script somehow. A command-line interface is a common way to do this. It's kind of like when you run an app on your computer, but instead of clicking an icon, you type commands in a terminal window.
    * Taking arguments (like `--url` or `--output`) makes the script flexible, acting like different settings for the same app.

* Starting URL
    * Instead of hardcoding which website to scrape, taking the URL as an argument allows the same scraping code to be pointed at different locations
    * As you'll see in the homework, this flexibility really shines when coupled with an LLM that can understand the structure of *any* URL you provide

* Playwright basics
    * Playwright is a tool that controls a web browser automatically
    * Instead of you clicking and scrolling, the script does it for you
    * Key actions:
        * Opening a browser window that you can see (`headless=False` means "show me the browser")
        * Going to websites (like typing a URL in the address bar)
        * Waiting for pages to load (websites often load content slowly or use animations)

* Webpages getting data from them (HTML and selectors)
    * Webpages are written in HTML, which is a relatively simple language that tells the browser what text/images/data to display
    * HTML organizes information into elements (pieces of text/images/data) like:
        * A heading for an event name
        * A paragraph with the date and time
        * A link to buy tickets
    * Each element can have labels (called "classes" or "ids") to identify what it is
    * Selectors are patterns that point to specific elements on a page, like giving directions:
        * "Find the element labeled 'event-title'" (to get event names)
        * "Find all elements labeled 'date'" (to get all event dates)
        * "Find the link inside the event box" (to get ticket URLs)
    * When websites change their design, the selectors might need to be updated because the labels changed
    * By using CSS selectors, your script is hardcoded for a specific webpage layout. If you run it on a completely different website, you might collect nothing (since standard selectors won't match). The homework project will look at using LLMs to bypass this limitation.

* Data export
    * Once the script collects data, it needs to save it in useful formats
    * Excel format (`.xlsx`) because we're Accountants, and it's just the best for viewing data in rows and columns, sorting, filtering



### 4.4. Going further (optional improvements, if you're feeling adventurous)

If you want to explore more, try asking Copilot Agent to add more features, here are some example prompts:

1. **Add command-line options**: 
    * `add a --limit option to only scrape up to N items`
    * `add --start-date and --end-date filters to the script`

2. **Improve event categorization**: 
    * `use fuzzy string matching for better categorization`
    * `generate a hierarchy of categories, e.g. Music -> Concerts, Festivals`

3. **Handle pagination**: 
    * `modify the scraper to scroll down to load more events on infinite scroll pages`
    * `modify the scraper to click Next Page buttons and scrape multiple pages`
    * `add a --max-pages argument to control pagination`

4. **Better date intelligence**: 
    * `handle date ranges like 'Nov 15-17'`
    * `handle recurring events like 'Every Saturday'`

5. **Add project documentation**:
    * `generate a requirements.txt file for this project`
    * `create a README.md with installation and usage instructions`

6. **Add LLM integration** (spoiler alert: this is the homework!):
    * `add Gemini LLM integration (https://github.com/googleapis/python-genai) to intelligently extract events, and fall back to using selectors if it fails or no API key is provided`
    * Also consider `add instructions to automate as much of the generation of the API key as possible, to make it user friendly to non-technical users`
    * This uses Google's free Gemini API to parse pages and extract event information more robustly than brittle CSS selectors.


### 4.5. Ethical considerations checklist

*Note*: This lab is intended to show you the very basics of vibe coding and web scraping, and as such shouldn't implicate ethical data collection practices broadly. However, these considerations are relevant if you are considering anything beyond this initial investigation into how basic scraping works. {: .note}

Before scraping any website, ask yourself:

<input type="checkbox" /> Have I checked the website's `robots.txt` file? (always at the root of the domain, e.g., [yelp.com/robots.txt](https://www.yelp.com/robots.txt)) <br />
<input type="checkbox" /> Have I read the terms of service? <br />
<input type="checkbox" /> Am I making requests at a reasonable rate? (3+ seconds between requests, not [DoS-ing](https://en.wikipedia.org/wiki/Denial-of-service_attack)) <br />
<input type="checkbox" /> Am I respecting user privacy? (not collecting personal data without consent) <br />
<input type="checkbox" /> Could this data be obtained through an official [API](https://en.wikipedia.org/wiki/API)? (always prefer APIs when available) <br />
<input type="checkbox" /> Am I properly attributing the data source? <br />
<input type="checkbox" /> Would I be comfortable if someone scraped my website this way? <br />
<input type="checkbox" /> Am I only scraping public data? (not bypassing authentication) <br />
