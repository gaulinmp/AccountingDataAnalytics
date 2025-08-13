# Project 1 — Investigating Financial-Statement-Analysis (FSA) Ratios  


## 1. Scenario: Your First Week as a New Equity Research Analyst  

You have just joined a mid-sized asset management firm as a junior analyst. Your portfolio lead hands you your first assignment: "Before we greenlight any screens this quarter, I want to know which fundamental ratios truly differentiate firms right now. Don't run regressions yet, just start by understanding the shape and spread of core financial statement ratios across the economy."

You inherit a raw Compustat annual extract covering more than a decade of U.S. public firms from all sectors. The portfolio team doesn't want a flowery pitch, they want a concise, visual slide deck that answers:  

  1. Which ratios show clear, economically intuitive separation across meaningful groups (industry structure, life‑cycle, firm size)?  
  2. Are the observed gaps stable (persistent) or temporary (transient)?  
  3. Which ratio(s) + grouping pair would you prioritize for deeper investigation?

Your task: Initiate that analysis workflow and pitch the preliminary results. Reconstruct a small set of ratios from raw fields (so the team trusts the numbers), profile their cross‑sectional distribution, and articulate an initial hypothesis (e.g., "High intangible intensity sectors sustain structurally higher gross margins with low dispersion"). Then generalize: if one ratio + grouping combination yields a crisp, stable signal, show why (or why not) it deserves analyst attention.

Deliverable tone: executive, decision-oriented, minimal jargon, no unnecessary statistical formalism.


---  
## 2. Data  

- **Source:** Compustat North America Fundamentals Annual file `CompustatAnnual.csv`.  
- **Identifying Variables** (keys): `firm_id` and `fyear` (Fiscal Year).  
- **Key Financial Variables** (unless otherwise specified, financial numbers are all in millions of USD):  
  - `fiscal_year_end_month`: Fiscal Year End Month (calculated from fye)
  - `name`: Firm Name (`conm`)
  - `tic`: Ticker Symbol
  - `age_days`: Age (post IPO) of firm, in days (calculated from `datadate`)
  - `act`: Current Assets
  - `ap`: Accounts Payable - Trade
  - `at`: Total Assets
  - `bve`: Book Value of Equity
  - `capx`: Capital Expenditures
  - `che`: Cash and Cash Equivalents
  - `cogs`: Cost of Goods Sold
  - `dvt`: Dividends - Total
  - `ebit`: Earnings Before Interest & Taxes
  - `ebitda`: Earnings Before Interest
  - `epspi`: Earnings Per Share (Basic) - Including Extraordinary Items (amount in $ / share)
  - `epspx`: Earnings Per Share (Basic) - Excluding Extraordinary Items (amount in $ / share)
  - `gics_sector`: GICS Sector code
  - `gics_sector_name`: GICS Sector code name
  - `gics_group`: GICS Group code
  - `gics_industry`: GICS Industry code
  - `gics_subindustry`: GICS Subindustry code
  - `ib`: Income Before Extraordinary Items
  - `invt`: Inventory  
  - `lct`: Current Liabilities  
  - `lt`: Total Liabilities  
  - `mve`: Market Value of Equity  (calculated as `MAX(prcc_f * csho, mkvalt)`)
  - `ni`: Net Income  
  - `oancf`: Operating Cash Flow
  - `pi`: Pretax Income
  - `re`: Retained Earnings
  - `recd`: Receivables - Estimated Doubtful
  - `rect`: Accounts Receivable  
  - `revt`: Revenue - Total
  - `sale`: Sales/Turnover (Net)  
  - `seq`: Shareholders' Equity  
  - `share_price`: Price Close - Annual - Fiscal (`prcc_f`)
  - `shares_outstanding`: Common Shares Outstanding (`csho`)
  - `total_debt`: Total Debt (calculated as `dltt + dlc`)
  - `xad`: Advertising Expense
  - `xint`: Interest Expense  
  - `xrd`: R&D Expense  
  - `xsga`: SG&A Expense  
  - `auditor`: Name of Auditor
  - `auop`: Auditor Opinion
  - `auopic`: Auditor Opinion - Internal Control
  - `bign`: Big N Auditor (calculated from `au`)
  - `emp`: Employees (in thousands)

### 2.1. FSA Ratio Suggestions  

