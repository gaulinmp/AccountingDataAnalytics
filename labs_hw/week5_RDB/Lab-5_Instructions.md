# Lab 5: Rolling the General Ledger Forward to the Trial Balance

Lab 5 picks up where Lab 4 left off, with the Ride Safe Cycleworks general ledger. In Lab 4 you profiled `GL_Detail` on its own. This week you connect it to the `Trial_Balance` and run the last test on the AICPA profiling checklist from Lab 4, the account roll-forward. For every account, the beginning balance plus everything posted to it during the period must equal the ending balance:

```
Amount_Beginning  +  sum of GL activity  =  Amount_Ending
```

The equation is simple, but the two tables are built differently. The trial balance has one row per account, business unit, and month, while the general ledger has one row per journal entry line, so you can't just line them up side by side. You have to summarize one table until it matches the other, then *join* them. Joins are what this week is about, and you will see how they work and how they go wrong.

[TOC]


## 1. Assignment

The canvas quiz asks for some results you find in section 3, plus two uploaded screenshots:

1. The resultant merged table of `GL_Detail` and `Trial_Balance` from section 3.3/4.1
2. The roll-forward pivot table from section 3.5 (`GL_Account_Number` in rows, `Period` in columns, sum of `Diff` in values)


### 1.1. Learning Objectives

By the end of this lab, you will be able to:

* Identify the *grain* of a table (what one row represents) and its *key* (the column or columns that identify a row)
* Aggregate transaction detail up to the grain of a balance table
* Join two tables on a multi-column key
* Explain where nulls come from in a join and handle them deliberately
* Perform the account roll-forward test from the AICPA GL profiling checklist

### 1.2. Rubric and Grading

* Quiz numbers are graded for correctness. Each one has a single right answer, and section 3 tells you how to check it before you submit.
* Screenshots are graded on whether they show what was asked: all three key columns visibly selected in the merge dialog, and the full account-by-period grid in the pivot table.


## 2. Data

### 2.1. Start From Your Lab 4 Workbook

Open the Excel workbook (or Colab notebook) you built in Lab 4 and save a copy for this lab (e.g., `Lab5_Rollforward.xlsx`). Everything this week builds on that work.

You also need the original `RideSafeCycleworks_GL_FY2025.xlsx` file, because you will pull its `Trial_Balance` sheet into a new query.

**Important:** Your cleaned GL needs these four columns:

* `GL_Account_Number` (as **type text**, or with `dtype={"GL_Account_Number": str}` in python)
* `Business_Unit_Code`
* `Period`
* `AmountSigned`

*Note*: If you were enthusiastic with the Remove Columns button in Lab 4 and dropped `Business_Unit_Code` (or `Period`), bring it back: open the Power Query Editor (`Data → Get Data → Launch Power Query Editor`), click the `Removed Columns` step under **Applied Steps**, and delete `"Business_Unit_Code"` from the list in the formula bar. You cannot merge on a column you threw away, and merging on only account and period quietly produces 1,851 false differences (section 3.3 explains why). {: .note}

### 2.2. Two Tables, Two Grains

The **grain** of a table is what one row represents. The **key** is the column (or set of columns) that uniquely identifies a row. When a key takes more than one column, it is called a **composite key**. You have already met one: in Lab 4, `Journal_ID` alone does not identify a GL row, but `Journal_ID` + `Journal_ID_Line_Number` does.

| Table | One row is... | Key | Rows |
|---|---|---|---|
| `GL_Detail` | one journal entry *line* | `Journal_ID` + `Journal_ID_Line_Number` | 106,182 |
| `Trial_Balance` | one *account* in one *business unit* for one *period* | `GL_Account_Number` + `Business_Unit_Code` + `Period` | 2,756 |

To roll forward, every `Trial_Balance` row needs exactly one number from the GL: the sum of `AmountSigned` for all lines with the same account, business unit, and period. So the plan is:

1. Aggregate the GL up to the trial balance grain (106,182 lines → one row per account × business unit × period).
2. Join the aggregated GL onto the trial balance using all three key columns.
3. Check that `Amount_Beginning + Activity = Amount_Ending` on every row.

*Note*: `Amount_Beginning` and `Amount_Ending` in the trial balance are **signed** (debits positive, credits negative), which matches the `AmountSigned` column you built in Lab 4. If you roll forward with the unsigned `Amount` column, nothing ties. {: .note}


## 3. Excel Steps (Power Query)

