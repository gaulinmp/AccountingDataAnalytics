# Project 1 — Investigating Financial-Statement-Analysis (FSA) Ratios  


## 1. Scenario: Your First Week as a New Equity Research Analyst  

You have just joined a mid-sized asset management firm as a junior analyst. Your portfolio lead hands you your first assignment: "Before we greenlight any portfolio sorts this quarter, I want to know which fundamental ratios truly differentiate firms right now. Don't run regressions yet, just start by understanding the shape and spread of core financial statement ratios across the economy."

You are given a raw Compustat (S&P Accounting Data) annual extract covering more than a decade of U.S. public firms from all sectors. The portfolio team doesn't want a flowery pitch, they want a concise, visual slide deck that answers:  

1. Which ratios show clear, economically intuitive separation across meaningful groups (industry structure, life‑cycle, firm size)?  
2. Are the observed gaps stable (persistent) or temporary (transient)?  
3. Which ratio(s) + grouping pair would you prioritize for deeper investigation?

Your task: Initiate that analysis workflow and pitch the preliminary results. Construct a small set of ratios from raw fields (so the team trusts the numbers), profile their cross‑sectional distribution, and articulate an initial hypothesis (e.g., "High intangible intensity sectors sustain structurally higher gross margins with low dispersion"). Then, provide evidence for your hypothesis with a concise set of visualizations and clearly demonstrate your findings.


### 1.1. Learning Objectives

By completing this project, you will:

* Become familiar with industry standard financial accounting information, and practice ratio calculation and interpretation
* Gain an initial sense for cross-sectional and time-series analyses
* Practice executive-level data storytelling
* Learn to handle real-world data quality issues and outliers


---  
### 1.2. Deliverable

Slide-deck (`.pptx` or `.pdf`) containing, at most:

1. Title Slide, group names
2. Question statement
3. Data description and summary
4. Preliminary findings and analysis
5. Conclusions and recommendations
6. Thank you / questions slide
7. Appendix (if needed, should be after the "last" slide)

Tone: targeted to accounting and finance executives, minimal jargon, clear and concise.


---  
## 1.3. Suggested Week-by-Week Milestones  

