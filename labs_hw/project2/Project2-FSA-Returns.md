# Project 2: Merging Financials and Stock Returns

[TOC]

## 1. Scenario: 

**Three Months Later: From Analysis to Implementation**

You are the same junior equity research analyst from Project 1, and your FSA ratio analysis was a hit with the portfolio team! Your presentation on cross-sectional differences in financial ratios caught the attention of Sarah Chen, the portfolio manager, who now has a follow-up assignment for you.

"Your Project 1 analysis was excellent," Sarah says, "but now I need to know the *so what*. You identified clear patterns in financial ratios across [whatever you did]—but do these patterns actually translate into investment returns? We need to test whether the FSA ratios you highlighted can generate alpha."

**The Trading Hypothesis**: The portfolio team wants to test whether the FSA ratio patterns you identified in Project 1 relate to earnings announcement returns. For example, if you found that high-ROA firms systematically outperform in the Technology sector, can we build a trading strategy around that insight?

You are given access to the same Compustat fundamental data from Project 1 (now limited to S&P 500 constituents only, for easier computation), along with CRSP daily stock return data for these same firms. Your job is to explore whether the FSA ratio patterns you identified in Project 1 show observable relationships with stock returns.

Your task: **Explore the relationship between your Project 1 FSA ratio findings and stock returns**. This involves:

1. Connect to the provided PostgreSQL database containing Compustat and CRSP data
2. Recreate your FSA ratio(s) and groupings from Project 1, (you can also look at more or fewer ratios, or entirely different ratios / cross sections if you wish)
3. Merge the compustat data with stock return data (merge keys being `ticker`, `shrcls`, and date variables like `earn_annc_date` or `fiscal_year_end`), ensuring proper timing alignment
4. Analyze whether firms with different ratio characteristics show different return patterns
5. Present your findings as preliminary evidence for potential investment strategies.


### 1.1. Learning Objectives

This project directly builds on your Project 1 FSA ratio analysis, extending it with market data. The intent is to build on your existing work, while adding new skills in data merging and return analysis.

By completing this project, you will:

* **Practice Data Merging**: Merge financial statement data with market return data in Power Query, Tableau, or Python
* **Practice Visualization**: Create visualizations to illustrate return patterns across FSA ratio groupings
* **Explore Return Patterns**: Analyze firm stock return patterns based on FSA ratio groupings
* **Test Practical Relevance**: Determine if your Project 1 findings have observable relationships with market performance
* **Optional: Practice Return Aggregation**: Calculate cumulative returns over different horizons (e.g., 3-day, 1-month, 3-month) around earnings announcements. This is optional but necessary if you want to explore longer-horizon future return effects of your trading strategy.



### 1.2. Deliverable

**Tone**: targeted to accounting and finance executives, minimal jargon, clear and concise.

Slide-deck (`.pptx` or `.pdf`) containing, at most:

1. **Title Slide**: Project title, group member names, date
2. **Research Question**: Clear description of the economic relationship between your FSA ratio findings and stock returns (this is your hypothesis or research question)
3. **Data Description and Methodology**:
    * FSA ratio(s) used (from Project 1 or new analysis)
    * Data merging process and timing decisions (merge keys, alignment choices), and sample description (firms, time period, data quality considerations)
4. **Key Findings** (1 or more slides):
    * Return patterns across FSA ratio groups with compelling visualizations
    * *Optional*: Multiple perspectives on the data (group comparisons, time trends, robustness)
    * *Optional*: Tabular evidence quantifying differences (or lack thereof) between high/low ratio firms
5. **Conclusions and Investment Implications**:
    * Clear assessment of whether or not FSA patterns translate to observable return differences
    * Investment relevance and practical trading considerations
    * Limitations and caveats
6. **Thank You / Questions**
7. **Appendix** (if needed, should be after the "last" slide): Additional charts, technical details, sensitivity analyses




---
## 2. Grading

Your project will be graded based on the following criteria:

1. **FSA Reasoning & Hypothesis**: How well does the analysis build on sound FSA reasoning? Is there a clear research question connecting FSA ratios to returns? (This could be the same reasoning as Project 1 if you kept the same ratios, or new reasoning if you changed your approach.)
2. **Data Merging & Documentation**: Is the data merging process well-executed and documented? Are merge keys, timing decisions, and data quality issues properly addressed?
3. **Return Analysis & Visualizations**: Are the return patterns across FSA ratio groups clearly analyzed and visualized? Do the charts effectively show differences between high/low ratio firms?
4. **Presentation**: Is the final presentation well-organized, professional, and tells a coherent story from Project 1 to investment implications?

Note: The focus is on demonstrating data merging skills, exploring return patterns, and connecting findings back to your Project 1 analysis. You don't need to prove that your FSA ratios create profitable trading strategies - the goal is to explore whether observable return differences exist and present your findings professionally.