All of section 3 happens in the Power Query Editor (`Data → Get Data → Launch Power Query Editor`). You will build four new queries:

| Query | What it is |
|---|---|
| `TB` | The trial balance, trimmed to the columns we need |
| `GL_Activity` | The GL, summed to the trial balance grain |
| `Rollforward` | `TB` joined to `GL_Activity`, with the difference calculated |
| `GL_Not_In_TB` | GL activity that has no trial balance row (section 3.6) |

### 3.1. Load the Trial Balance

1. In the Power Query Editor: `Home → New Source → File → Excel Workbook`, select `RideSafeCycleworks_GL_FY2025.xlsx`, pick the `Trial_Balance` sheet, and click OK.
2. Select these five columns (Ctrl/Cmd-click the headers): `GL_Account_Number`, `Business_Unit_Code`, `Period`, `Amount_Beginning`, `Amount_Ending`. Then `Home → Remove Columns → Remove Other Columns`.
3. Set `GL_Account_Number` to **Text** (click the `ABC/123` icon in the column header). If Power Query asks, choose `Replace current` step. This is the same issue we saw in Lab 4: Power Query sees `10100` in the first 200 rows and guesses "whole number," which turns `60002-01` into an `Error`.
4. Rename the query `TB` (double-click its name in the Queries pane on the left).

### 3.2. Aggregate the GL to the Trial Balance Grain

1. In the Queries pane, right-click your Lab 4 GL query (probably named `GL` or `GL_Detail`) and choose `Reference`. This creates a new query that starts from the output of the GL query. The original query is not changed.
2. Rename the new query `GL_Activity`.
3. `Home → Group By`, then select `Advanced`:
    * Group by `GL_Account_Number`, then `Add grouping` for `Business_Unit_Code`, then `Add grouping` for `Period`
    * New column name `Activity`, Operation `Sum`, Column `AmountSigned`
    * Add aggregation → New column name `Line_Count`, Operation `Count Rows`
    * Click OK

Each row now summarizes every GL line for one account, in one business unit, in one period. `Line_Count` tells you how many lines went into it.


### 3.3. Merge the Trial Balance With the GL Activity

A join (Power Query calls it a Merge) combines two tables by matching rows on their key columns. It is basically an `XLOOKUP` generalized; instead of pulling one column across on a single key, it brings whole rows across on as many key columns as you need.

1. Select the `TB` query, then `Home → Merge Queries → Merge Queries as New`.
2. The top table is `TB`. In the dropdown for the bottom table, choose `GL_Activity`.
3. In the top `TB` table, click `GL_Account_Number` column, then Ctrl/cmd-click `Business_Unit_Code`, then Ctrl/cmd-click `Period`. Small numbers 1, 2, 3 appear in the headers.
4. In the bottom table, click the same three columns in the same order. The numbers must line up: 1 with 1, 2 with 2, 3 with 3. Use Ctrl/cmd as needed for multiple selections.
5. Set Join Kind to Left Outer (all from first, matching from second).
6. Read the message at the bottom of the dialog. It should say the selection matches 1,995 of 2,756 rows from the first table.
7. Click OK and rename the new query `Rollforward`.
8. The new `GL_Activity` column holds a nested table in every row. Click the double-arrow icon in its header, check only `Activity` and `Line_Count`, uncheck "Use original column name as prefix", and click OK.

Why join on all three columns? The trial balance has a separate row for account `10100` at each business unit in each period. Merge on account and period alone and every business unit's row gets the **whole company's** activity for that account, so almost every row stops tying (1,851 of them). The join runs without an error, but the answer is wrong. In general, the key you join on has to match the grain of the table you're joining to.

*Tip*: Before you click OK on any merge, try and predict the row count. A *left outer* join keeps every row of the first table exactly once, as long as the second table has at most one match per key. Here, the result should have 2,756 rows, the same as `TB`. If a join ever gives you *more* rows than the first table had, the second table had duplicate keys and your rows were copied. That is the most common way joins go wrong, and it inflates any sum you take afterward. Checking both the number of rows and the number of missings is a good way to sanity-check your merge. {: .tip}

### 3.4. Handle the Nulls

While most rows in the TB matched, there are some trial balance rows with no GL lines for that account, business unit, and period, so their `Activity` and `Line_Count` are `null`. A balance can easily go a month without anything posting to it. For example, the M13 adjustment period only contains year-end close and audit entries, so most balance sheet accounts at most business units have a balance there but no activity.