| **Ratio** | **Formula** | **Industry** | **Firm Age** | **Firm Size** |
|-----------|-------------|--------------|--------------|---------------|
| **Gross Margin** | `(Revenue - COGS) / Revenue` | Varies widely (e.g., software vs. retail) | | Economies of scale may increase it |
| **Operating Margin** | `EBIT / Revenue` | Capital vs. labor-intensive firms | Improves with scale and learning | Larger firms may have better margins |
| **ROA (Return on Assets)** | `Net Income / Avg Total Assets` | Asset-light vs. asset-heavy | Increases with maturity | Larger firms often more efficient |
| **ROE (Return on Equity)** | `Net Income / Avg Shareholders' Equity` | Influenced by leverage norms | Mature firms may stabilize | May be inflated by buybacks |
| **Current Ratio** | `Current Assets / Current Liabilities` | Manufacturing > tech | Young firms may hoard cash | Larger firms more efficient in WC |
| **Quick Ratio** | `(Current Assets - Inventory) / Current Liabilities` | Retail (low) vs. services (high) | Low for new firms | Stronger liquidity with size |
| **Inventory Turnover** | `COGS / Avg Inventory` | Retail/high-volume > SaaS | | Larger firms better supply chains |
| **Receivables Turnover** | `Revenue / Avg Accounts Receivable` | Varies by sales model | Slower turnover in early stages | Larger firms may negotiate better terms |
| **Debt/Equity** | `Total Debt / Shareholders' Equity` | Utilities > Tech | Increases with access to capital | Large firms access capital markets |
| **Interest Coverage** | `EBIT / Interest Expense` | Capital-intensive firms vary | Grows with earnings stability | Larger firms usually better |
| **CapEx / Sales** | `Capital Expenditures / Revenue` | Telecom > Services | Higher for young firms | Declines with maturity |
| **R&D / Sales** | `R&D Expense / Revenue` | Pharma/Tech > Industrials | High in early-stage firms | |
| **SG&A / Sales** | `SG&A Expense / Revenue` | Lean ops vs. high-touch | Declines with experience | Economies of scale reduce it |
| **Free Cash Flow / Net Income** | `(Operating CF - CapEx) / Net Income` | More stable in mature industries | Negative in early years | Improves with efficiency |
| **Revenue Growth (YoY)** | `(Revenue_t - Revenue_{t-1}) / Revenue_{t-1}` | High-growth sectors differ | Higher in young firms | Slower growth for larger firms |


---  
## 3. Suggested Workflow