### 2.1 Grading Rubric

1. **FSA Reasoning**: How well does the analysis build on sound FSA reasoning with a clear research question
    * **Excellent**: Clear FSA economic/accounting reasoning, well-articulated relationship between FSA ratios and returns, acknowledges limitations
    * **Good**: Limited FSA reasoning, weak ties between ratios and returns
    * **Needs Work**: No FSA reasoning
2. **Data Merging & Documentation**: How well-executed and documented the data merging process is
    * **Excellent**: Merge keys and timing alignment clearly explained, data quality issues identified and handled, reproducible process
    * **Good**: Successful merge with limited or no explanation of decisions and quality checks
    * **Needs Work**: Poor or unsuccessful merge, or significant data issues unaddressed
3. **Return Analysis & Visualizations**: How clearly return patterns across FSA ratio groups are analyzed and visualized. *Note: the efficient market hypothesis might suggest no patterns exist, but you should still explore and present the data, even if you find no patterns in returns.*
    * **Excellent**: Compelling charts showing any potential differences (or similarities) between ratio groups, multiple perspectives (high vs. low, quintiles, time trends), insights highlighted
    * **Good**: Visualizations showing return differences across ratio groups with limited analysis or insights
    * **Needs Work**: Poor visualization quality or no clear return pattern analysis
4. **Evidence & Analysis Quality**: How well the evidence supports or rejects the hypothesis about FSA ratios and returns
    * **Excellent**: Multiple forms of evidence (e.g., statistical tests, group comparisons, sensitivity analysis), quantified differences, robust analysis tying evidence to conclusion
    * **Good**: Some evidence with basic comparisons between ratio groups and return patterns, or limited connection between evidence and conclusion
    * **Needs Work**: Little or no meaningful analysis of ratio-return relationships
5. **Conclusions & Investment Relevance**: Whether conclusions about investment implications are presented clearly
    * **Excellent**: Clear conclusions about whether FSA patterns do or do not translate to observable return differences, practical investment relevance discussed
    * **Needs Work**: No conclusions presented or completely disconnected from analysis
6. **Storytelling & Slide Flow**: How cohesive the presentation flows from FSA findings (from Project 1 or new) to investment implications
    * **Excellent**: Clear narrative arc from FSA findings → hypothesis → analysis → investment conclusions, executive-ready presentation
    * **Good**: Some connection of FSA work to return analysis with reasonable cohesion
    * **Needs Work**: Poor organization, disconnected chain of logic, unclear narrative
7. **Professionalism & Formatting**: How aesthetic and professional the slides appear
    * **Excellent**: Aesthetic, professional slides, consistent formatting, appropriate for executive audience
    * **Good**: Some formatting issues, generally professional and appropriate
    * **Needs Work**: Unprofessional appearance, significant formatting problems


---
## 3. Data Sources

### 3.1. Data Access Options

All students will access the same PostgreSQL database but can choose their preferred tool for data extraction and merging:

**Database Details:**
* Connection details in Canvas
* *Database*: `ADA_SQL`
    * *Excel:* Can connect via Power Query
    * *Tableau:* Built-in database connectivity
    * *Python:* See Lab 5 starter notebook for connecting
    * *Tables*: 
        * `compustat_annual`: S&P 500 fundamental data (2015-2025, same structure as Project 1)
        * `crsp_daily`: Daily stock return data for S&P 500 firms


### 3.4. Data Dictionary

**CRSP Variables**:

* `ticker`: Ticker Symbol
* `shrcls`: Share Class (e.g., 'A', 'B', 'C', etc.)
* `date`: Return date (skips weekends and holidays)
* `ret`: Total return (including dividends)
* `prc`: Price per share
* `shrout`: Shares outstanding (thousands)
* `vol`: Trading volume (number of shares traded)
* `bid`: End of day bid price
* `ask`: End of day ask price


**Compustat Variables**:

