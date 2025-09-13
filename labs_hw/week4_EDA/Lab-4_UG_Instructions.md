# Lab 4: Exploratory Data Analysis

Lab 4 introduces you to initial investigation of a dataset, continuing on the initial manipulations and visualizations that were started in Lab 3.
The dataset is the General Ledger dataset (similar to Lab 2, but now with fraud!) from KPMG's case on forensic accounting.
The GL data is for a fictitious company operating in California (4 locations), Colorado, and Hawaii.

This lab and homework are intended to get you familiar with a long general ledger dataset, and comfortable pivoting it to use for analyses.
You will first explore revenue and cogs, then combine them for a (very rough) approximation of profit.

Reminder: Labs no longer give extra credit for multiple modalities.


[TOC]


## 1. Assignment

**Submission:** To complete this lab, complete the Canvas quiz, including uploading visualizations in image form ([windows instructions](https://support.microsoft.com/en-us/windows/use-snipping-tool-to-capture-screenshots-00246869-1843-655f-f220-97299b865f6b#id0edd=windows_10), [macOS instructions](https://support.apple.com/en-in/guide/mac-help/mh26782/mac)):

1. Line chart of monthly revenue and COGS over time (2 lines on one chart)
2. Line chart of monthly revenue by account and COGS over time (4 lines on one chart)
3. Line chart of calculated profit over time


*Note*: Consider the aesthetics of your visualizations. Clear, well-organized visuals will help convey your findings more effectively. You are welcome to do any filtering, winsorizing, or other data transformations as needed to make the graphs more informative and visually appealing.



### 1.1. Learning Objectives

By the end of this lab, you will be able to:

* Import and explore large-scale general ledger accounting data
* Perform transforms required to extract accounting insight from general ledger data
* Build visualizations to aid in interpreting and understanding accounting transactions




## 2. Data

The dataset for this lab is `Lab4-GeneralLedger.xlsx`, an Excel file containing General Ledger entries for a fictitous company operating in 6 cities across 4 states.

### 2.1. Data Dictionary

* `Account Number`: Number associated with the account (used for lookup in Chart of Accounts)
* `Account Name`: Name of the account (e.g. Rent Expense, Bonds Payable, etc.)
* `Account Category`: Category of the account (e.g. COGS, SG&A, Cash, etc.)
* `Post Date`: Date the journal entry was posted to the ledger
* `Period`: Fiscal period (month) of the journal entry
* `User ID`: Identifier of the user who made the entry (either a person or "Automated" system entry)
* `Manual`: Whether the entry was made manually (Yes/No)
* `Description`: Memo line description of the journal entry
* `Transaction Number`: Unique identifier for the transaction (a transaction comprises multiple journal entries, e.g. debit and credit entries)
* `City`: City where the transaction took place
* `State`: State where the transaction took place
* `Amount`: Amount of the journal entry (positive for debits, negative for credits)


## 3. How-to Steps

The general outline for Lab 3 will be:

1. Load the data (it's cleaned, no need to repeat Lab 2)
2. Explore the data, looking for which accounts pertain to revenue and cogs
3. Filter to keep just journal entries related to those accounts
4. Pivot to get monthly revenue and cogs
5. Calculate a rough profit (revenue - cogs)
6. Visualize the results

My notes on the difficulty of each modality:

* **Excel:** Some manual copy/pasting, but otherwise normal pivots and plots.
* **Tableau:** Some custom calculations required (mostly for changing signs of debits/credits).
* **Python:** Difficulty based on your knowledge of pandas, `groupby`, and `pivot_table`.

### 3.1. Excel Steps

1. **Load and explore the data**
    1. Open `Lab4-GeneralLedger.xlsx` in Excel
    2. Examine the data structure and identify the different `Account Name`s and `Account Category`s
        * Try looking at `Transaction Number` 2468 to see how a typical sale transaction is recorded
        * Note that, because KPMG simulated this dataset, the matching between inventory and revenue timing is... odd.
    4. Use filters on the `Account Name` column to filter down to just those accounts related to:
        - Revenue (search for "Revenue" in the `Account Name` filter)
        - Cost of Goods Sold (there's just one "COGS" account)

2. **Filter transactions by relevant accounts**
    1. Create a new worksheet
    2. Copy the filtered data to keep only rows where `Account Name` contains revenue and COGS-related accounts
    3. Make the new data a table (Ctrl/Cmd + T) for easier filtering and manipulation
    4. **Alternatively:** You could also just add filters to the pivot table below, if you know that `Account Category` has the same 4 relevant accounts.

3. **Pivot the data for monthly analysis**
    1. Select any cell in your new table
    2. Insert a pivot table (Insert > PivotTable)
    3. Set up the pivot table:
        - Drag `Period` to Rows
        - Drag `Account Name` to Columns
        - Drag `Amount` to Values (ensure it's set to Sum)
    4. This will give you monthly totals for the revenue accounts and COGS. Note the signs on the values.

4. **Calculate profit**
    1. In your pivot table or in a new area, create a column for "Profit"
    2. For each period, calculate: Revenue - COGS
    3. You may need to be careful about the sign of the amounts

5. **Create visualizations for submission**
    1. Line chart of monthly revenue and COGS over time (2 lines on one chart)
    2. Line chart of monthly revenue by account and COGS over time (4 lines on one chart)
    3. Line chart of calculated profit over time
    4. *Optional:* Enhance your visualizations
        1. Add clear titles to each chart (e.g., "Monthly Revenue and COGS Trends")
        2. Format axis labels to show currency where appropriate
        3. Use consistent colors (e.g., green for revenue, red for COGS)

### 3.2. Tableau Steps

[Tableau Cloud Link](https://10ay.online.tableau.com/#/site/accounting-data-analytics/home)

1. **Load and explore the data**
    1. Open Tableau and connect to `Lab4-GeneralLedger.xlsx`
    2. Examine the data structure in the Data Source tab
    3. Create a new worksheet
    4. Drag `Account Name` to Rows and `Amount` to Text "Marks" (and change to COUNT) to see the different accounts and how many journal entries each has
    5. Note which Accounts are related to Revenue or COGS

2. **Explore the Transaction format**: Examine `Transaction Number` 2468 in the data to understand how sales transactions are recorded
    1. Create a new worksheet
    2. Drag `Transaction Number` to Filters and set to 2468
    3. Drag `Account Name`, `Amount`, and `Description` to Rows to see the details (all variable bubbles should be blue, which means they are "Discrete" "Dimensions")

3. **Filter and identify relevant accounts**
    1. Create a new worksheet
    2. Drag `Account Name` to the Filters shelf
    3. Filter to show only accounts containing "Revenue" and "COGS" (which you identified in step 1.5)
    4. I renamed this worksheet to "Filter Template" and then duplicated it for each of the 3 charts below. That way I only had to set the filter once.
        - Expert tableau users will probably laugh at me for this roundabout solution.

4. **Create Chart 1: Monthly Revenue and COGS over time (2 lines)**
    1. Duplicate the "Filter Template" worksheet (if you're using that method, otherwise create a new worksheet and manually set the filters, then wonder why you didn't just duplicate)
    2. Drag `Post Date` to Columns, and set it to Month (you can right-click the field to change the date granularity from year all the way to day)
    3. Drag `Amount` to Rows. It will default to SUM, but be negative, which you can solve in optional step 6 below.
    4. Drag `Account Name` to Color (this will create separate lines). We want to combine all the revenue accounts into one line, and the COGS account into another line. There are two ways to do this:
        1. Create a calculation in the shelf to combine all revenue accounts into one, and COGS into another:
            1. Right-click on the `Account Name` pill, and select "Edit in Shelf"
            2. Enter the following Formula: `IF CONTAINS([Account Name], "Revenue") THEN "Revenue" ELSE "COGS" END`
            3. Press "Enter" to apply
        2. Use the "Combine Members" feature:
            1. Select all the revenue accounts (you can Shift+Click to select multiple), and click "Combine"
            4. Rename the new combined member to "Revenue" (right click and "Edit Alias")
    5. *Optional*: Change the signs of the values by right-clicking the `SUM(Amount)` pill in Rows, selecting "Edit in Shelf", and setting the formula to `IF CONTAINS([Account Name], "Revenue") THEN -[Amount] ELSE [Amount] END`
    6. *Optional*: Format the chart with clear title and axis labels 

5. **Create Chart 2: Monthly Revenue by Account and COGS over time (4 lines)**
    1. Duplicate Chart 1.
    2. Remove the `Account Name` pill from Color (this is important, because it is a new calculated "Group", and if you ungroup the Revenues, that will apply to your other worksheet and Chart 1)
    3. Drag the original `Account Name` field to Color (this will create separate lines for each revenue account and COGS)
    4. *Optional*: Format the chart with clear title and axis labels, and colors

6. **Create Chart 3: Calculated Profit over time**
    1. Duplicate the "Filter Template" worksheet (if you're using that method, otherwise create a new worksheet and manually set the filters, then wonder why you didn't just duplicate)
    2. Drag `Post Date` to Columns, and set it to Month (you can right-click the field to change the date granularity from year all the way to day)
    3. Drag `Amount` to Rows. Because revenues and COGS have different signs, we can just sum them to get a rough profit, but it will be negative, so we can right click the `SUM(Amount)` pill in Rows, select "Edit in Shelf", and set the formula to `-[Amount]`.
    4. *Optional*: Format the chart with clear title and axis labels


### 3.3. Python Steps

The following steps assume you have opened Colab, uploaded the `Lab4-GeneralLedger.xlsx` file.

1. **Load and explore the data**
    * Load the libaries and data: 
        ```python
        import pandas as pd
        import seaborn as sns
        df = pd.read_excel("Lab4-GeneralLedger.xlsx")
        ```
    * Then examine the data structure and identify the different `Account Name`s:
        ```python
        # Examine the data structure
        df.head()
        df['Account Name'].value_counts()
        ```
    * Then examine transaction 2468 to see how a typical inventory sale is recorded
        ```python
        df[df['Transaction Number'] == 2468]
        ```

3. **Filter for revenue and COGS accounts**
    * Keep just the rows where `Account Name` contains revenue and COGS-related accounts:
        ```python
        # Filter for Account names that match Revenue OR COGS (the | is OR in regex)
        rev_cogs_df = df[df['Account Name'].str.contains('Revenue|COGS')]
        # Then verify it worked
        rev_cogs_df['Account Name'].value_counts()
        ```

5. **Create Chart 2: Monthly Revenue by Account and COGS over time (4 lines)**
    * We're going to do this chart first, because it's a one-liner in seaborn:
        ```python
        # Period is monthly, so we can just use seaborn's lineplot to do our aggregation
        sns.lineplot(data=rev_cogs_df, x='Period', y='Amount', hue='Account Name', estimator='sum', ci=None)
        ```
    * Well almost, now we have to fix the signs, because revenue is negative in the dataset (credits are negative, debits are positive)
        ```python
        sns.lineplot(data=rev_cogs_df.assign(
            Amount=lambda df: -df['Amount'].where(df['Account Name'].str.contains("Revenue"), -df['Amount'])),
            x='Period', y='Amount', hue='Account Name', estimator='sum', ci=None)
        ```
    * Remember to format the axes and labels for aesthetics (see the end for an elaborate example)

6. **Create Chart 2: Monthly Revenue and COGS over time (2 lines)**
    * We can do this by creating a new column that has just two values, "Revenue" and "COGS", then using that column as our "hue" in seaborn:
        ```python
        # Create a new column for Account
        rev_cogs_df['Account'] = rev_cogs_df['Account Name'].apply(
            lambda x: 'Revenue' if 'Revenue' in x else 'COGS'
        )
        # Then same plot as above
        sns.lineplot(data=rev_cogs_df.assign(
            Amount=lambda df: -df['Amount'].where(df['Account'] == "Revenue", -df['Amount'])),
            x='Period', y='Amount', hue='Account', estimator='sum', ci=None)
        ```

7. **Create Chart 3: Calculated Profit over time**
     * Calculating the profit is pretty trivial, because within each month, we can just sum all transactions because the revenue and COGS have opposite signs:
    ```python
    sns.lineplot(data=rev_cogs_df.assign(Amount=lambda df: -df['Amount']), x='Period', y='Amount', estimator='sum', ci=None)
    ```

For aesthetics, I usually format axes, and set limits on the graphs.

??? "For example, formatting a line graph would be:"
    ```python
    import pandas as pd
    import seaborn as sns
    from matplotlib import pyplot as plt

    # This just formats the axes nicely, allowing for the fact that the data in the
    # dataset is in "millions", so needs to * 1_000_000 to get the units right.

    def mbt_ff(**kwargs):
        from matplotlib.ticker import FuncFormatter
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

        return FuncFormatter(lambda x, p, kwargs=kwargs: mbt_string_fmt(x, position=p, **kwargs))

    # Once the above code is run, you can just run the following to make a nice graph
    # of current assets vs. current liabilities
    sns.set_theme(style="whitegrid", context='talk')
    ax = plt.figure(figsize=(6, 6)).gca()
    # The actual plot itself
    sns.scatterplot(data=df, x="fyear", y="at", ax=ax)
    ax.set_ylabel("Average Assets")
    ax.set_xlabel("Fiscal Year")
    # limit the axes
    ax.set_xlim(0, 100000); ax.set_ylim(0, 100000)
    # format the axes labels (uses that function defined above)
    ax.xaxis.set_major_formatter(mbt_ff(prefix="$"))
    ax.yaxis.set_major_formatter(mbt_ff(prefix="$"))
    ```