1. Download and filter `CompustatAnnual.csv`, keeping years 2010–2024 and dropping missing values for the variables of interest.  
2. Add values from previous years (called lags) for calculating year-over-year changes, and averages if necessary.  
3. Perform initial exploratory analysis (e.g. summary statistics, correlations) to understand the data landscape.  
4. Compute candidate ratios, handling zero denominators and addressing outliers.  
5. Select 2–3 FSA ratios to calculate, considering the composite story they might tell (i.e. how they interact or jointly provide insights into firm performance).  
6.  Pick a grouping dimension from: industry (via [GICS](https://en.wikipedia.org/wiki/Global_Industry_Classification_Standard)), or firm age or size buckets (you determine the buckets, e.g. < 5 years, 5-10 years, > 10 years for age).  
7.  Investigate distributions across firms (e.g. using boxplots) and over time.  
8.  Draft a hypothesis with a simple economic and accounting story about differences in these ratios across your group (i.e. by industry or over time/firm age).  
9.  Test your hypothesis via comparisons (median gaps, stability over time, simple difference ratios, sensitivity to alternative buckets or trimming). *Note, this is not rigorous hypothesis testing, but rather a way to explore the data and see if it seems to support your hypothesis.*  
10. Build slide deck with the story arc: Question &rarr; Data &rarr; Evidence &rarr; Conclusion.  


### 3.1. Example: Gross Margin by GICS Sector

1. Download data, keep years 2010 - 2024, and drop observations with missing values of `sale` or `cogs`.
2. Keep columns `firm_id`, `fyear`, `sale`, `cogs`, `gics_sector_name`.
3. Create new column: Gross Margin = (sale − cogs) / sale  
   1. Define economic meaning: Efficiency of converting revenue into gross profit; varies with capital intensity, product mix, and scalability of production.
4. Observe 5 number summary of `gross_margin`, and again over time (by `fyear`).
   1. Note that the mean is ` -7.6` and the median is `0.39`, and remember about outliers and skewed distributions.
   2. Decide what to do about outliers (I chose to remove any gross_margin < 0 or > 1)
5. Make a boxplot of `gross_margin` by `gics_sector_name` for 2024, noting those industries that stand out.
6. Make a time-series plot of `gross_margin` over `fyear` for each `gics_sector_name`, noting the change over time of each sector.
7. Summarize an economic story based on insights from the visualizations (this is your hypothesis).
    * H1: Asset‑light or IP‑heavy sectors (Information Technology, Health Care) exhibit persistently higher gross margins than Industrials and Consumer Staples due to lower variable production costs; the median margin difference exceeds 10 percentage points over the entire time period.
8. Choose descriptive statistics and visualizations that best capture your story. For example:
    * Median difference = median(GM_high_sector) − median(GM_low_sector).  
    * Relative difference = difference / median(low_sector).  
    * Stability: Standard deviation of annual difference across years.  
    * Sensitivity: Recompute after excluding top/bottom 5% of GM within each sector.
    * Multi-line plot: Sector median GM by year, highlight top vs bottom sector.  
    * Boxplot of 2024 data sorted by sector median; highlight top 2, bottom 2.  
9.  Assemble slide deck with a clear, visually appealing slide for each step: Question &rarr; Data (including the cleaning/filtering/etc. choices you made) &rarr; Evidence (concise slides with your visualizations) &rarr; Conclusion (connecting your evidence to your hypothesis).



---  
## 4. Suggested Week-by-Week Milestones  

| Week | Suggested Milestone |
|------|---------------------|
| **1** | **1.1 Download & Load Data** – Pull data, keep 2010-2024 fiscal years.<br>**1.2 Get to Know Data** – Describe data, inspect missings, compute summary stats, look for outliers and consider how to address them. |
| **2** | **2.1 Choose Ratios & Groups** – Select **2-3 ratios** and **one grouping dimension** (industry, age, size); create box/violin plots & median trends.<br>**2.2 Pose Hypothesis** – Draft rationale grounded in accounting/econ theory. |
| **3** | **3.1 “Test” Hypothesis** – Compare means/medians, heatmaps, relative-difference metrics; stress-test with alternative buckets.<br>**3.2 Craft Deliverables** – Assemble slide deck & 1-page memo; optional 3-minute voiceover. |


---  
## 5. Output Requirements  

- **Slide Deck (6–10 slides)**  
  1. Title & Team  
  2. Business Context & Question  
  3. Data & Cleaning Choices (concise table/flowchart)  
  4. Key Visual(s) with annotated insights  
  5. Evidence of Difference / Change (comparison metric, heatmap, etc.)  
  6. Conclusion & Implications for investors/managers  
  *Appendix*: ratio formulas, extra charts, code link  

- **One-page Memo** – 250–300 word executive summary of dataset, hypothesis, findings, and a forward-looking suggestion (e.g., update analysis quarterly).  

---  

## 6. Grading

Your project will be graded based on the following criteria:

1. **Clarity and Insight**: Does the analysis provide clear and actionable insights? Are the visualizations effective?
2. **Depth of Analysis**: Does the project go beyond surface-level analysis? Are the chosen ratios and groupings well-justified?
3. **Presentation**: Is the final presentation well-organized and professional? Does it effectively communicate the key findings?


### 6.1 Rubric and Grading

| Category | Pts | Indicators of Excellence |
|----------|-----|--------------------------|
| Data preparation & documentation | 20 | Clean code, replicable, clear comments. |
| Ratio construction accuracy | 15 | Matches definitions; handles missing/edge cases. |
| Exploratory visuals & insight generation | 20 | Appropriate charts, clear labeling, insight captions. |
| Hypothesis framing & motivation | 10 | Grounded in theory/prior research; testable. |
| Evidence & “testing” (non-statistical) | 15 | Compelling comparisons, sensitivity checks. |
| Storytelling & slide design | 15 | Logical flow, minimal text, takeaway headlines. |
| Professionalism & formatting | 5 | File naming, grammar, citation of data source. |