`null` is not zero. In Power Query (and in SQL), `null` means "no value," and any arithmetic with `null` gives `null`: `100 - 100 - null` is `null`, not `0`. If you calculated the difference now, those rows would show a blank difference. A blank never appears when you filter for "difference ≠ 0," so a broken row there would be invisible. Those are also exactly the rows where you should be most skeptical: if the ending balance differs from the beginning balance with no GL activity behind it, something changed the balance outside the ledger.

1. Select the `Activity` and `Line_Count` columns.
2. `Transform → Replace Values`. Value to find: `null`. Replace with: `0`.


### 3.5. The Roll-Forward Check

1. `Add Column → Custom Column`. Name it `Diff`, with the formula:

    ```
    Number.Round([Amount_Ending] - [Amount_Beginning] - [Activity], 2)
    ```

    Set its type to **Decimal Number**. The rounding matters: without it, floating-point arithmetic leaves differences like `0.000000000466` that aren't really differences (you saw this with the control totals in Lab 4).

2. `Home → Close & Load`. Each new query lands on its own worksheet. Open the `Queries & Connections` pane (`Data → Queries & Connections`) and check the row counts.
3. Take a screenshot of the `Rollforward` table table showing at least the key columns (`GL_Account_Number`, `Business_Unit_Code`, `Period`) and the calculated `Diff` column.
4. On the `Rollforward` table, filter `Diff` to exclude `0`. How many rows are left?
5. Insert a pivot table from `Rollforward`:
    * `GL_Account_Number` in Rows
    * `Period` in Columns
    * `Diff` in Values (Sum), formatted as a number with 2 decimals
6. Take a screenshot of the pivot.

You should see a wall of zeros. Every account, every period, every business unit ties: the ledger fully supports the trial balance.

*Note*: You could also do this without a join. Add a column to the `TB` table with `=SUMIFS(GL[AmountSigned], GL[GL_Account_Number], [@GL_Account_Number], GL[Business_Unit_Code], [@Business_Unit_Code], GL[Period], [@Period])` and subtract. `SUMIFS` matches and sums in one step, and for a single number it is perfectly good. The catch: rows with no match come back as `0` rather than `null`, so you can't tell "no activity" from "activity that netted to zero." {: .note}

### 3.6. What Didn't Match?

A roll-forward that ties is only half the check. The AICPA checklist also asks which records exist on one side but not the other. There are two directions to check, and your `Rollforward` table can answer only one of them.

**Balances with no activity (TB rows with no GL match).** You already have these. A left outer join keeps every `TB` row, and the ones that found no match are the ones that came back `null`, which you turned into `0` in section 3.4. Every row in `GL_Activity` has a `Line_Count` of at least 1, so `Line_Count = 0` in `Rollforward` means "no match" and nothing else. Filter `Line_Count` to `0` and count the rows.

*Note*: Filter on `Line_Count`, not `Activity`. A period where the debits and credits to an account net to zero also has `Activity = 0`, but it had GL lines. {: .note}

**Activity with no balance (GL rows with no TB match).** `Rollforward` cannot show you these. The join started from `TB`, so any `GL_Activity` row that had no trial balance row to land in was dropped entirely, and there is no row left to filter. To see them, join from the other side and keep **only** the rows that don't match. That is an *anti join*:

1. Select the `GL_Activity` query, then `Home → Merge Queries → Merge Queries as New`.
2. Top table `GL_Activity`, bottom table `TB`, the same three key columns in the same order.
3. Set Join Kind to `Left Anti (rows only in first)`. Before clicking OK, predict the row count from what you already know.
4. Click OK and rename the query `GL_Not_In_TB`.

This is the "accounts missing from TB" test from the Lab 4 checklist.

*Tip*: Every join sorts rows into three groups: rows that match, rows only in the first table, and rows only in the second. The join kind decides which groups you keep. Left Outer keeps *match + first only*, Inner keeps *match only*, Full Outer keeps *all three*, and the anti joins keep one *only* group by itself. That is why filtering a left outer join for its nulls gives you the left anti join for free, while the "only in second" group needs a join of its own. Once you know how many rows fall in each group, you can predict any join's row count. {: .tip}


## 4. Python Steps

The following steps assume you have opened Colab and uploaded `RideSafeCycleworks_GL_FY2025.xlsx`.

This assumes you have the GL and TB loaded, for example:

```python
gl = pd.read_excel(f, "GL_Detail", dtype={"GL_Account_Number": str})
tb = pd.read_excel(f, "Trial_Balance", dtype={"GL_Account_Number": str})
```

