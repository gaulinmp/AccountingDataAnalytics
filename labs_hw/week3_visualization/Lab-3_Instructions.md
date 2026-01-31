
# Lab 3: Visualizing Financial Accounting Data

Lab 3 introduces you to initial investigation of data using visualization. You will work with a dataset containing annual financial statement data for all public companies (a subset of the dataset that is being used for Project 1). Your goal is to create a series of visualizations to gain initial understanding of trends, distributions, and comparisons in key financial measures across time and companies.


[TOC]


## 1. Assignment

**Submission:** To complete this lab, provide an image for each of the four visualizations listed below (submission is a canvas Quiz, not uploading a PDF): 

* Line graph of Average Total Assets (`at`) over fiscal year (`fyear`)
* Histogram of Net Income (`ni`) for 2024
* Scatter plot of Current Assets (`act`) vs. Current Liabilities (`lct`) for 2024
* Box plot of Market Value (`mve`) for the fiscal years 2020-2024

*Note*: Consider the aesthetics of your visualizations. Clear, well-organized visuals will help convey your findings more effectively. You are welcome to do any filtering, winsorizing, or other data transformations as needed to make the graphs more informative and visually appealing. {: .note}

Here is an example image showing the four graphs, if it is a helpful reference:

![Example Graphs](lab3_example.png "Image of examples of the four graphs")


### 1.1. Learning Objectives

By the end of this lab, you will be able to:

* Import and explore large-scale financial accounting data
* Create time series, distribution, and comparison visualizations of key financial metrics
* Use Excel, Tableau, and/or Python to build effective visualizations


### 1.2. Rubric and Grading

Each visualization will be graded based on the following criteria

1. *Excellent*: Aesthetic, clean, correctly and clearly labeled, well-cropped, high quality product. (5 pts)
2. *Good*: Aesthetic with minor issues (cluttered, unlabeled, misleading, or other). (4 pts)
3. *Needs improvement*: Cluttered, confusing, misleading, low quality product. (3 pts)

*Tip*:  In this lab and in the homework (and project!), please be careful to label your axes appropriately, including units (e.g., $ millions, $ billions, etc.), and remember that the financial data in this dataset are in millions of USD. That means you will have to adjust your axis labels accordingly (e.g., if your y-axis goes up to 500,000, that is actually $500 billion). {: .tip}



## 2. Data

The dataset for this lab is `CompustatAnnual_subset-for-lab3.xlsx`, an Excel file containing annual financial statement data for all public companies from 2010 to 2024. The data are sourced from Standard & Poor's [Compustat database](https://www.marketplace.spglobal.com/en/datasets/compustat-financials-(8)), accessed via Wharton Research Data Services ([WRDS](https://wrds-www.wharton.upenn.edu/)).

The data are a smaller version of the dataset

### 2.1. Data Dictionary

The following variables are provided in `CompustatAnnual_subset-for-lab3.xlsx`. Unless otherwise specified, **financial numbers are all in millions of USD**.  

* `tic`: Ticker Symbol
* `fyear`: Fiscal Year (based on majority of year, so 2000 connotes fiscal year ends between 7/1/1999 and 6/30/2000)
* `fiscal_year_end_month`: Fiscal Year End Month (1 - January, 12 - December)
* `mve`: Market Value of Equity  (calculated as `MAX(prcc_f * csho, mkvalt)`)
* `at`: Total Assets
* `act`: Current Assets
* `lt`: Total Liabilities  
* `lct`: Current Liabilities  
* `dvt`: Dividends - Total
* `ebit`: Earnings Before Interest & Taxes
* `ebitda`: Earnings Before Interest
* `epspi`: Earnings Per Share (Basic) - Including Extraordinary Items (amount in $ / share)
* `gics_sector_name`: GICS Sector code name
* `ib`: Income Before Extraordinary Items
* `ni`: Net Income  
* `oancf`: Operating Cash Flow
* `sale`: Sales/Turnover (Net)  
* `share_price`: Price Close - Annual - Fiscal (`prcc_f`)
* `shares_outstanding`: Common Shares Outstanding (`csho`)
* `xrd`: R&D Expense  
* `bign`: Big N Auditor (calculated from `au`)
* `auditor`: Name of Auditor
* `auop`: Auditor Opinion
* `emp`: Employees (in thousands)



## 3. How-to Steps

The following sections outline how to perform the lab in Excel and Python.

* **Excel:** The first two visualizations can be done with pivot charts, the latter two require more manual data manipulation.
* **Python:** The `seaborn` library has one-line commands for each chart type. Huzzah!

### 3.1. Excel Steps

1. Line graph of Average Total Assets (`at`) over fiscal year (`fyear`)
    1. Create a pivot table (or chart), with the rows as `fyear` and the values as averaged `at`.
