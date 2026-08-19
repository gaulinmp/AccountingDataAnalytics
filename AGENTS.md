# AGENTS.md

This file provides guidance to LLM agents when working with code in this repository.

## Project Overview

This is an academic repository for Accounting Data Analytics course materials. The project contains course materials, lab assignments, homework, case studies, and code examples for teaching data analytics in accounting contexts.

## Environment Setup

The project uses **uv** for environment management.
The default location for the virtual environment is `.venv/`.

### Common Commands

```bash
# Run Jupyter notebook
uv run jupyter notebook

# Convert one lab's markdown to HTML with inline images (one-off)
uv run python code/utils/convert_md.py labs_hw/week1_opening-data/Lab-1_Instructions.md

# Watch labs_hw/ and reconvert on every change (Ctrl-C to stop)
uv run python code/utils/convert_md.py
```

## Repository Structure

### Core Directories

- **`code/`**: Contains Jupyter notebooks, Python source code, and data analysis examples
  - `src/`: Python modules including Compustat data processing (`compustat.py`)
  - `imports.ipynb`: Standard import notebook for data analysis setup
  - `1.0_making_data_funda.ipynb`: Notebook for generating Compustat datasets
  - `grades.ipynb`: Grade analysis notebook
  - `student_report_analysis.ipynb`: Student report analytics
  - `map_maker.ipynb`/`MapMaker.ipynb`: Geographic visualization notebooks

- **`data/`**: Contains datasets used in coursework
  - `CompustatAnnual.csv`: Primary financial dataset
  - Various Excel files and SQLite databases for examples

- **`labs_hw/`**: Lab assignments and homework
  - `project1/`: Financial Statement Analysis project
  - `project2/`, `project3/`, `project4/`: Additional course projects
  - `week1_opening-data/` through `week12_AI/`: Weekly lab materials covering:
    - Week 1: Opening data
    - Week 2: Connecting to data
    - Week 3: Visualization
    - Week 4: Exploratory Data Analysis (EDA)
    - Week 5: Relational Databases (RDB)
    - Week 6: ETL, SQL, and LLM integration
    - Week 7: Unstructured data and review
    - Week 8: Analytics overview
    - Week 9: Regressions
    - Week 10: Classifiers
    - Week 12: AI-assisted development
  - `cases/`: KPMG and other professional case studies (excluded from git)
  - `convert_md.py`: Utility to convert Markdown lab instructions to HTML with embedded images
  - `code.css`, `default.css`, `github-dark.css`, `monokai.css`: Style sheets for HTML output

- **`slides/`**: Source PPTX decks and their figures, organized by topic (1-Intro, 2-data, 3-Vis, etc.). Gitignored — versioned by Dropbox, not git, and absent from a fresh clone.

- **`literature/`**: Course readings including academic papers and practitioner resources

### Key Files

- **`pyproject.toml`**: Environment configuration with dependencies including:
  - Data science: pandas, duckdb, scikit-learn, scikit-image, seaborn, statsmodels, matplotlib, plotly
  - Databases: sqlalchemy, psycopg, pyodbc
  - Notebooks: jupyter notebook, nbconvert
  - AI/LLM: google-genai
  - Specialized: pyedgar (editable install), reslib (editable install), stargazer
  - Document processing: PyPDF2, lxml, markdown, pygments, pymdown-extensions
  - Optional geo dependencies: geopandas, geoplot, shapely, folium
- **`code/imports.ipynb`**: Standard imports and utility functions for data analysis
- **`code/src/compustat.py`**: Compustat data processing with WRDS database connection
- **`.gitignore`**: Excludes data/, literature/, cases/, slides/, PDFs, Office documents, build artifacts, and solution HTML. Note that `labs_hw/` instruction HTML is *not* excluded — it is tracked alongside its source markdown.
- **`.gitattributes`**: Normalizes line endings (LF in the repo) and marks binary types so images and packaged workbooks are never text-normalized

## Data Analysis Workflow

The codebase follows a structured approach to financial data analysis:

1. **Data Import**: Uses `imports.ipynb` for standardized library imports and utility functions
2. **Data Processing**: Compustat data is processed through the `CompustatAnnual` class in `src/compustat.py`
3. **Analysis**: Various notebooks demonstrate EDA, visualization, and modeling techniques
4. **Documentation**: Lab instructions written in Markdown, converted to HTML with embedded images

## Code Conventions

- Python code follows standard pandas/numpy conventions
- Jupyter notebooks use the imports from `imports.ipynb`
- Financial data processing includes GICS sector mapping and ratio calculations
- Utility functions for plotting (`timehist`, `timeqtrhist`) and data formatting
- Uses reslib and pyedgar for specialized financial data processing (editable installs)

## Educational Focus

This repository supports learning objectives in:
- Data visualization and exploratory data analysis
- Financial statement analysis and ratio computation
- Database connectivity and SQL queries (PostgreSQL, ODBC)
- Supervised learning: regression and classification models
- Unsupervised learning: clustering and dimensionality reduction
- Unstructured data processing (text, images)
- Business process automation and ETL workflows
- LLM integration for data analytics tasks
- Geographic visualization and mapping
- AI-assisted development and web scraping

## Development Notes

- Environment managed by **uv** with virtual environment stored in `.venv/`
- The environment includes packages for both basic data science (pandas, sklearn, seaborn) and specialized financial analysis
- DuckDB added for fast, embedded analytical queries
- Google Generative AI integration for LLM-powered analytics
- Optional geo dependencies (geopandas, geoplot, shapely, folium) available for geographic visualization
- Git configuration excludes large files (PDFs, Office documents, literature, cases, data/) and build artifacts; lab HTML handouts are deliberately tracked with their source markdown
- Lab materials are designed for conversion to HTML with embedded images using custom CSS themes
- Grading workflows supported through JavaScript utilities
- Weekly lab structure progresses from basic data operations through advanced analytics, regression modeling, classification, and AI-assisted development

## Custom Skills

- **`deck-author`**: Located at [.claude/skills/deck-author/SKILL.md](file://./.claude/skills/deck-author/SKILL.md). Use this skill when creating, drafting, writing, scaffolding, or revising MDX lecture decks (slides), `week-NN.yaml` metadata, and inline `<Quiz>` blocks under `site/content/`. It defines component schemas, cheatsheets, and validation procedures.
- **`lab-author`**: Located at [.claude/skills/lab-author/SKILL.md](file://./.claude/skills/lab-author/SKILL.md). Use when creating or revising lab/homework/project instructions under `labs_hw/` — markdown dialect, UG/MAcc variants, rubrics, data sourcing, and the `convert_md.py` HTML pipeline.
- **`pptx-to-deck`**: Located at [.claude/skills/pptx-to-deck/SKILL.md](file://./.claude/skills/pptx-to-deck/SKILL.md). Use when converting `slides/**/*.pptx` into site MDX decks — wraps `code/utils/pptx2md.py` plus the required editorial cleanup pass.
- **`site-dev`**: Located at [.claude/skills/site-dev/SKILL.md](file://./.claude/skills/site-dev/SKILL.md). Use when changing `site/src/` — new slide components, interactive islands, icons, pages/collections, layout, or styling — with the doc-sync and validation rules.