* `firm_id`: ID to identify individual firms, preserving continuity through M&A activities
* `fyear`: Fiscal Year (based on majority of year, so 2000 connotes fiscal year ends between 7/1/1999 and 6/30/2000)
* `fiscal_year_end`: Fiscal Year End
* `fiscal_year_end_prev`: Fiscal Year End of the previous year
* `fiscal_year_end_next`: Fiscal Year End of the next year
* `earn_annc_date`: Earnings announcement date
* `earn_annc_date_prev`: Earnings announcement date of the previous year
* `earn_annc_date_next`: Earnings announcement date of the next year
* `name`: Firm Name
* `ticker`: Ticker Symbol
* `shrcls`: Share Class (e.g., 'A', 'B', 'C', etc.)
* `age_days`: Age (post IPO) of firm, in days (calculated as the number of days since the first filed 10-K)
* `act`: Current Assets
* `ap`: Accounts Payable - Trade
* `at`: Total Assets
* `auditor`: Name of Auditor
* `auop`: Auditor Opinion
* `auopic`: Auditor Opinion - Internal Control
* `bign`: Big N Auditor (calculated from `au`)
* `bve`: Book Value of Equity
* `capx`: Capital Expenditures
* `che`: Cash and Cash Equivalents
* `cogs`: Cost of Goods Sold
* `dvt`: Dividends - Total
* `ebit`: Earnings Before Interest & Taxes
* `ebitda`: Earnings Before Interest
* `emp`: Employees (in thousands)
* `epspi`: Earnings Per Share (Basic) - Including Extraordinary Items (amount in $ / share)
* `epspx`: Earnings Per Share (Basic) - Excluding Extraordinary Items (amount in $ / share)
* `gics_sector_name`: GICS Sector code name (string)
* `gics_sector`: GICS Sector code (numeric)
* `gics_group`: GICS Group code (numeric)
* `gics_industry`: GICS Industry code (numeric)
* `gics_subindustry`: GICS Subindustry code (numeric)
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
* `xrd`: R&D Expense (many missing for non-tech firms, treat as zero if needed) 
* `xsga`: SG&A Expense  



---
## 4. Suggested Workflow

1. **Database Setup & Exploration**
    * Establish PostgreSQL connection in your modality
    * Explore data schema, understand table relationships and date timing

2. **Data Integration**
    * Merge Compustat fundamentals with CRSP returns via `ticker`, `shrcls`, and some date
    * Decide on timing (e.g. align returns with fiscal year-end or earnings announcement)
    * Address missing data and ensure timing decisions are well documented

3. **Recreate Project 1 FSA Analysis**
    * Calculate the FSA ratios and groupings from Project 1. Alternatively, calcluate new ratios and findings.
    * Apply the same (or new) cross-sectional analyses
    * Document the initial FSA patterns still hold in the S&P 500 subset, and provide a basis from which to start the returns investigation

4. **Return Pattern Analysis**
    * Calculate returns around earnings announcements (e.g. 1-day, 3-day, 1-week, 1-month windows). *Note*: the timing of the returns is up to you, but academic research has shown that much of the information released in the earnings announcement does not get impounded into price immediately, thus longer windows may yield more interesting results.
    * Group firms by FSA ratio bins. Again, you can choose your bins, such as median cut (low/high), terciles (low/mid/high), quintiles, etc.
    * Compare returns across bins. You should decide and justify measuring average or median returns, whether you look at all bins or just the lowest/highest, etc.
    * Consider multiple forms of evidence on differences or lack thereof

5. **Visualization & Evidence Development**
    * Create charts showing return patterns across FSA ratio groups
    * Develop visualizations that clearly demonstrate any relationships (or lack thereof)
    * Consider multiple time horizons and robustness checks
    * Document data quality issues and limitations

6. **Conclusion and Investment Strategy Recommendation**
    * Assess whether FSA ratio patterns translate to actionable trading opportunities, or should be avoided as fruitless
    * Consider timing of information, and whether trading strategies are feasible (or require knowing information before it is made public)
    * Present findings as preliminary evidence for portfolio management decisions


## 5. Technical Implementation Suggestions

### 5.1. Bin Calculations


**Tableau Bin Calculations**

```tableau
IF [ROA] <= {FIXED [Fyear] : PERCENTILE([ROA], 0.2)} THEN "1 - Low"
    ELSEIF [ROA] <= {FIXED [Fyear] : PERCENTILE([ROA], 0.4)} THEN "2 - Mid-low"
    ELSEIF [ROA] <= {FIXED [Fyear] : PERCENTILE([ROA], 0.6)} THEN "3 - Middle"
    ELSEIF [ROA] <= {FIXED [Fyear] : PERCENTILE([ROA], 0.8)} THEN "4 - Mid-high"
    ELSE "5 - High"
END
```


**Python Bin Calculations**

```python
# For quintile bins by year
df['roa_quintile'] = df.groupby('fyear')['roa'].transform(
    lambda x: pd.qcut(x, 5, labels=['1 - Low', '2 - Mid-low', '3 - Middle',
                                    '4 - Mid-high', '5 - High'], duplicates='drop')
)
# Alternative approach using percentile ranks
df['roa_quintile'] = df.groupby('fyear')['roa'].transform(
    lambda x: pd.cut(x,
                     bins=[x.min()-0.001, x.quantile(0.2), x.quantile(0.4),
                           x.quantile(0.6), x.quantile(0.8), x.max()],
                     labels=['1 - Low', '2 - Mid-low', '3 - Middle',
                            '4 - Mid-high', '5 - High'],
                     include_lowest=True)
)
# For simple high/low median split
df['roa_bin'] = df.groupby('fyear')['roa'].transform(
    lambda x: 'High' if x >= x.median() else 'Low'
)
```

