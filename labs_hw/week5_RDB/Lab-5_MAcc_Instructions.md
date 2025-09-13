# Lab 5: Merging & Relational Databases

Lab 5 introduces you to connecting to SQL databases and working with stock data from CRSP (featuring in Project 2).
The dataset is daily stock returns and volume data for S&P 500 companies from 2015-2025.
You will connect to the database, download returns data, aggregate to monthly frequency, and analyze return patterns and trading volumes.

This lab builds familiarity with database connections, and all the wonderful, sometimes painful, fun that entails.

[TOC]

## 1. Assignment

**Submission:** To complete this lab, complete the Canvas quiz, including uploading visualizations in image form ([win10/11](https://support.microsoft.com/en-us/windows/use-snipping-tool-to-capture-screenshots-00246869-1843-655f-f220-97299b865f6b#id0edd=windows_10), [macOS](https://support.apple.com/en-in/guide/mac-help/mh26782/mac)):

1. Line chart of daily returns for the 3 tickers over at least 5 years (starting January 2020 or earlier)
2. Line chart of daily trading volume for the same tickers
3. Line chart of monthly returns for the same 3 tickers over the same time period
4. Line chart of the monthly trading volume for the same tickers

*Note*: Consider the aesthetics of your visualizations. Clear, well-organized visuals will help convey your data more effectively.


### 1.1. Learning Objectives

By the end of this lab, you will be able to:

* Connect to PostgreSQL databases using Python, Excel, or Tableau
* Query and download time-series data from relational databases
* Aggregate daily data to monthly frequency for analysis
* Create visualizations to analyze time-series data at different frequencies, and observe the smoothing effect of aggregation


## 2. Data

The dataset for this lab is in a PostgreSQL database containing daily stock return data (`crsp_daily` table) for S&P 500 companies.

### 2.1. Database Connection Details

* Listed in Canvas Quiz
* *Table*: `crsp_daily`, Daily stock return data for S&P 500 firms

### 2.2. Data Dictionary

* `ticker`: Stock ticker symbol (e.g., `AAPL`, `MSFT`, `GOOGL`)
* `date`: Trading date (skips weekends and holidays)
* `ret`: Daily stock return (decimal, e.g., 0.05 = 5%)
* `prc`: Stock price per share
* `shrout`: Shares outstanding (in thousands)
* `vol`: Trading volume (number of shares traded)


## 3. How-to Steps

The general outline for Lab 5 will be:

1. Connect to the PostgreSQL database
2. Explore the CRSP data structure, identifying what stock related variables are available
3. Download daily returns data for the tickers `AAPL`, `MSFT`, and `GOOGL`
4. Aggregate daily returns to monthly frequency
5. Create visualizations of daily returns, monthly returns, and trading volume
    1. Line chart of daily returns for the 3 tickers over at least 5 years (starting January 2020 or earlier)
    2. Line chart of daily trading volume for the same tickers
    3. Line chart of monthly returns for the same 3 tickers over the same time period
    4. Line chart of the monthly trading volume for the same tickers


My notes on the difficulty of each modality:

* **Excel:** Can connect via Power Query, limited aggregation capabilities
* **Tableau:** Good for visualization, built-in database connectivity
* **Python:** With starter notebook, connection details should be straightforward, good for learning/practicing SQL


### 3.1. Excel Steps

1. **Connect to PostgreSQL database**: [Microsoft Guide](https://learn.microsoft.com/en-us/power-query/connectors/postgresql)
    1. Open Excel
    2. Go to Data > Get Data > From Database > From PostgreSQL Database
        1. If you do not see PostgreSQL, you may need to install the [Npgsql](https://github.com/npgsql/npgsql/releases/download/v4.0.17/Npgsql-4.0.17.msi) driver, and restart Excel
    3. Enter the server details:
        - Host in Canvas Quiz (you may need to add `https://` to the front of the provided host name, e.g. `https://dbserver.example.com`)
        - Database: `ADA_SQL`
    4. Expand "Advanced Options" and paste the following SQL into the "SQL statement" text area to get data for selected companies:
        ```sql
        SELECT *
        FROM crsp_daily 
        WHERE ticker IN ('AAPL', 'MSFT', 'GOOGL')
            AND date >= '2020-01-01'
        ```
    5. Choose "Database" authentication and enter Username and Password, listed in Canvas Quiz
    6. Click "Load" to import data into Excel, or "Transform Data" to open Power Query Editor for further cleaning

2. Make Daily Charts
    1. Select a cell in the imported data table, go to "Insert" > "PivotTable"
    2. In the pivot table, set rows of Date, columns of Ticker, and values of Ret (or Vol) to create a table for charting
    3. Select the pivot table, go to "Insert" > "Line Chart" to create a line chart of daily returns (or volume)

3. Make Monthly Charts
    1. Create a new column for Month-Year from the Date column
    2. Create a new column (I called mine `ret_plus1`) with the formula `=1 + [@Ret]` to prepare for monthly return calculation
    3. Insert a pivot table as in step 2, but this time check the "Add this data to the Data Model" box:
        1. Create a measure for monthly returns using the formula: `=PRODUCT([ret_plus1]) - 1`
        2. Use Month-Year for rows, Ticker for columns, and your new measure for values
    4. Repeat same steps as above, with monthly values

### 3.2. Tableau Steps

[Tableau Cloud Link](https://10ay.online.tableau.com/#/site/accounting-data-analytics/home)

*Note*: I found that looking at the daily returns and volume was very noisy, but if you drag `Ticker` to the Rows as well as the color shelf, it separates the line graphs into their own rows, which makes it easier to see patterns. This is especially true for volume.

1. **Connect to PostgreSQL**
    1. Open new Workbook, in Connect pane click "Connectors"
    2. Select "PostgreSQL" from the list of connectors
    3. Enter connection details, listed in Canvas Quiz

2. **Set up data source**
    1. Drag `crsp_daily` table to the canvas
    2. **EITHER**, use custom SQL to filter for selected companies:
        ```sql
        SELECT *
        FROM crsp_daily 
        WHERE ticker IN ('AAPL', 'MSFT', 'GOOGL')
        ```
    3. **OR** import everything and filter in Tableau
    4. Select "Extract" in the top right, 
    5. Go to worksheet

3. **Create Chart 1: Daily returns**
    1. Create new worksheet
    2. If you did not filter in SQL, create filter for `Ticker` to keep just your selected companies (and `Date` if you want to limit time periods)
    3. Create line chart of `Ret` and `Date` (set to "Exact Date"), using `Ticker` for color

4. **Create Chart 2: Daily volume**
   1. Duplicate the Daily Returns worksheet
   2. Replace `Ret` with `Vol` on the Rows shelf

5. **Create Chart 2: Monthly returns**
    1. Create new worksheet (or duplicate Daily Returns)
    2. If you did not filter in SQL, create filter for `Ticker` to keep just your selected companies (and `Date` if you want to limit time periods)
    3. Create calculated field for monthly returns, using the formula `(EXP(SUM(LN(1 + [Ret]))) - 1)` (why this formula?)
    4. Create line chart of your new calculated field and `Date` (set to "Month Year", the second Month option), using `Ticker` for color

6. **Create Chart 4: Monthly volume**
    1. Duplicate the Monthly Returns worksheet
    2. Replace the monthly returns field with `Vol` on the Rows shelf, and set aggregation to SUM


### 3.3. Python Steps

I have provided a starter Jupyter notebook, `Lab 5 - Merging & Relational Databases.ipynb`, that includes code to connect to the PostgreSQL database and run SQL queries.
You will need to fill in the variables for the graphs, hopefully by now that's familiar territory.

<a href="https://colab.research.google.com/github/gaulinmp/AccountingDataAnalytics/blob/main/labs_hw/week5_RDB/Lab%205%20-%20Merging%20%26%20Relational%20Databases.ipynb" target="_parent">
<img src="https://colab.research.google.com/assets/colab-badge.svg" alt="Open In Colab"/>
</a>
