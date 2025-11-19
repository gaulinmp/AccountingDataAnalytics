# Lab 12: AI-Assisted Web Scraping

Lab 12 introduces you to using AI tools (specifically [GitHub Copilot](https://github.com/features/copilot)) to assist with development environment setup, coding, and web scraping tasks. You will install and configure [VS Code](https://code.visualstudio.com/), use Copilot Chat to install [Python](https://www.python.org/) and web scraping tools, and then build a local event scraper using [Playwright](https://playwright.dev/) to collect event data from websites and export to Excel and calendar formats. This lab emphasizes learning to work effectively with AI coding assistants, understanding when to trust AI suggestions, and developing the skills to verify and debug AI-generated code.

*Note*: This lab is meant to demonstrate the power of AI-assisted development. For those of you who haven't been using Python for these labs and homework, I want to clarify that using Copilot to install, write, run, and test python code is far easier than doing it more manually, e.g. in Colab. This lab isn't intended to force you to learn to program, but instead demonstrate how AI tools can make development easier for beginners and experts alike. Focus on learning to use Copilot effectively rather than struggling with low-level Python details. {: .note}


[TOC]


## 1. Assignment

To complete this lab, complete the Canvas quiz by uploading your final working python script, and your excel output. The general steps will be:

1. *VS Code Setup*: Install Visual Studio Code and GitHub Copilot extension
2. *Python Environment*: Use Copilot Chat to guide installation of Python and virtual environment setup
3. *Playwright Installation*: Install Playwright web scraping framework with Copilot's assistance
4. *Event Scraper Implementation*: Build a command-line event scraper that finds and collects local events
5. *Data Export*: Export scraped events to Excel and iCalendar formats for analysis


This lab demonstrates how AI tools can accelerate development workflows while teaching you to critically evaluate AI-generated solutions. You'll learn when to accept Copilot's suggestions, when to ask for clarification, and how to troubleshoot when things don't work as expected. This lab is not meant to be a slog through programming and environment setup details, if you're stuck on anything before you get to the Copilot Agent step (or after as well, of course), don't hesitate and reach out to me for help. I don't want you discouraged by computer shenanigans, but rather amazed by AI doing everything for you.


### 1.1. Learning objectives

By the end of this lab, you will be able to:

* Install and configure Visual Studio Code as a development environment
* Use GitHub Copilot Chat effectively to solve development problems
* Vibe-code a command-line application with multiple functional modes
* Scrape data from websites
* Export data to multiple formats (Excel, iCalendar)
* Debug issues with AI assistance


### 1.2. Tools

This lab focuses on learning to use professional development tools with AI assistance:

* **[VS Code](https://code.visualstudio.com/)**: A powerful, free code editor from Microsoft
* **[GitHub Copilot](https://github.com/features/copilot)**: AI pair programmer that provides code suggestions and answers questions
* **[Python](https://www.python.org/)**: Programming language for scripting and data manipulation
* **[Playwright](https://playwright.dev/)**: Modern web automation and scraping framework
* **[pandas](https://pandas.pydata.org/)**: Data manipulation library for Python
* **[icalendar](https://icalendar.readthedocs.io/)**: Library for creating calendar files


---
## 2. Background: AI-assisted development (vibe coding)

Modern software development increasingly involves AI coding assistants like [GitHub Copilot](https://github.com/features/copilot), [Claude](https://www.anthropic.com/claude), [ChatGPT](https://chat.openai.com/), and others. These tools can dramatically accelerate development by:

* Suggesting code completions as you type
* Answering technical questions about libraries, syntax, and best practices
* Generating boilerplate code for common patterns
* Explaining unfamiliar code in natural language
* Debugging errors by analyzing error messages

However, AI assistants have important limitations:

* *They can be confidently wrong*: suggestions may look correct but contain subtle bugs
* *They don't understand your full context*: you need to provide clear, specific prompts
* *They may suggest outdated approaches*: libraries and best practices evolve (e.g. yours will probably use `argparse` instead of, e.g., `click`)
* *They can't replace understanding*: you still need to verify and understand the code if you want to use it in a robust, professional environment

This lab gives you practice with AI assisted development, including:

1. Writing clear prompts that specify what you need
2. Evaluating whether AI suggestions make sense
3. Testing and verifying AI-generated code
4. Debugging with natural language when code doesn't work


### 2.1. About local event scraping

For this lab, you'll build a tool that scrapes local events from city event websites and event aggregators. Your scraper will:

* *Find event websites*: Use Google search to discover event sites for Salt Lake City
* *Extract event data*: Collect event names, dates, locations, and URLs
* *Categorize events*: Automatically classify events (Music, Arts, Sports, Food, etc.)
* *Export multiple formats*: Save to Excel for analysis and iCalendar for importing to calendar apps

This is a practical, real-world application because:

* *Useful output*: You can actually use the calendar files to track events
* *Flexible design*: Uses automated discovery rather than hardcoded websites
* *Professional patterns*: Command-line interface, configuration files, error handling
* *Multiple data formats*: Excel for analysis, iCalendar for productivity
* *Educational value*: Demonstrates full software development lifecycle

Example sites you might scrape include:

* City tourism websites (e.g., Visit Salt Lake, NYC Tourism)
* Eventbrite listings for specific cities
* Local venue calendars and event listings

*Note*: Always check a website's `robots.txt` file and terms of service before scraping ([explanation](https://en.wikipedia.org/wiki/Robots.txt)). Be respectful - don't make too many requests too quickly. {: .note}


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

* *Respect robots.txt* which tells scrapers which parts of a site can be accessed
* *Check terms of service*, as some sites explicitly prohibit scraping
* *Rate limiting* avoids overwhelming servers with too many requests
* *Personal data* is sensitive, be careful with personally identifiable information (GDPR, etc.)
* *Copyright* may apply to scraped content, which makes it legally protected
* *Authentication* should be legitimate, don't scrape behind login walls without permission/paying

**Why Playwright?**

We're using **Playwright** instead of simpler tools like `requests` + `BeautifulSoup` because it handles JavaScript-rendered content, is reliable and fast (developed by Microsoft and used in production environments), can be run "headed" which means you can watch the browser window as it operates, and works with Chrome, Firefox, Safari, etc. 

If you don't want to use Playwright, you could try using `requests` + `BeautifulSoup`, but you'll likely run into issues with modern websites that heavily rely on JavaScript for content rendering.

---
## 3. Step-by-step instructions

This lab walks you through setting up a complete development environment using AI assistance, then building a web scraper.



### 3.1. Install VS Code and GitHub Copilot

VS Code is a free, powerful code editor from Microsoft that has quickly become one of the most widely used IDEs (code editor). GitHub Copilot is an AI pair programmer that provides code suggestions and answers questions directly in the editor, and can directly write, edit, and debug code for you, as well as run scripts (like python), meaning you could conceivably never touch the command line yourself, and just interact with copilot in plain English.

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
    * If Python is not installed, you have two options:
        * **Option A (Recommended - Agent Mode):** Ask Copilot Agent: "install python using the microsoft python extension"
        * **Option B (Manual):** Install the [Microsoft Python extension](https://marketplace.visualstudio.com/items?itemName=ms-python.python) from the VS Code marketplace, then Copilot can help you configure it, or you can follow the extension's built-in setup wizard
    * Verify that python is installed, by asking Copilot: "what's my python version?" or running `python --version` or `python3 --version` in a terminal (open a terminal in VS Code ``Ctrl+` ``, which is control key and the backtick key, on both Windows and Mac (a rare instance of `ctrl` not `cmd` on Mac))

*Note*: You could also use other AI coding assistants like [Gemini CLI](https://geminicli.com/) or [Claude Code](https://claude.com/product/claude-code), if you prefer those and have accounts, feel free to use them instead (but I'll leave translating these instructions to those approaches up to you). {: .note}



### 3.2. Build a local event scraper with Copilot Agent

This is where you'll use Copilot Agent to build a complete command-line tool. You'll provide the high-level requirements and let Copilot create, run, and debug the code for you. You might be thinking "but I haven't done anything yet, how can code run?" Great question! The point of vibe coding with Copilot Agent is that we will ask it to, as part of the scraping script we write, add some code to automatically install the required software we need to do the scraping. What a world!

This whole lab basically boils down to the prompt that you will now give to Copilot Agent. Everything else is just scaffolding to get you to this point. Below is an example prompt, but feel free to modify it as you see fit. The key is to be as clear and specific as possible about what you want the scraper to do.

1. Ask Copilot to make a new folder and open it as a workspace in VS Code
    * "create a new folder called event_scraper_lab and open it as a workspace in VS Code"
2. **Create the event scraper**:
     * Ask Copilot Agent:
    
    ```
    Build a Python command-line tool that scrapes local events from websites and exports them to Excel and calendar formats. The tool should have three commands:

    1. `install` automatically installs all dependencies including playwright, pandas, openpyxl, icalendar, and pytz, then installs Playwright's chromium browser
    2. `init` uses Playwright to search Google for event websites in Salt Lake City, extracts relevant URLs from search results, and saves them to a JSON configuration file (event_sites_config.json) that stores the city name, last update timestamp, and a list of sites with their URLs and CSS selectors (this function should account for the initial load of google search might bring up a bot check, so wait for the user to conduct said check, then let the script continue). There should be an optional `--max-sites` argument to limit the number of sites saved (default 5).
    3. `scrape` reads the configuration file, visits each configured website using Playwright, extracts event information (name, date, location, URL) using CSS selectors, automatically categorizes events into types like Music, Arts, Sports, Food, Festival, Education, Community, Family, Outdoor, Nightlife, or Other based on keywords in the event name, then exports the results to both an Excel spreadsheet (sorted by date with columns: Date, Name, Category, Location, URL) and an iCalendar .ics file that can be imported into any calendar app. There should be some optional arguments, including `--output` to speficy an output filename prefix, and `--start-date` / `--end-date` to only include events between certain dates (default to today / 1 month from now).

    The scraper should use good, easy to maintain python software architecture. The init script should find event websites for Salt Lake City. The scraper should extract events of all types, categorize them where possible, parse dates to YYYY-MM-DD format, and export to Excel and iCalendar. The tool should handle errors gracefully with try/except blocks, network timeouts, and failed element extraction, use `headless=False` so users can see the browser, add waits for JavaScript to load, and include proper imports wrapped in try/except blocks so the script can run for help/install commands even without dependencies installed. There should also be a --debug flag to enable more verbose logging.

    Please make sure the code is clear and well commented, so new programmers can understand how it works.

    ```

3. **Babysit Copilot Agent as it writes the code**
    * As Copilot chugs away, it may ask you questions, or for permission to create files and run commands. Be responsive and guide it as needed, but if it wants to run some commands that you do not recognize, copy the command into a ChatGPT or other LLM chat and ask it to explain what the command does before allowing Copilot to run it.
    * If any part seems confusing or overly complex, ask: "can you simplify the [specific section] of the code?"

4. **Test the install command**
    * Ask Copilot Agent: "run the install command"
    * This should install all dependencies and Playwright browsers
    * If it fails, simply tell Copilot: "got an error, please fix it" (and include the error message if it's not already visible)
    * Another possible fix for installation issues is to ask Copilot to "use uv to create and manage a virtual environment for this project"

5. **Test the init command**
    * Ask Copilot Agent: "run the init command"
    * Watch the browser open and search Google
        * you may have to verify that you're not a bot, which will require interacting with the browser window. If the window disappears while you're doing this, it's most likely because the code isn't waiting for you to complete the task. This is a great time to debug by telling Copilot that you have to do a manual check, so it should wait for you to do so, and then continue with the automated portion of the script. This is an example of that "Human in the Loop" issue that we discussed in our week on Automation, and a good reminder about how it's not always possible to fully automate everything.
    * Ask Copilot Agent: "show me the contents of the config file"
    * Verify it contains at least some event site (if not, time for debugging! Consider asking Copilot to "improve the selectors used to extract event site URLs from Google search results" or "here are some sites to include: [list of event sites you found manually]")

6. **Test the scrape command**
    * Ask Copilot Agent: "run the scrape command"
    * Watch the browser visit each configured site
    * Wait for scraping to complete
    * Ask Copilot Agent: "show me the first 10 rows of the excel output"
    * At this point, you may see event data, but you may not. If not, continue on to the next step for debugging. If you do, then verify that the data looks correct (dates parsed correctly, categories assigned, etc.) and celebrate your success!

7. **Debug and refine**
    * If scraping fails or finds no events, you could try:
        * "the scraper isn't finding any events, please debug and fix" (this likely won't work, because it's too vague, but it's worth demonstrating that fact)
        * "inspect the CSS selectors for the event websites and update the code if needed" (this is less vague, but still unlikely to work because Copilot can't actually see the website structure unless you give it that information
        * "use playwright to save the HTML of one of the event pages to a file, so we can inspect it, and then use that HTML page to refine the CSS selectors" (this is a great way to get the HTML structure so you can then provide it to Copilot for further debugging)
    * If dates aren't parsing correctly:
        * "the date parsing isn't working correctly, improve the function to handle more formats"
        * "use the python library dateutil to help parse dates more robustly"
    * Let Copilot Agent make the fixes and re-run tests
    * Keep iterating until your scraper works reliably


---
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
    * Also consider asking Agent to "use uv to create and manage a virtual environment for this project"
        * The nice thing about vibe coding is you don't necessarily have to care about the details of virtual environments, Agent can handle that for you. It's not bad to ask what it's doing though, if you're curious and want to learn.

* Date parsing not working
    * Tell Agent: "dates aren't parsing correctly, improve the date parser to handle more formats"
    * Agent will modify the appropriate function
    * Ask Agent to: "test the date parser with some example dates"

* Google blocks the bot during initial event page search
    * The script should already pause for manual verification
    * If it doesn't: "add a pause with `input()` when Google might ask for verification"
    * Complete the verification manually, then press Enter (in the terminal that VS Code opened)

* General debugging approach with Agent
    1. Describe the problem: "the scraper isn't working"
    2. Agent will try to fix it
    3. If the fix doesn't work: "that didn't solve it, try another approach"
    4. Ask for explanations: "explain what you changed and why"
    5. Ask for logging so Agent gets more information to help it: "add logging to a file so you can see error messages"
    6. Iterate until it works
    7. Ask me for help if you're stuck!


*Tip*: Agent mode can access files, run commands, and see output automatically. You shouldn't need to copy/paste error messages - just describe what's wrong and Agent will investigate. If it can't see the error output, ask it to add logging to file so that it can. {: .tip}



### 4.3. Understanding what Agent creates

When Copilot Agent generates the event scraper, the key concepts remain the same as traditional coding:

* Command-line interface (CLI)
    * Copilot (or you, as you get more advanced) needs to run the Python script somehow. A command-line interface is a common way to do this. It's kind of like when you run an app on your computer, but instead of clicking an icon, you type commands in a terminal window.
    * The three commands (`install`, `init`, `scrape`) are like different modes of the same app - each does a different job

* Configuration management
    * Think of configuration files like a settings file that remembers information between runs
    * The script saves a JSON file (just a text file with structured data) that stores:
        * Which websites to scrape for events in Salt Lake City
        * How to find the event information on each website (the "selectors")
    * This way, you only need to find the event websites once, and can reuse them for future scrapes

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
    * *Note*: pre-specified selectors are notoriously brittle. For production use, we would use want more robust modern methods like an LLM-based extraction when selectors fail.

* Data export
    * Once the script collects event data, it needs to save it in useful formats
    * Excel format (`.xlsx`) because we're Accountants, and it's just the best for viewing data in rows and columns, sorting, filtering
    * Calendar format (`.ics`) so that we can import it into Outlook, Apple/Google Calendar, etc.
    * The script creates one file of each type so you can use the data however you prefer



### 4.4. Going further (optional improvements, if you're feeling adventurous)

If you want to explore more, try asking Copilot Agent to add more features, here are some example prompts:

1. **Add command-line options**: 
    * `add a --max-sites option to the init command to limit how many event sites to save`
    * `add --start-date and --end-date filters to the scrape command`

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
    * `add Gemini LLM integration to intelligently extract events, and fall back to using selectors if it fails or no API key is provided`
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