| Week | Suggested Milestone |
|------|---------------------|
| **1** | **1.1 Choose your group** – Assemble your fearless crew of 1-5.<br>**1.2 Download & Load Data** – Pull data, keep 2010-2024 fiscal years.<br>**1.3 Get to Know Data** – Describe data, inspect missings, compute summary stats, look for outliers and consider how to address them. |
| **2** | **2.1 Choose Ratios & Groups** – Select **2-3 ratios** and **one grouping dimension** (industry, age, size); create box/violin plots & median trends.<br>**2.2 Pose Hypothesis** – Draft rationale grounded in accounting/econ theory. |
| **3** | **3.1 Support Hypothesis** – Compare means/medians (t-tests if you're feeling fancy!), heatmaps, relative-difference metrics; stress-test with alternative buckets.<br>**3.2 Make Presentation** – Assemble slide deck. |



---  
## 2. Grading

Your project will be graded based on the following criteria:

1. **Clarity of Hypothesis**: Does the analysis provide a clear research question? Is it easy to understand the logic behind the research question?
2. **Data Preparation & Documentation**: Is the data well-described and summarized? Are key characteristics and potential issues highlighted?
3. **Findings and Analyses**: Are the initial findings clearly presented? Is there a logical flow from the data to the findings? Are the visualizations aesthetic, clear, and informative?
4. **Presentation**: Is the final presentation well-organized and professional?

Note, while you need to include a slide for "Conclusions and Recommendations", note that below the rubric is merely verifying its presence, not its content. This is because I do not want you to stress about the specific recommendations at this stage, nor whether your evidence "supports" some imaginary trading strategy. I want you to focus on the data, visualization, and presentation, with some consideration of an economic story behind FSA ratios thrown in for good luck.

### 2.1 Grading Rubric

1. **Clarity of Hypothesis**
    * **Excellent**: Theory-grounded with specific, quantified predictions; acknowledges limitations; connects to business context
    * **Good**: Clear hypothesis with solid economic reasoning
    * **Needs Work**: Basic hypothesis but weak theoretical foundation
    * **Poor**: Vague predictions without economic foundation
2. **Data Preparation & Documentation**
    * **Excellent**: Systematic approach to outliers with clear rationale, documented cleaning decisions, fully reproducible workflow, handles edge cases thoughtfully
    * **Good**: Basic cleaning with some documentation, addresses most data quality issues
    * **Needs Work**: Ad-hoc cleaning, undocumented decisions, missing steps
    * **Poor**: Minimal data preparation, no documentation
3. **Visuals**
    * **Excellent**: Compelling, well-designed charts with clear annotations, multiple perspectives (cross-sectional + time-series), insights clearly highlighted
    * **Good**: Good visualizations with some annotations and insights
    * **Needs Work**: Basic charts with limited insight generation
    * **Poor**: Poor chart design, no clear insights
4. **Evidence & "Testing"**
    * **Excellent**: Multiple forms of evidence clearly tied to hypothesis, quantified differences, sensitivity analysis (e.g. time-series persistence, outlier impact, etc.)
    * **Good**: Some evidence with basic comparisons, tied to hypothesis
    * **Needs Work**: Limited evidence provided, no clear link to hypothesis
    * **Poor**: Weak or missing evidence
5. **Conclusions & Recommendations**
    * **Excellent**: A slide exists and looks professional
    * **No Credit**: No such slide exists
6. **Storytelling & Slide Flow**
    * **Excellent**: Clear narrative arc, effective text, strong takeaway headlines, executive-ready presentation
    * **Good**: Good flow with reasonable cohesion
    * **Needs Work**: Basic presentation, limited connection between slides
    * **Poor**: Poor organization and design
7. **Professionalism & Formatting**
    * **Excellent**: Aesthetic, professional slides, consistent formatting
    * **Good**: Minor formatting issues, otherwise professional and aesthetic
    * **Needs Work**: Several formatting/grammar issues, or inconsistent design elements
    * **Poor**: Unprofessional appearance, significant formatting problems

Points allocation is Excellent 5 pts, Good 4 pts, Needs Work 3 pts, Poor 2 pts.


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


### 3.1. Data handling suggestions

Suggestions for handling data quality issues, which you should document in the Appendix if needed (these are neither required nor exhaustive):

* **Outlier Treatment**: Consider [winsorizing](https://en.wikipedia.org/wiki/Winsorizing) at 1st/99th percentiles rather than simple exclusion. Consider whether to handle outliers before or after calculating ratios.
* **Negative Denominators**: Consider cases where denominators are negative (e.g., negative revenue)
* **Fiscal Year Timing**: Account for different fiscal year-ends when comparing firms
* **Missing Data**: Document your approach to missing values (exclude, interpolate, or flag)


### 3.2. Example: Gross Margin by GICS Sector

1. **Data Preparation**
     * Download data, keep years 2010 - 2024, and drop observations with missing values of `sale` or `cogs`
     * Keep columns `firm_id`, `fyear`, `sale`, `cogs`, `gics_sector_name`
     * **Code snippet for outlier detection:**
     ```python
     # Observe outliers
     _ = df.query('sale != 0 and cogs.notnull()').assign(gross_margin=lambda df: (df.sale - df.cogs)/df.sale)
     pd.DataFrame(
         [{
             'variable': c,
             'mean': _[c].mean(),
             'winzorized mean': _[c].clip(lower=(_1 := _[c].quantile(0.01)), upper=(_99 := _[c].quantile(0.99))).mean(),
             'min': _[c].min(),
             '1%': _1,
             '# < 1%': len(_.query(f'{c} < {_1}')),
             '25%': _[c].quantile(0.25),
             '50%': _[c].quantile(0.5),
             '75%': _[c].quantile(0.75),
             '99%': _99,
             'max': _[c].max(),
             '# > 99%': len(_.query(f'{c} > {_99}')),
         } for c in ['sale', 'cogs', 'gross_margin']
         ]).set_index('variable').round(2)
     # Yes, my code is ugly.
     ```

2. **Ratio Construction**
    * Create new column: Gross Margin = (sale − cogs) / sale  
    * **Economic meaning**: Portion of revenue that represents profit; varies with capital intensity, product mix, and scalability of production (operating leverage)
    * **Handle edge cases**: Zero sales (or very small values), negative sales or COGS, missing values

3. **Initial Analysis**
    * Observe 5 number summary of `gross_margin`, and again over time (by `fyear`)
    * Note that the mean is ` -8` and the median is `0.4` - remember about outliers and skewed distributions
    * **Decision on outliers**: Remove any gross_margin < 0 or > 1 (document this choice in appendix)

4. **Cross-sectional Analysis**
    * Make a boxplot of `gross_margin` by `gics_sector_name` for 2024, noting those industries that stand out
    * **Create industry benchmarks**: Calculate sector medians, quartiles, and ranges

5. **Time-series Analysis**
    * Make a time-series plot of `gross_margin` over `fyear` for each `gics_sector_name`, noting the change over time of each sector
    * **Check for dispersion**: Examine the spread of `gross_margin` values within each sector over time, for example the interquartile range (IQR) or standard deviation (or scaled versions of either, e.g. coefficient of variation, which is the ratio of the standard deviation to the mean).

6. **Hypothesis Formation**
    * Summarize an economic story based on insights from the visualizations
    * **Hypothesis Example**: "Asset‑light or IP‑heavy sectors (Information Technology, Health Care) exhibit persistently higher gross margins than Industrials and Consumer Staples due to lower variable production costs; the median margin difference exceeds 10 percentage points over the entire time period."

7. **Evidence Gathering**
    * Choose descriptive statistics and visualizations that best capture your story. For example:
        * **Median difference** = median(GM_high_sector) − median(GM_low_sector)
        * **Relative difference** = difference / median(low_sector)
        * **Stability**: Standard deviation of annual difference across years
        * **Sensitivity**: Recompute after excluding top/bottom 5% of GM within each sector
        * **Multi-line plot**: Sector median GM by year, highlight top vs bottom sector
        * **Boxplot**: 2024 data sorted by sector median; highlight top 2, bottom 2

8. **Slide Deck Assembly**
* Assemble slide deck with a clear, visually appealing slide for each step: Question &rarr; Data (including the cleaning/filtering/etc. choices you made) &rarr; Evidence (concise slides with your visualizations) &rarr; Conclusion (connecting your evidence to your hypothesis). Slide outlines:
    * **Slide 1 (Title & Team)**
        * Project title, team member names, date
        * Professional formatting consistent throughout deck

    * **Slide 2 (Business Context & Question)**
        * Clear research question with measurable outcomes: "Does [ratio] vary materially by [industry]?"
        * Frame as investment decision: "Should we control for [industry] when building our portfolio on [ratio]?"
        * Optionally include specific decision framework: "What action would different findings trigger?"

    * **Slide 3 (Data & Cleaning Choices)**
        * Description of data (what, from where, when, etc.)
        * Sample size (after cleaning)
        * Time period and industry coverage
        * Optional (keeping slides clear and concise): Summary statistics, basic summary visualization

    * **Slide 4 (Key Visuals)**
        * A cross-sectional view (e.g., boxplot by industry) 
        * A time-series view (e.g., trends over years)
        * Clear axis labels, legends, and takeaway headlines
        * Annotate key insights directly on charts (e.g. line-thickness, opacity, labels, etc.)

    * **Slide 5 (Evidence of Difference)**
        * Size of differences: "Technology firms show 18pp higher median margins"
        * Economic significance: "Gap maintained over 10-year period with <2pp variation"
        * Optional: Sensitivity analysis results (e.g. excluding top/bottom 5% of GM within each sector)

    * **Slide 6 (Conclusion & Implications)**
        * Connect evidence back to original business question
        * Specific recommendations for executive team (e.g. adjust portfolio construction based on industry)
        * Optional: Acknowledge limitations and suggest further analysis

     * **[Optional] Slides 7+ (Appendix)**
        * *Note: the idea of an appendix slide is resources you would show if an audience member wants to dig deeper into the analysis. As such, it does not have to be as clear and concise as the main slides, but should still be professional.*
        * Data cleaning choices and their effects (dropping firms, bias from winsorization, etc.)
        * Ratio formulas and calculation methods
        * More complex vizualiations



---  
## 4. Data  

* **Source:** Compustat North America Fundamentals Annual file `CompustatAnnual.csv`.  
* **Identifying Variables** (keys): `firm_id` and `fyear` (Fiscal Year).  
* **Accounting Variables**: See Section [4.2 below](#42-data-dictionary) for definition of all variables.

### 4.1. FSA Ratio Suggestions  

The following suggestions are based on common financial ratios used in Financial Statement Analysis, and some brief economic ideas as to their variance across the three cross sections: Industry, Firm Age, and Firm Size.

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


### 4.2. Data Dictionary

The following variables are provided in `CompustatAnnual.csv`. Unless otherwise specified, financial numbers are all in millions of USD.  

* `firm_id`: ID to identify individual firms, preserving continuity through M&A activities
* `fyear`: Fiscal Year (based on majority of year, so 2000 connotes fiscal year ends between 7/1/1999 and 6/30/2000)
* `fiscal_year_end_month`: Fiscal Year End Month (1 - January, 12 - December)
* `name`: Firm Name (`conm`)
* `tic`: Ticker Symbol
* `age_days`: Age (post IPO) of firm, in days (calculated as the number of days since the first filed 10-K)
* `act`: Current Assets
* `ap`: Accounts Payable - Trade
* `at`: Total Assets
* `bve`: Book Value of Equity
* `capx`: Capital Expenditures
* `che`: Cash and Cash Equivalents
* `cogs`: Cost of Goods Sold
* `dvt`: Dividends - Total
* `ebit`: Earnings Before Interest & Taxes
* `ebitda`: Earnings Before Interest
* `epspi`: Earnings Per Share (Basic) - Including Extraordinary Items (amount in $ / share)
* `epspx`: Earnings Per Share (Basic) - Excluding Extraordinary Items (amount in $ / share)
* `gics_sector`: GICS Sector code
* `gics_sector_name`: GICS Sector code name
* `gics_group`: GICS Group code
* `gics_industry`: GICS Industry code
* `gics_subindustry`: GICS Subindustry code
* `ib`: Income Before Extraordinary Items
* `invt`: Inventory  
* `lct`: Current Liabilities  
* `lt`: Total Liabilities  
* `mve`: Market Value of Equity  (calculated as `MAX(prcc_f * csho, mkvalt)`)
* `ni`: Net Income  
* `oancf`: Operating Cash Flow
* `pi`: Pretax Income
* `re`: Retained Earnings
* `recd`: Receivables - Estimated Doubtful
* `rect`: Accounts Receivable  
* `revt`: Revenue - Total
* `sale`: Sales/Turnover (Net)  
* `seq`: Shareholders' Equity  
* `share_price`: Price Close - Annual - Fiscal (`prcc_f`)
* `shares_outstanding`: Common Shares Outstanding (`csho`)
* `total_debt`: Total Debt (calculated as `dltt + dlc`)
* `xad`: Advertising Expense
* `xint`: Interest Expense  
* `xrd`: R&D Expense  
* `xsga`: SG&A Expense  
* `auditor`: Name of Auditor
* `auop`: Auditor Opinion
* `auopic`: Auditor Opinion - Internal Control
* `bign`: Big N Auditor (calculated from `au`)
* `emp`: Employees (in thousands)
