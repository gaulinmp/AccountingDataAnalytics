# Lab 8: 4 Stages of Analytics

Lab 8 introduces you to the 4 stages of analytics:

* Descriptive: *What* happened?
* Diagnostic: *Why* did it happen?
* Predictive: What *will* happen?
* Prescriptive: What *should* we make happen?

[TOC]

## 1. Assignment

**Submission:** To complete this lab, complete the Canvas quiz, including uploading visualizations in image form ([win10/11](https://support.microsoft.com/en-us/windows/use-snipping-tool-to-capture-screenshots-00246869-1843-655f-f220-97299b865f6b#id0edd=windows_10), [macOS](https://support.apple.com/en-in/guide/mac-help/mh26782/mac)):

1. **Descriptive Analytics**: scatter plots with trend line showing R<sup>2</sup>
2. **Diagnostic Analytics**: explanations of the *why* behind relationships
3. **Predictive Analytics**: exploring future, predictive relationships
4. **Prescriptive Analytics**: tying analyses to decision-making

*Note*: Consider the aesthetics of your visualizations. Clear, well-organized visuals with readable axis labels and titles will help convey your findings more effectively.


### 1.1. Learning Objectives

By the end of this lab, you will be able to:

* Understand and apply the 4 stages of analytics: Descriptive, Diagnostic, Predictive, and Prescriptive
* Use linear regression and R<sup>2</sup> to measure relationship strength between financial variables
* Interpret goodness-of-fit measures to evaluate model quality
* Distinguish between relationships that explain the past vs. predict the future
* Recognize the difference between strong explanatory relationships (balance sheet/operations) and weak predictive relationships (fundamentals to returns)
* Consider how analytical insights can inform business decisions through the lens of understanding economic and market mechanisms

### 1.2. Tools

As always, you can use Excel, Python, or Tableau for this lab. At this point, you should be comfortable making scatter plots, and this lab will introduce you to adding trend lines and displaying R<sup>2</sup> values.

*However*, to demonstrate how useful LLMs can be to help with exploratory data analysis, I made a simple one-page HTML/JavaScript app that generates the required scatter plots with trend lines and R<sup>2</sup> values automatically. You can use this app to quickly generate the visualizations you need for the lab, regardless of your preferred tool. That tool is available [on canvas](https://utah.instructure.com/courses/1171903/pages/regression-eda), and you can download it there to run it locally on your computer.

I used an initial one-line prompt (collapsed, below) in ChatGPT to generate a first draft, then used Claude Code to add more features, then asked Claude to re-generate a prompt that would cover all the features I had added (also collapsed, below). You can copy/paste that prompt into your own LLM to generate your own version of the app, and modify it to add more features if you like. I use this as a further demonstration of how, with a good prompt, LLMs can help you quickly generate useful code to generate very valuable tools.

??? "Initial prompt"
    Make me a simple one-page website that takes a csv file upload, then populates a two dropdowns: x and y from the column headers of the CSV. Those dropdowns should show all the variables from the CSV, and they will be used to set the Y and X axis of the plot, which will be beneath the side-by-side dropdowns. The graph should be plotted in D3, aesthetically pleasing, and show a scatterplot of the two variables, and overlay the regression line of Y on X. The regression statistics should also be plotted, including slope, intercept, and R2.


??? "Claude generated prompt for full features (you can copy/paste this into an LLM to get your own version, add features, etc.)"
    Create a single-file HTML page with embedded JavaScript using D3.js that:

    1. Allows users to upload a CSV file
    2. Automatically populates three dropdowns:
        - X axis: numeric columns only
        - Y axis: numeric columns only
        - Hue: all columns, with "(none)" option and clear button
    3. Auto-selects the first two numeric columns for X and Y
    4. Displays a scatter plot with:
        - Points colored by hue variable (if selected)
        - OLS regression line overlaid
        - Optional 90% confidence interval band (toggleable checkbox)
        - Hover tooltips showing Y, X, and Hue values with variable names
    5. Shows regression statistics: slope, intercept, R<sup>2</sup>, RMSE, and N
    6. Displays the regression equation as text on the plot
    7. Handles hue coloring:
        - Categorical (≤20 unique values): discrete color palette with legend
        - Numeric (>20 unique values): continuous Viridis colorscale with colorbar
        - Non-numeric with ≥100 values: default to single color
        - Numeric with any number of values: always use continuous colorscale
    8. Filters out non-numeric, empty, and whitespace-only values from X/Y calculations
    9. Updates plot automatically when any dropdown or checkbox changes

## 2. Data

The dataset for this lab contains annual financial statement data from Compustat merged with stock return data from CRSP for the 10 largest companies in each GICS sector from 2015 to present.

### 2.1. Data Source

The data is provided as a CSV file containing financial fundamentals and market returns for thousands of firm-year observations. A sample of the data is shown at the top of this document. For those curious, I've included the SQL code used to generate the dataset at the end of the document.

### 2.2. Data Dictionary

Full data dictionary is provided at the end of this document. Key variables include:

* **Firm Identifiers**
    * `firm_id`: Unique firm identifier (different from previous datasets, i.e. can't be merged with prior data)
    * `ticker`: Stock ticker symbol
    * `firm_name`: Company name
    * `fyear`: Fiscal year
    * `gics_sector_name`: GICS sector classification
* **Balance Sheet Variables**
    * `at`: Total assets (millions of dollars)
    * `lt`: Total liabilities (millions of dollars)
    * `act`: Current assets (millions of dollars)
    * `lct`: Current liabilities (millions of dollars)
    * `bve`: Book value of equity (millions of dollars)
* **Income Statement Variables**
    * `revt`: Total revenue (millions of dollars)
    * `sale`: Sales/revenue (millions of dollars)
    * `cogs`: Cost of goods sold (millions of dollars)
    * `ni`: Net income (millions of dollars)
    * `ebitda`: Earnings before interest, taxes, depreciation, and amortization (millions of dollars)
    * `xrd`: Research and development expense (millions of dollars)
* **Market Variables**
    * `mve`: Market value of equity (millions of dollars)
    * `bhret_year_prev`: Buy and hold return for trading days starting from the trading day *after* the previous year's earnings announcement, through the trading day *before* the earnings announcement date(decimal, e.g., 0.15 = 15%)
    * `bhret_year_next`: Buy and hold return for trading days starting from the trading day *after* the earnings announcement date, to the trading day *before* the next earnings announcement (decimal, e.g., 0.10 = 10%)
    * `bhret_0`: Stock return on earnings announcement date (or first trading day after, if the EA does not land on a trading day) (decimal)
    * `bhret_m1_p1`: 3-day return around earnings announcement (day -1 to +1)
    * `positive_ea_return`: Indicator variable for whether the earnings announcement return (`bhret_0`) is positive (1 = positive return, 0 = negative return)
* **Calculated Ratios**
    * `rd_sales`: R&D intensity, calculated as `xrd / sale` (R&D expense as % of sales)
    * `gross_margin`: Gross profit margin, `(revt - cogs) / revt`
    * `current_ratio`: Current assets / current liabilities
    * `debt_equity`: Total debt / book value of equity



## 3. Question Outline

This lab walks you through the four stages of analytics using financial data. You'll discover that while some relationships are very strong (and explainable), predicting future stock returns from accounting fundamentals is surprisingly difficult.

### 3.1. Descriptive Analytics: *What* happened?

Descriptive analytics answers the question *what relationships exist in our data?* In this lab, we will achieve this by useing scatter plots with trend lines and R<sup>2</sup> values to measure how strongly variables are related. R<sup>2</sup> ranges from 0 to 1, where:

* **R<sup>2</sup> = 1**: Perfect linear relationship
* **R<sup>2</sup> = 0.7-0.9**: Very strong relationship
* **R<sup>2</sup> = 0.4-0.7**: Moderate relationship
* **R<sup>2</sup> < 0.1**: Weak or no relationship
* **R<sup>2</sup> < 0.01**: Where most stock-return relationships fall (and why active trading almost never beats the diversified market portfolio on the long run)

1. How related are revenue and cost of goods sold?
    * Create a scatter plot with `revt` and `cogs` with a linear trend line and display the R<sup>2</sup> value
    * Expected finding: Strong relationship (R<sup>2</sup> > 0.8)
2. How related are current assets and current liabilities?
    * Create a scatter plot with `act` and `lct`
    * Add a linear trend line and display the R<sup>2</sup> value
    * Expected finding: Strong relationship (R<sup>2</sup> > 0.8)
3. How related are market value and book value of equity?
    * Create a scatter plot with `bve` and `mve` with a linear trend line and display the R<sup>2</sup> value
    * Expected finding: Moderate to weak relationship (R<sup>2</sup> ≈ 0.2-0.6)
4. How related are consecutive year stock returns?
    * Create a scatter plot with `bhret_year_prev` and `bhret_year_next` with a linear trend line and display the R<sup>2</sup> value
    * What does the R<sup>2</sup> tell you about return momentum or mean reversion?
5. Choose your own adventure relationship: look through the relationships between variables, and choose one you find interesting.
    * Create a scatter plot with your variables
    * Add a linear trend line and display the R<sup>2</sup> value

<!-- <span style="font-family: monospace; background-color: #eeeeee;">act</span> -->

---

### 3.2. Diagnostic Analytics: *Why* did it happen?

Diagnostic analytics seeks to answer *why do these relationships exist?* We move beyond just observing patterns to explaining the business and economic reasons behind them.


1. Why are `revt` and `cogs` strongly related?
    * What is the direct operational connection?
    * How does producing more revenue affect costs?
    <!-- * *Expected reasoning*: Direct operational relationship—generating more sales requires more inventory, materials, and production capacity, creating proportional cost of goods sold. This is especially true for manufacturing and retail firms where COGS is a major component of the income statement. -->
2. Why are `act` and `lct` strongly related?
    * What is working capital?
    * How do firms manage short-term assets and liabilities together?
    * What operational cycle creates this relationship?
    <!-- * *Expected reasoning*: Working capital management—firms match short-term assets (receivables, inventory) with short-term liabilities (payables). The operational cycle (buying inventory, selling on credit, collecting cash, paying suppliers) creates a natural relationship. More current assets typically mean more operations, which requires more short-term financing. -->
3. Why are `mve` and `bve` related but not perfectly?
    * What does book value measure vs. market value?
    * What factors might cause them to diverge?
    * Why might some firms trade at a premium or discount to book value?
    <!-- * *Expected reasoning*: Market value reflects investor expectations about future earnings, growth prospects, and risk, while book value is historical accounting cost. Market value includes intangible assets (brand value, intellectual property) not fully captured in book value. High-growth firms may trade at high market-to-book ratios, while distressed firms may trade below book value. -->
4. Why are (or aren't) `bhret_year_prev` and `bhret_year_next` strongly related?
    * If markets are efficient, should past returns predict future returns?
    * What does momentum vs. mean reversion mean in finance?
    * What might the R<sup>2</sup> from your descriptive analysis suggest about market efficiency?
    <!-- * *Expected reasoning*: If R<sup>2</sup> is low, it suggests market efficiency—past returns don't reliably predict future returns because information is already incorporated into prices. If there's some relationship, it might suggest momentum effects or industry trends, but the relationship should still be weak. -->
5. Explain the relationship you chose in Q5 of the descriptive section.
    * Why do you think these variables are related?
    * What did you find interesting about this relationship?

---

### 3.3. Predictive Analytics: What *will* happen? (Homework 8, but here for continuity and a heads up)

Homework 8 will continue on with predictive analytics, which asks *can we use current data to predict future outcomes?* This is where things get conceptually (and statistically) more difficult, because while understanding the past is like understanding a test question studying the solution, understanding the future is like answering the test question on your own. You've hopefully seen that while balance sheet and income statement relationships are strong (high R<sup>2</sup>), predicting future stock returns from accounting fundamentals is extremely difficult (low R<sup>2</sup>).


1. Can net income (`ni`) predict next year's stock returns (`bhret_next_year`)?**
    * *To ponder*: Why might this be/not be the case? Isn't stock price discounted future cash flows?
3. Can *scaled* NI (`roa`) predict next year's stock returns (`bhret_next_year`)?**
    * *To ponder*: Why might scaling NI by assets (ROA) help/hurt predictive power?
2. How predictable is current net income (`ni`) from past net income (`ni_prev`)?**
    * *To ponder*: If this year's net income is predictable from last year's net income, then what "news" is conveyed when announcing current earnings? If earnings are predictable (high R<sup>2</sup>), why would they generate abnormal returns (low R<sup>2</sup> in Q1)? What does this tell you about market efficiency?
4. Can R&D intensity (`rd_sales`) predict next year's stock returns (`bhret_next_year`)?**
    * *To ponder*: R&D is an investment in future output, so should it predict future returns? When would/wouldn't this be the case?
5. Compare multiple predictors of next year's stock returns (`bhret_next_year`):
    * Which accounting variable or ratio has the strongest relationship with `bhret_next_year`?
        * *Note to Excel users*: You might want to know about the function `=RSQ(Ys, Xs)` which calculates R<sup>2</sup>s
    * How do the R<sup>2</sup> values for stock returns compare to those we looked at involving solely accounting measures?



---

### 3.4. Prescriptive Analytics: What *should* we do? (Homework 8, but here for continuity and a heads up)

Homework 8 will also delve into prescriptive analytics, which asks *how can we use these insights to make better decisions?* This stage leverages findings from the previous stages to develop data-driven recommendations for decision-makers.


1. Given your analysis of `rd_sales` and future stock returns, what investment strategy might be promising? What are the risks and limitations of this strategy?
    <!-- *Expected reasoning*: Focus on R&D-intensive firms in growth industries (technology, pharmaceuticals, etc.) since R&D represents forward-looking investment. However, the low R<sup>2</sup> means this shouldn't be the sole investment criterion. Combine with other factors: competitive position, management quality, industry trends, valuation metrics. -->
2. Should analysts focus more on balance sheet or income statement metrics for predicting returns?
    <!-- * *Expected reasoning*: Neither strongly predicts returns individually (both have low R<sup>2</sup>). This supports the efficient market hypothesis—publicly available accounting data is already priced in. Investors should: (1) use comprehensive analysis including qualitative factors, (2) focus on forward-looking information, (3) employ diversification strategies, (4) consider longer time horizons. -->
3. Identifying Unusual Firms Using Descriptive Relationships: how can the ACT/LCT relationship identify risky firms?
    * What if a firm has much higher LCT than predicted by ACT?
    * What if a firm is significantly away from the trend line?
    <!-- * *Expected reasoning*: Firms far above the trend line (higher liabilities than predicted) may have liquidity problems or aggressive working capital management. Firms below the line may be underleveraged or have conservative working capital policies. Significant deviations warrant further investigation into: Cash conversion cycle, Industry norms, Seasonal effects, Credit terms with suppliers/customers -->
4. Management Actions Based on Deviations: what might you conclude if your firm's metrics deviate significantly from the average relationships found in Lab 8?
    * What operational issues might be present?
    * How would you benchmark against peers?
    <!-- * *Expected reasoning*: **ACT/LCT deviation**: Investigate inventory management, receivables collection, or payables strategy, **REVT/COGS deviation**: Examine pricing strategy, cost controls, product mix changes, or industry margin compression, **MVE/BVE deviation**: If trading below book value, consider buybacks, asset sales, or strategic restructuring; if high M/B ratio, ensure growth investments justify premium valuation -->


## 4. Guidance for Completing the Lab

This section provides technical guidance for completing the lab using your preferred tool.

### 4.1. General Workflow (All Tools)

1. **Load the data**: Import the financial dataset (provided as CSV or pre-loaded in starter notebook)
2. **Data exploration**: Familiarize yourself with variables, check for missing values, understand the scale of variables
3. **Create scatter plots**: For each question, create a scatter plot with:
    * Appropriate X and Y variables
    * Linear trend line
    * R<sup>2</sup> value displayed on the chart
    * Clear axis labels (remembering that the accounting values are in **millions of dollars**) and title
4. **Interpret R<sup>2</sup> values**:
    * R<sup>2</sup> > 0.7 = strong relationship
    * R<sup>2</sup> = 0.4-0.7 = moderate relationship
    * R<sup>2</sup> < 0.1 = weak/no relationship
5. **Answer diagnostic questions**: Use business reasoning to explain WHY relationships exist
6. **Compare across stages**: Notice the dramatic difference in R<sup>2</sup> between descriptive and predictive questions
7. **Develop recommendations**: Synthesize insights into actionable prescriptive advice


### 4.2. Expected R<sup>2</sup> Patterns

To help you verify your work, here are the expected patterns:

* Descriptive Analytics (explaining the past):
    * `act` vs `lct`: High R<sup>2</sup> (> 0.7) for working capital relationship
    * `revt` vs `cogs`: Very high R<sup>2</sup> (> 0.7) for direct operational relationship
    * `bve` vs `mve`: Moderate to Weak R<sup>2</sup> (≈ 0.2-0.6) because value estimates are related but diverge based on growth/risk/industry/business model
    * `bhret_year_next` vs `bhret_year_prev`: Low R<sup>2</sup> (≈ 0.0) for returns being predicted from past returns


### 4.3. Excel Steps

* Trend line and R<sup>2</sup>
    * Select the two columns you want to plot (e.g., `act` and `lct`)
    * Go to Insert > Scatter (X, Y) chart
    * Click on a data point, then right-click > Add Trendline (also accessible from Chart Design > Add Chart Element > Trendline)
    * In Trendline Options, check "Display Equation on chart" and "Display R-squared value on chart" (I would also increase the font size so it's legible)
    * Format the chart with clear title and axis labels
    * Adjust axis scales if outliers compress the main data

### 4.4. Python Steps

Basic workflow:

```python
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from scipy import stats

df = pd.read_csv('financial_data.csv') # load your data

y = 'act'
x = 'lct'
_tmpdf = df[[y, x]].dropna(how='any') / 1e3 # scale to billions for readability

ax = sns.regplot(x=x, y=y, data=_tmpdf, scatter_kws={'alpha':.1}, line_kws={'color':'black'})
ax.set_title('Current Assets vs Liabilities with Trend')
ax.set_xlabel('Current Liabilities ($ billions)')
ax.set_ylabel('Current Assets ($ billions)')

slope, intercept, r_value, p_value, std_err = stats.linregress(_tmpdf[y], _tmpdf[x])
ax.text(0.05, 0.95, f'R<sup>2</sup> = {r_value**2:.3f}', transform=ax.transAxes)
```

### 4.5. Tableau Steps

[Tableau Cloud Link](https://10ay.online.tableau.com/#/site/accounting-data-analytics/home)

* Drag the X-variable (e.g., `act`) to Columns
* Drag the Y-variable (e.g., `lct`) to Rows
* Go to the "Analysis" menu and ensure "Aggregate Measures" is unchecked
* Right-click on the plot > Trend Lines > Show Trend Lines
    * I have found no way of displaying R<sup>2</sup> directly on the plot in Tableau, but if you hover over the trend line at the far right of the graph, it will show R<sup>2</sup> in the tooltip and that will show up in your screenshot.
* Add descriptive titles and axis labels (note, accounting values are in millions)
   

## 5. Reflection Questions

After completing the lab, consider:

1. What surprised you most? The difference between descriptive R<sup>2</sup> and predictive R<sup>2</sup>?
2. What do your findings suggest about the efficient market hypothesis?
3. If you were a portfolio manager, how would you use these insights?
4. What are the limitations of using R<sup>2</sup> and linear regression for these analyses?
5. What other variables or methods might improve return predictions?


## 6. Data Dictionary

The following variables are included in the dataset, in addition to those described [above](#22-data-dictionary).

**Accounting variables:**

* `firm_id`: ID to identify individual firms, preserving continuity through M&A activities
* `fyear`: Fiscal Year (based on majority of year, so 2000 connotes fiscal year ends between 7/1/1999 and 6/30/2000)
* `fiscal_year_end`: Fiscal Year End
* `fiscal_year_end_prev`: Fiscal Year End of the previous year
* `fiscal_year_end_next`: Fiscal Year End of the next year
* `earn_annc_date`: Earnings announcement date
* `earn_annc_date_prev`: Earnings announcement date of the previous year
* `earn_annc_date_next`: Earnings announcement date of the next year
* `firm_name`: Firm Name
* `ticker`: Ticker Symbol
* `age_years`: Age (post IPO) of firm, in years (calculated as the number of years since the first filed 10-K)
* `accruals`: Total Accruals (calculated as income before extraordinary items - operating cash flow)
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
* `emp`: Number of employees (in full-time equivalents, *not* in thousands)
* `epspi`: Earnings Per Share (Basic) - Including Extraordinary Items (amount in $ / share)
* `epspx`: Earnings Per Share (Basic) - Excluding Extraordinary Items (amount in $ / share)
* `ib`: Income Before Extraordinary Items
* `invt`: Inventory  
* `lct`: Current Liabilities  
* `lt`: Total Liabilities  
* `mve`: Market Value of Equity
* `ni`: Net Income  
* `oancf`: Operating Cash Flow
* `pi`: Pretax Income
* `re`: Retained Earnings
* `recd`: Receivables - Estimated Doubtful
* `rect`: Accounts Receivable  
* `revt`: Revenue - Total
* `sale`: Sales/Turnover (Net)  
* `seq`: Shareholders' Equity  
* `share_price`: Price Close - Annual - Fiscal
* `shares_outstanding`: Common Shares Outstanding
* `total_debt`: Total Debt
* `xad`: Advertising Expense
* `xint`: Interest Expense  
* `xrd`: R&D Expense
* `xsga`: SG&A Expense  

**Industry Classification Variables**:

* `gics_sector_name`: GICS Sector code
* `gics_group_name`: GICS Group code
* `gics_industry_name`: GICS Industry code
* `gics_subindustry_name`: GICS Subindustry code


**Financial Ratios**:

* Profitability Ratios:
    * `gross_margin`: Gross profit margin, calculated as `(sale - cogs) / sale`
    * `operating_margin`: Operating profit margin, calculated as `ebit / sale`
    * `roa`: Return on assets, calculated as `ni / at_prev`
    * `roa_noex`: Return on assets, excluding extraordinary items, calculated as `ib / at_prev`
    * `roe`: Return on equity, calculated as `ni / seq_prev`
    * `ep`: Earnings-to-price ratio, calculated as `ni / mve`

* Liquidity Ratios:
    * `current_ratio`: Current ratio, calculated as `act / lct`
    * `quick_ratio`: Quick ratio (acid-test ratio), calculated as `(act - invt) / lct`

* Efficiency Ratios:
    * `inventory_turnover`: Inventory turnover, calculated as `cogs / ((invt + invt_prev) / 2)`
    * `receivables_turnover`: Receivables turnover, calculated as `sale / ((rect + rect_prev) / 2)`

* Leverage Ratios:
    * `debt_equity`: Debt-to-equity ratio, calculated as `total_debt / seq`
    * `interest_coverage`: Interest coverage ratio, calculated as `ebit / xint`

* Growth and Investment Ratios:
    * `capex_sales`: Capital expenditure intensity, calculated as `capx / sale`
    * `ni_growth`: Growth in net income, calculated as `ni / ni_prev`
    * `rd_sales`: R&D intensity, calculated as `xrd / sale` (with `xrd` filled to 0 if missing)
    * `sga_sales`: SG&A intensity, calculated as `xsga / sale` (with `xsga` filled to 0 if missing)

* Cash Flow Ratios:
    * `fcf_ni`: Free cash flow to net income ratio, calculated as `(oancf - capx) / ni`
    * `accruals_at`: Accruals to average total assets ratio, calculated as `accruals / ((at + at_prev) / 2)`

## 7. SQL Code to Generate Dataset

Below (expandable) is the SQL code used to generate the dataset, for those interested. You do not need to run this code, as the dataset is provided.

??? "SQL Code:"
    ```sql
    WITH
    event_window_numbered AS (
        SELECT
            c.permno, c.fyear, c.rdq, d.ticker, d.date, d.ret,
            ROW_NUMBER() OVER(PARTITION BY c.permno, c.fyear ORDER BY d.date) AS trade_date_num
        FROM compustat_annual AS c
        INNER JOIN crsp_daily AS d
            ON c.permno = d.permno
            AND d.date > c.rdq_prev
            AND d.date < c.rdq_next
    ),
    event_data_with_relative_day AS (
        SELECT
            permno, fyear, ticker, date, ret,
            (trade_date_num - MIN(CASE WHEN date >= rdq THEN trade_date_num END) OVER (PARTITION BY permno, fyear)) AS relative_trade_day
        FROM event_window_numbered
    ),
    bhret_yr_prev AS (
        SELECT
            permno, fyear, EXP(SUM(LN(1 + ret))) - 1 AS bhret_year_prev
        FROM event_data_with_relative_day
        WHERE relative_trade_day < 0
        GROUP BY permno, fyear
    ),
    bhret_yr_next AS (
        SELECT
            permno, fyear, EXP(SUM(LN(1 + ret))) - 1 AS bhret_year_next
        FROM event_data_with_relative_day
        WHERE relative_trade_day > 0
        GROUP BY permno, fyear
    ),
    bhret_m1p1 AS (
        SELECT
            permno, fyear, EXP(SUM(LN(1 + ret))) - 1 AS bhret_m1_p1
        FROM event_data_with_relative_day
        WHERE relative_trade_day BETWEEN -1 AND 1
        GROUP BY permno, fyear
    ),
    bhret_0 AS (
        SELECT
            permno, fyear, ticker, ret AS bhret_0
        FROM event_data_with_relative_day
        WHERE relative_trade_day = 0
    )

    SELECT
        c.*,
        m4.ticker,
        m1.bhret_year_prev,
        m2.bhret_year_next,
        m3.bhret_m1_p1,
        m4.bhret_0
    FROM df AS c
    LEFT JOIN bhret_yr_prev AS m1
        ON c.permno = m1.permno
        AND c.fyear = m1.fyear
    LEFT JOIN bhret_yr_next AS m2
        ON c.permno = m2.permno
        AND c.fyear = m2.fyear
    LEFT JOIN bhret_m1p1 AS m3
        ON c.permno = m3.permno
        AND c.fyear = m3.fyear
    LEFT JOIN bhret_0 AS m4
        ON c.permno = m4.permno
        AND c.fyear = m4.fyear
    ORDER BY c.gvkey, c.permno, c.fyear
    ```

This query takes approximately 7 seconds to run in `python` with `duckdb` on my desktop, combining 16,000 financial records with 4 million stock returns (approximately 4x more than the data on the PostgreSQL server). The merge combines all 3 merges covered in Lab 6, with the addition of the next-year buy and hold returns. I only highlight this to underscore the difference in efficiency of well-written SQL compared to what ChatGPT may have generated.
