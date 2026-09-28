# Lab 4: Exploratory Data Analysis of a General Ledger

Lab 4 introduces you to exploratory data analysis of a general ledger. You will work with a full fiscal year of journal entry detail from Ride Safe Cycleworks, a (fictitious) assembler and seller of bicycles and e-bikes. The file follows the **AICPA Audit Data Standards**, so the field names are the ones an auditor would request from a client's ERP system.

Before you analyze a new extract, you profile it. Does it cover the period you asked for? Do debits equal credits? How big is a typical transaction, and how big is the biggest one? The AICPA publishes a checklist for exactly this, the *[GL Standard Data Profiling Report](https://www.aicpa-cima.com/resources/download/general-ledger-standard-audit-data-standards)*, and section 3 of this lab uses that checklist, slightly trimmed.

[TOC]


## 1. Assignment

**Submission:** Complete the Canvas quiz. It asks for the profiling numbers you compute in section 3, plus two uploaded visualizations:

1. Histogram of `Amount` (full)
2. Histogram of `Amount` (truncated)
3. Line chart of monthly Revenue and Expenses for FY2025 (2 lines on one chart)

*Note*: Consider the aesthetics of your visualizations, same standard as Lab 3: clear titles, labeled axes, sensible units. {: .note}

### 1.1. Learning Objectives

By the end of this lab, you will be able to:

* Profile an unfamiliar accounting extract before analyzing it (date coverage, record counts, and control totals)
* Recognize why a general ledger's `Amount` column is unusable in a raw histogram, and truncate it defensibly
* Use a lookup to bring account classification into transaction-level data
* Build a monthly revenue and expense trend from journal entry detail

### 1.2. Rubric and Grading

Each visualization is graded on:

1. *Excellent*: Aesthetic, clean, correctly and clearly labeled, well-cropped, high quality product. (5 pts)
2. *Good*: Aesthetic with a minor issue (cluttered, unlabeled, misleading, or other). (4 pts)
3. *Needs improvement*: Cluttered, confusing, misleading, low quality product with multiple issues. (3 pts)


## 2. Data

The dataset is `RideSafeCycleworks_GL_FY2025.xlsx`, containing fiscal year 2025 for Ride Safe Cycleworks. It has six worksheets; you will use three of them.

| Sheet | What it is | Rows |
|---|---|---|
| `GL_Detail` | One row per journal entry **line** | 106,182 |
| `Chart_Of_Accounts` | One row per account | 89 |
| `Trial_Balance` | Ending balances by account × business unit × period | 2,756 |
| `Source_Listing` | What each journal source code means | 11 |
| `Business_Unit_Listing` | The six business units | 8 |
| `User_Listing` | Everyone who can post an entry | 61 |

*A note on signs*: this ledger stores every `Amount` as a positive number and puts the direction in a separate column. That is normal for ERP extracts, and it is a deliberate contrast with Lab 2, where credits were negative. Check the sign convention before you sum anything. {: .note}

### 2.1. Data Dictionary: `GL_Detail`

The raw sheet has 31 columns. After the cleaning step in section 3 you will keep these:

* `Journal_ID`: Unique identifier for the journal entry. Formatted `{Year}-{Period}-{Source}-{Number}`.
* `Journal_ID_Line_Number`: Line number within that entry. A journal entry has at least two lines (a debit and a credit), so `Journal_ID` + `Journal_ID_Line_Number` together identify a row.
* `JE_Header_Description`: Memo description of the entry.
* `Business_Unit_Code`: Which part of the company posted it (`RSC-WHL` wholesale, `RSC-RTL01` a retail store, etc.).
* `Effective_Date`: The **accounting** date, i.e., the date the transaction belongs to.
* `Fiscal_Year`: 2025 for every row in this file.
* `Period`: Fiscal month, `M01` through `M13`. (Yes, thirteen. Not a typo, see section 3.)
* `GL_Account_Number`: The account. **This is text, not a number**, since some accounts look like `60002-01`.
* `Amount`: The amount of the line, **always positive**.
* `Amount_Credit_Debit_Indicator`: `D` for debit, `C` for credit. This is where the sign lives.
* `Entered_Date`: The date the entry was **keyed**, which is not the same as `Effective_Date`.
* `Segment03`: Product line (`ROAD`, `MTB`, `GRAVEL`, `EBIKE`, `KIDS`, `PARTS`).
* *Calculated in section 3*: `AmountSigned`, equal to `Amount` for debits and negative `Amount` for credits.

### 2.2. Data Dictionary: `Chart_Of_Accounts`

* `GL_Account_Number`: Matches `GL_Detail.GL_Account_Number`.
* `GL_Account_Name`: e.g., "Service & Repair Revenue".
* `Account_Type`: One of `Assets`, `Liabilities`, `Equity`, `Revenue`, `Expenses`.
* `Account_Subtype`, `FS_Caption`: Finer classifications, not needed this week.

### 2.3. Data Dictionary: `Trial_Balance`

* `GL_Account_Number`, `Business_Unit_Code`, `Fiscal_Year`, `Period`: Together, these identify a row.
* `Amount_Beginning`, `Amount_Ending`: **Signed** balances (debit positive).



## 3. General Steps

The steps below are general steps for both the homework and lab exercises. The Python specific content is covered in [Section 4: Python Steps](#4-python-steps).

### 3.1. Cleaning with Power Query

We will walk through this in lab together. The short version: `GL_Detail` has 31 columns, most of which you do not need this week, and two of which will cause problems if you treat them carelessly.

The steps we do together:

1. `Data → Get Data → From File → From Excel Workbook`, select `RideSafeCycleworks_GL_FY2025.xlsx`, choose the `GL_Detail` sheet, and click **Transform Data** (not Load).
2. Remove the columns we don't need this week.
3. Set the data type on each remaining column, and watch what happens when we tell Power Query that `GL_Account_Number` is a whole number.
4. Add the `AmountSigned` calculated column.
5. `Close & Load` to a worksheet table.

Two things we will hit on the way:

* `GL_Account_Number` **cannot** be a whole number. 1,894 rows in this file post to travel and entertainment sub-accounts like `60002-01`, and converting to whole number turns every one of them into an `Error`. Account "numbers" are labels, like a ZIP code or an employee ID. *If you will never do arithmetic on it, store it as text.*
* `Approved_By` contains `#N/A` in 52 rows. Excel treats `#N/A` as an *error value* rather than as text, so it does not clean up quietly. Most entries are below the approval threshold and were never approved at all, so we just drop the column this week. (Counting "missing" correctly, when missing has six different spellings, is a lesson for another time.)

Alternatively, you can skip the clicking entirely. Once you have the GL sheet opened in your Power Query Editor, you can just paste in the following m-code into the advanced editor `View → Advanced Editor` (*keep your first two lines that have the file path to wherever you saved the file*):

```
let
    Source = Excel.Workbook(File.Contents("C:\Users\[YOUR USERNAME]\Downloads\RideSafeCycleworks_GL_FY2025.xlsx"), null, true),
    GL_Detail_Sheet = Source{[Item="GL_Detail",Kind="Sheet"]}[Data],
    #"Promoted Headers" = Table.PromoteHeaders(GL_Detail_Sheet, [PromoteAllScalars=true]),
    #"Changed Type" = Table.TransformColumnTypes(#"Promoted Headers",{{"Journal_ID_Line_Number", Int64.Type}, {"Effective_Date", type date}, {"Fiscal_Year", Int64.Type}, {"Amount", type number}, {"Entered_Date", type date}, {"Entered_Time", type time}}),
    #"Removed Columns" = Table.RemoveColumns(#"Changed Type",{"JE_Line_Description", "Source", "Segment01", "Segment02", "Reversal_Indicator", "Reversal_Journal_ID", "Last_Modified_By", "Last_Modified_Date", "Reporting_Amount", "Reporting_Amount_Currency", "Local_Amount", "Local_Amount_Currency", "Segment04", "Segment05", "Amount_Currency", "Entered_By", "Approved_By", "Approved_Date"}),
    #"Added Custom" = Table.AddColumn(#"Removed Columns", "AmountSigned", each if [Amount_Credit_Debit_Indicator]="D" then [Amount] else -1*[Amount]),
    #"Changed Type1" = Table.TransformColumnTypes(#"Added Custom",{{"AmountSigned", type number}})
in
    #"Changed Type1"
```

*Tip*: Notice that the removal step comes **before** the type-setting step. Order matters in Power Query, because every step runs against the output of the one above it. Dropping `Approved_By` first means we never have to deal with its `#N/A` values. {: .tip}

If you are working in Python, see [Section 4: Python Steps](#4-python-steps).

### 3.2. The Profiling Report (for Homework 4)

The following questions are asked on Homework 4, and are based on AICPA's [GL Standard Data Profiling Report](https://utah.instructure.com/courses/1262469/files/202136039?wrap=1), and every one is a `MIN`, `MAX`, `COUNT`, `SUM`, or Pivot. I've put them here because they are useful for understanding the structure and content of the GL data that we'll plot in the Lab. I've put the more complex plots in the lab so that you can ask me questions about them in person.

#### 3.2.1. Date ranges

1. Minimum and maximum `Effective_Date`.
2. Minimum and maximum `Entered_Date`.
3. Minimum and maximum `Effective_Date` and `Entered_Date` within each `Period`. Build this as a pivot table: `Period` in Rows, `Effective_Date` and `Entered_Date` each in Values twice, once set to Min and once set to Max.
    * Two things in number 3 are worth noticing:
        * There are **thirteen** periods. `M13` is not a month; it is the adjustment period where the year-end close and audit entries are posted. Any chart that groups by `Period` and calls it "monthly" will have thirteen bars, and any "average month" computed as total ÷ 13 is wrong.
        * Look at the max for `M12` and `M13`. The effective dates are in December; the entered dates are not. The gap between when a transaction happened and when someone recorded it is worth watching.

#### 3.2.2. Control totals

4. Line item count in `GL_Detail`.
5. Sum of `Amount` where `Amount_Credit_Debit_Indicator` = `D` (total debits).
6. Sum of `Amount` where `Amount_Credit_Debit_Indicator` = `C` (total credits).
7. Sum of `AmountSigned` across the whole file (this should also just be #5 - #6).

In Excel, numbers 5 and 6 are `SUMIF`, and number 7 is a plain `SUM`. Number 7 should give you a number that is either exactly zero or close enough that you can see floating-point rounding at work. If it doesn't, something is wrong with your `AmountSigned` formula. {: .tip}

#### 3.2.3. Trial balance

8. Count of distinct `GL_Account_Number` in `Trial_Balance`.
    * This is asking for *distinct* accounts, not rows. `Trial_Balance` has one row per account *per business unit per period*, so a plain row count will be off by a large factor (here, about 35). Always check the grain of a table before you count anything in it.
9.  Sum of `Amount_Ending` for `Period` = `M12`.

One important caveat. A clean set of control totals tells you the posting mechanics are sound, meaning every entry has a balanced debit and credit. It tells you nothing about whether the amounts are right, whether the dates are right, or whether something was left out of the extract entirely. {: .note}


### 3.3. Distribution of `Amount` (Lab 4)

Plot a histogram of `Amount` using all 106,182 rows and you will get one bar. Everything is crammed into the leftmost bin, and the x-axis runs out to $57.8 million because of a handful of year-end close entries. The chart is accurate; the distribution is just too skewed to read. Half of all lines are under $2,189, and the largest is over $57 million.

We will then make a readable histogram by **truncating** (dropping the rows above a cutoff), then report what truncating cost you.

1. Make the histogram with no cutoff. It shouldn't look that good, which is the contrast we want.
2. Truncate to rows where `Amount` ≤ $25,000 and plot again, using bins of $500. You can achieve this by applying a filter in your Excel Table (`Number Filters` → `Less Than...` → `25000`).
3. Answer in the quiz:
    * What percentage of **rows** did you keep? (hint: `countif` in Excel)
    * What percentage of **total dollars** did you keep? (note: unsigned Amount, not signed) (hint: `sumif` in Excel)

Pay attention to the gap between those two answers. You will keep the overwhelming majority of the rows and a much smaller share of the dollars, so the tidy histogram you just made describes the company's *typical* transaction, and says very little about where its dollars actually go. Truncation is common and perfectly legitimate, as long as you report it, which is why every chart you truncate needs "amounts above $25,000 excluded" somewhere on it.

You will use this same thinking in Project 1, where the financial statement data are even more skewed (Apple and a shell company are in the same dataset).

*Note*: **Truncating** drops the outlier rows. **Winsorizing** keeps them but resets them to the cutoff value. Truncating changes your row count and keeps values unchanged; winsorizing keeps your row cound but changes your values. For a histogram, winsorizing piles every large value into one artificially tall bar at the edge. {: .note}


### 3.4. Revenue and Expenses Over Time (Lab 4)

`GL_Detail` tells you the account number of every line but not what kind of account it is. `Chart_Of_Accounts` has that in `Account_Type`. Bringing it across is a **lookup**.


1. Load `Chart_Of_Accounts` into the workbook. You can use Power Query again, or just copy the sheet in, since it's only 89 rows.
2. In your `GL` table, add a column called `Account_Type`:

    ```
    =XLOOKUP([@GL_Account_Number], ChartOfAccounts[GL_Account_Number], ChartOfAccounts[Account_Type], "NOT FOUND")
    ```

    Adjust the table and column names to match yours. The `"NOT FOUND"` argument is the important habit: **always** give `XLOOKUP` an explicit not-found value, then filter on it to confirm the count is zero. Without it, you cannot tell a lookup that matched everything from one that quietly matched nothing.

3. Build a pivot table:
    * `Period` in Rows
    * `Account_Type` in Columns
    * `AmountSigned` in Values, set to Sum
4. Filter `Period` to exclude `M13`, and filter `Account_Type` to just `Revenue` and `Expenses`.
5. Revenue will be negative, because revenue accounts carry credit balances. Flip the sign so both lines plot positive with a helper column (e.g., `=-B4` off to the right of your pivot table. You might need to hand-enter the `B4` reference, as Excel will try and use the `GETPIVOTDATA` function if you click on it, which is harder to work with).
6. Insert a line chart. Title it, label the axes, and format the vertical axis as currency.

*Tip*: We are doing this with `XLOOKUP` rather than a merge on purpose. A lookup pulls one column across when you already have a matching key; a *join*&nbsp;is the general operation for combining whole tables, and that is week 5. Same idea, more power, and more ways to get it wrong. {: .tip}

**Some things to observe:**

Ride Safe Cycleworks sells bicycles, so revenue should rise into spring and summer and fall off in winter. It mostly does, but there is a soft patch late in the year that seasonality alone doesn't explain.

You cannot diagnose it with this file. A general ledger tells you that revenue moved, but there are no sales orders, no shipments, and no inventory here to tell you why. Make a note of what you see and we will come back to it when the subledgers show up.


## 4. Python Steps

The following steps assume you have opened Colab and uploaded `RideSafeCycleworks_GL_FY2025.xlsx`.

**Setup** (this replaces the entire Power Query section):

```python
import pandas as pd
import seaborn as sns
from matplotlib import pyplot as plt
from IPython.display import display

f = "RideSafeCycleworks_GL_FY2025.xlsx"

# GL_Account_Number must be read as text, or 60002-01 breaks the file
gl = pd.read_excel(f, "GL_Detail", dtype={"GL_Account_Number": str})
coa = pd.read_excel(f, "Chart_Of_Accounts", dtype={"GL_Account_Number": str})
tb = pd.read_excel(f, "Trial_Balance", dtype={"GL_Account_Number": str})

# Same calculated column as Power Query
gl["AmountSigned"] = gl["Amount"].where(gl["Amount_Credit_Debit_Indicator"] == "D", -gl["Amount"])
gl.info(verbose=True)
```

**Profiling report** (section 3.2):

Date ranges:
```python
gl[["Effective_Date", "Entered_Date"]].agg(["min", "max"])
```

Effective and entered dates by period:
```python
gl.groupby("Period")[["Effective_Date", "Entered_Date"]].agg(["min", "max"])
```

Control totals:
```python
print("Number of lines:", len(gl))

print("Total Amount by Credit/Debit Indicator:")
display(gl.groupby("Amount_Credit_Debit_Indicator")["Amount"].sum())

print("Total Amount Signed:", gl["AmountSigned"].sum())

print("Trial balance, # unique: ", tb["GL_Account_Number"].nunique())
print("Total Amount Ending for M12:", tb.loc[tb["Period"] == "M12", "Amount_Ending"].sum())
```

In python, it's often nice to format numbers for readability, especially when dealing with large amounts of money. You can use f-strings to achieve this. For example:

```python
print(f"Total Amount Signed: {gl['AmountSigned'].sum():,.2f}")
print(f"Trial balance, # unique: {tb['GL_Account_Number'].nunique():,}")
print(f"Total Amount Ending for M12: {tb.loc[tb['Period'] == 'M12', 'Amount_Ending'].sum():,.2f}")
```

**Histogram** (section 3.3):

```python
# The unreadable version
sns.histplot(data=gl, x="Amount")

# Truncated: keep rows at or below $25,000, bins of $500
cut = gl[gl["Amount"] <= 25_000]
ax = sns.histplot(data=cut, x="Amount", bins=range(0, 25_001, 500))
ax.set_title("Distribution of GL line amounts (amounts above $25,000 excluded)")
ax.set_xlabel("Amount ($)")

# What truncation cost you
print(f"Rows kept:    {len(cut) / len(gl):.1%}")
print(f"Dollars kept: {cut['Amount'].sum() / gl['Amount'].sum():.1%}")

```

**Revenue and expenses** (section 3.4):

```python
# .map() is the pandas equivalent of XLOOKUP: one column across on a matching key
account_types = coa.set_index("GL_Account_Number")["Account_Type"]
gl["Account_Type"] = gl["GL_Account_Number"].map(account_types)

# Always confirm the lookup found everything
print("Unmatched accounts:", gl["Account_Type"].isna().sum())

monthly = (
    gl[(gl["Period"] != "M13") & gl["Account_Type"].isin(["Revenue", "Expenses"])]
    .pivot_table(index="Period", columns="Account_Type", values="AmountSigned", aggfunc="sum")
)
monthly["Revenue"] = -monthly["Revenue"]   # revenue is a credit balance, so flip it to plot positive

ax = monthly.plot(figsize=(10, 5))
ax.set_title("Ride Safe Cycleworks: monthly revenue and expenses, FY2025")
ax.set_ylabel("Amount ($ millions)")
ax.set_xlabel("Fiscal period, 2025")
ax.set_xticks(range(len(monthly.index)), ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"])
ax.set_ylim(0, None)
ax.yaxis.set_major_formatter(lambda x, _: f"${x/1e6:.0f}M")

```

*Tip*: `.map()` on a Series is the direct analogue of `XLOOKUP`, and `.isna().sum()` afterward is the analogue of filtering for `"NOT FOUND"`. Check it every time. {: .tip}

## 5. ADS General Ledger Analysis

Link to [ADS General Ledger Analysis](https://utah.instructure.com/courses/1262469/files/202136039?wrap=1)

<table>
  <thead>
    <tr>
      <th>Test</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td colspan="2" style="text-align:center;"><strong>Date and Control Totals</strong></td>
    </tr>
    <tr>
      <td>Date ranges</td>
      <td>Minimum and maximum dates for Entry_Date (<code>GL_Detail</code>).<br>Minimum and maximum dates for Effective_Date (<code>GL_Detail</code>).<br>Minimum and maximum dates for Effective_Date with each period for the data provided (<code>GL_Detail</code>).</td>
    </tr>
    <tr>
      <td>Control totals</td>
      <td>Line item count, sum of total debits, sum of total credits, and total sum of amount (<code>GL_Detail</code>).<br>GL account count and total sum of balance amount (<code>Trial_Balance</code>).</td>
    </tr>
    <tr>
      <td colspan="2" style="text-align:center;"><strong>JE and TB review</strong></td>
    </tr>
    <tr>
      <td>Missing data</td>
      <td>Number of missing or blank values listed by field.</td>
    </tr>
    <tr>
      <td>Invalid data</td>
      <td>Count of records by field that do not comply with field format requirements (for example, date or time fields not compliant with date or time format, numeric fields not including two decimal places, and so on).</td>
    </tr>
    <tr>
      <td>Nonbalancing entries</td>
      <td>Count and percentage of journal entries that do not balance to $0.</td>
    </tr>
    <tr>
      <td>Nonbalancing sources</td>
      <td>From <code>GL_Detail</code>, the count of records and total of amount by source.</td>
    </tr>
    <tr>
      <td>Accounts missing from TB</td>
      <td>Count and total of amount by GL_Account_Number for GL accounts that are found in the <code>GL_Detail</code> but not in the <code>Trial_Balance</code>.</td>
    </tr>
    <tr>
      <td colspan="2" style="text-align:center;"><strong>Completeness and Financial Statement Roll-Forward</strong></td>
    </tr>
    <tr>
      <td>Account roll-forward</td>
      <td>Roll forward all accounts from the beginning of the fiscal year to the end of the period. That is, for each <code>GL_Account_Number</code>, the <code>Amount_Beginning</code> (from <code>Trial_Balance</code>), total of <code>Amount</code> (from <code>GL_Detail</code>), <code>Amount_Ending</code> (from <code>Trial_Balance</code>), and the difference between the <code>Amount_Ending</code> and sum of <code>Amount_Begining</code> and total amount).</td>
    </tr>
  </tbody>
</table>