*Note:* Below I've given you most of the Python code, but there's a few things you still need to fill in, such as calculating the `Diff` column. It should be apparent from the surrounding text and comments what needs to be added, but this is me starting to push you Python rockstars to start getting used to producing some code on your own (perhaps with LLM help). {: .note}

### 4.1. Aggregate GL to Trial Balance Grain

First step is to aggregate the GL to the trial balance grain (explained in [section 3.2](#32-aggregate-the-gl-to-the-trial-balance-grain), above):

```python
keys = ["GL_Account_Number", "Business_Unit_Code", "Period"]

gl_activity = (
    gl
    .groupby(keys, as_index=False)
    .agg(Activity=("AmountSigned", "sum"), Line_Count=("AmountSigned", "size"))
)
```

Now that we have a DataFrame with the GL aggregated to the trial balance grain, we can merge this with the trial balance to verify the roll-forward:

```python
rf = tb.merge(
    gl_activity,
    on=keys,
    how="left",
    indicator=True,          # adds a _merge column: "both" or "left_only"
    validate="one_to_one",   # errors out if either side has duplicate keys
)
print(rf["_merge"].value_counts())   # right_only is always 0 in a left merge; see section 3.6
```

*Tip*: `validate="one_to_one"` is pandas checking the grain for you. If either table had duplicate keys, the merge would raise an error instead of quietly copying rows. Power Query has no equivalent, which is why you predict row counts there. {: .tip}

The unmatched rows come back as NaN (pandas' null). Make them zero, on purpose.

```python
rf[["Activity", "Line_Count"]] = rf[["Activity", "Line_Count"]].fillna(0)

rf["Diff"] = # calculate Diff as Amount_Ending - Amount_Beginning - Activity
print("# of rows that don't tie:", (rf["Diff"] != 0).sum())
```

Take a screenshot of `rf.head()` table showing at least the key columns (`GL_Account_Number`, `Business_Unit_Code`, `Period`) and the calculated `Diff` column.

Lastly, make the pivot table (`rf.pivot_table`) with `GL_Account_Number` in the rows (index), `Period` in columns, and sum `Diff` as the value (to sum `Diff`, use `values="Diff", aggfunc="sum"`). Take a screenshot of the pivot table (or first few rows).


### 4.2. What Didn't Match?

A roll-forward that ties is only half the check. The AICPA checklist also asks which records exist on one side but not the other. There are two directions to check, and your `rf` table can answer only one of them.

**Balances with no activity (TB rows with no GL match).** You already have this in the `rf` table, because when `Line_Count == 0`, that means no matching GL lines.

```python
# TB rows with no GL match: already in rf, where Line_Count is 0
# (the same rows as rf["_merge"] == "left_only")
tb_no_activity = rf[rf["Line_Count"] == 0]
```

**Activity with no balance (GL rows with no TB match).** `rf` cannot show you these. The join started from `tb`, so any `activity` row that had no trial balance row to land in was dropped entirely, and there is no row left to filter. To see them, start with `activity` as your left table, and merge in `tb`, then look for rows that don't match (`_merge == "left_only"`).

```python
gl_check = activity.merge(tb, on=keys, how="left", indicator=True)
gl_not_in_tb = gl_check[gl_check["_merge"] == "left_only"]
```

*Tip*: `how="outer"` is pandas' Full Outer join. One merge, `tb.merge(activity, on=keys, how="outer", indicator=True)`, keeps all three groups, and `_merge` labels them `both`, `left_only`, and `right_only`. So you could have answered both which TB rows had no GL activity and which GL rows had no TB balance in a single merge. {: .tip}

Lastly, to find TB accounts with no GL lines all year, you can group by just account, which ignores the Business Unit and period dimensions:

```python
# Accounts with a balance but no GL lines all year
lines = rf.groupby("GL_Account_Number")["Line_Count"].sum()
print(lines[lines == 0])
```


<!-- Things to answer in the homework:

1. How many accounts are missing from the GL (i.e., `Rollforward` rows have `Line_Count = 0`)? 
2. Which period has the most of them, and why does that make sense?
3. How many rows are in `GL_Not_In_TB`? What would it mean for the audit if this number were not zero?
4. Four accounts carry a balance all year but have no GL lines at all. Find them (hint: pivot `Rollforward` with `GL_Account_Number` in Rows and the sum of `Line_Count` in Values). Look up their names in `Chart_Of_Accounts`. Is it believable that none of them moved all year? -->