### 5.2. Return Calculations

Combining daily returns into, say, weekly is the process of calculating cumulative returns, or buy-and-hold returns.
Returns are calculated as the percentage change in price, or (P[@t] - P[@t-1]) / P[@t-1] which simplifies to P[@t] / P[@t-1] - 1. 
To cumulate returns over multiple periods, use the product of (1 + ret), then subtract 1.
Writing out the algebra will show you why, because the 1 + ret = P[@t] / P[@t-1], and multiplying that by the next period P[@t-1] / P[@t-2] results in P[@t] / P[@t-2]).


Often the software used will have functionality for summing a column of values, but not necessarily taking the product.
For this reason, we sometimes calculate cumulative returns using a log trick, because multiplication and division become addition and subtraction with logs.
For example, in Tableau, you can calculate cumulative returns with the equation: `(EXP(SUM(LN(1 + [Ret]))) - 1)` (a similar trick can be used in SQL).
In Excel, I have found it helpful to create a new column that is just `[@ret] + 1`, and then use the formula `=PRODUCT([@ret_plus1]) - 1`.
A simiple python solution would be `df['return_yearly'] = df.groupby(['ticker', 'fyear'])['ret'].agg(lambda x: (1+x).prod()-1)`


### 5.3. Dataset Combination

You may find it convenient to do the merge in SQL, and only deal with one, cleanly combined dataset.
You could also just get the raw datasets from the database, save those as, e.g. CSV files, then use your software to to the merges yourself.
Or you could download and merge in Python, create a clean dataset, and do the analysis in Tableau.
In general, because each modality we use has its strengths and weaknesses, I suggest trying to use the "right tool for the job" in each separate step of the project.

*Data merging example for 1 day of returns*:
```sql
-- Merge fundamentals with returns on earnings announcement date
SELECT *
FROM compustat_annual AS acct
LEFT JOIN crsp_daily AS ret
   ON acct.ticker = ret.ticker
   AND COALESCE(acct.shrcls, 'A') = COALESCE(ret.shrcls, 'A')
   AND acct.earn_annc_date = ret.date
;
```

*Data merging example for next year of returns*:
```sql
-- Merge fundamentals with returns on earnings announcement date
SELECT *
FROM compustat_annual AS acct
LEFT JOIN crsp_daily AS ret
   ON acct.ticker = ret.ticker
   AND COALESCE(acct.shrcls, 'A') = COALESCE(ret.shrcls, 'A')
   AND ret.date BETWEEN acct.earn_annc_date AND acct.earn_annc_date_next - INTERVAL 1 DAY
;
```

Getting a fixed number of return days after the earnings announcement date is a bit trickier, because stock doesn't trade on weekends so you can't just take date + 3 and assume it will be 3 days of returns. 
This is one of those examples of real world data being tricky to deal with.
The solution to this is usually to just number the trading days sequentially, so you can keep any number of them and not worry about weekends.

To demonstrate how you could use LLMs to write SQL code for you, I prompted Gemini with the following prompt, and got the SQL code below as an output:

<blockquote style="background-color: #f9f9f9; border-left: 10px solid #ccc; margin: 1.5em 10px; padding: 0.5em 10px;">
please suggest an sql merge of annual data (table name 'compustat_annual AS f') onto stock returns (table name 'crsp_daily AS r', date variable 'date'), keeping the first three days of returns starting on 'f.earn_annc_date'. The merge needs to handle the fact that stock is only traded on the weekdays, so it can't just be 3 calendar days after f.earn_annc_date. The pertinent variables are f.ticker, f.fyear, f.earn_annc_date, and r.ticker, r.date, r.ret.
</blockquote>

```SQL
WITH RankedReturns AS (
    -- Step 1: Join returns to financials and rank the trading days
    SELECT
        f.ticker,
        f.fyear,
        f.earn_annc_date,
        r.date AS trading_date,
        r.ret,
        ROW_NUMBER() OVER(PARTITION BY f.ticker, f.earn_annc_date ORDER BY r.date ASC) as trading_day_rank
    FROM
        compustat_annual AS f -- your annual data table
    JOIN
        crsp_daily AS r -- your stock returns table
            ON f.ticker = r.ticker
            AND r.date >= f.earn_annc_date -- Join returns on or after the report date
            AND r.date <= DATE_ADD(f.earn_annc_date, INTERVAL '10 DAY') -- Limit to a reasonable window to avoid excessive data
)
-- Step 2: Select only the first three ranked trading days
SELECT
    ticker,
    fyear,
    earn_annc_date,
    trading_date,
    ret,
    trading_day_rank
FROM
    RankedReturns
WHERE
    trading_day_rank <= 3
ORDER BY
    ticker,
    fyear,
    trading_day_rank
;
```