2. Histogram of Net Income (`ni`) for 2024
    1. Create a pivot table with the filter for `fyear` = 2024
    2. Add `ni` to rows (which will create many rows), then right click on any `ni` value and select "Group".
    3. Choose the limits, and how wide each bin (group) should be. I choose -1000 &rarr; 2000, with width 50.
    4. Add `ni` to values, and change the aggregation to "Count".
3. Scatter plot of Current Assets (`act`) vs. Current Liabilities (`lct`) for 2024
    1. Filter table of all data to just 2024 (using filters)
    2. Select `act` and `lct` columns
    3. Insert a scatter plot with `act` on the x-axis and `lct` on the y-axis.
4. Box plot of Market Value (`mve`) for the fiscal years 2020-2024
    1. This was the hardest chart for me to make in Excel. I ended up manually filtering the table to each year (2020 - 2024), and copying the `mve` column into a new sheet for each year.
    2. With the 5 columns selected, I then created a box plot using the "Insert" menu.
    3. I was not able to set the y-axis to a logarithmic scale, which made it difficult to visualize the data effectively.

### 3.2. Python Steps

The following steps assume you have opened Colab, upload the `CompustatAnnual_subset-for-lab3.xlsx` file, and imported the necessary libraries:

```python
import pandas as pd
import seaborn as sns
df = pd.read_excel("CompustatAnnual_subset-for-lab3.xlsx")
```

1. Line graph of Average Total Assets (`at`) over fiscal year (`fyear`)
   ```python
   sns.lineplot(data=df, x='fyear', y='at')
   ```
2. Histogram of Net Income (`ni`) for 2024
   ```python
   # Okay, this is unecessary red/green coloring of positive/negative values, 
   # but I want to show how easily you can make slick visualizations with python
   df.query("fyear==2024 & ni >= 0").ni.clip(upper=2000).hist(bins=range(0, 2001, 50), color='green')
   df.query("fyear==2024 & ni < 0").ni.clip(lower=-1000).hist(bins=range(-1000, 1, 50), color='red')
   ```
3. Scatter plot of Current Assets (`act`) vs. Current Liabilities (`lct`) for 2024
   ```python
   sns.scatterplot(data=df.query("fyear==2024"), x="lct", y="act")
   ```
4. Box plot of Market Value (`mve`) for the fiscal years 2020-2024
   ```python
   ax = sns.boxplot(data=df.query("fyear>=2020"), x="fyear", y="mve")
   ax.set_yscale('log')
   ```

For aesthetics, I usually format axes, and set limits on the graphs. 

??? "For example, my full python code for #3 is (expand for code):"
    ```python
    import pandas as pd
    import seaborn as sns
    from matplotlib import pyplot as plt
    from matplotlib.ticker import FuncFormatter

    # This just formats the axes nicely, allowing for the fact that the data in the 
    # dataset is in "millions", so needs to * 1_000_000 to get the units right.
    def mbt_string_fmt(
        x,
        prefix="",
        suffix="",
        scale=1e6,
        decimals=0,
        fmt="{l_paren}{prefix}{x:,.{decimals}f}{mbt}{suffix}{r_paren}",
        zero_fmt="{prefix}0",
        **kwargs
    ):
        kwargs["prefix"] = prefix
        kwargs["suffix"] = suffix
        kwargs["scale"] = scale
        kwargs["decimals"] = decimals

        if "l_paren" not in kwargs:
            kwargs["l_paren"] = "(" * bool(x <= 0)
        if "r_paren" not in kwargs:
            kwargs["r_paren"] = ")" * bool(x <= 0)
        x = abs(x) * scale

        if x == 0:
            return zero_fmt.format(**kwargs)

        for d, mbt in enumerate(["", "K", "M", "B", "T"]):
            if x < 1000:
                break
            x /= 1000.0

        return fmt.format(x=x, mbt=mbt, **kwargs)


    def mbt_ff(**kwargs):
        return FuncFormatter(lambda x, p, kwargs=kwargs: mbt_string_fmt(x, position=p, **kwargs))

    # Scatter plot of Current Assets (`act`) vs. Current Liabilities (`lct`) for 2024
    sns.set_theme(style="whitegrid", context='talk')
    ax = plt.figure(figsize=(6, 6)).gca()
    sns.scatterplot(data=df.query("fyear==2024"), x="lct", y="act", ax=ax, clip_on=False)
    ax.plot([0, 100000], [0, 100000], color='gray', linestyle='--', zorder=0)
    ax.set_ylabel("Current Assets")
    ax.set_xlabel("Current Liabilities")
    ax.set_xlim(0, 100000); ax.set_ylim(0, 100000)
    ax.xaxis.set_major_formatter(mbt_ff(prefix="$"))
    ax.yaxis.set_major_formatter(mbt_ff(prefix="$"))
    ```
