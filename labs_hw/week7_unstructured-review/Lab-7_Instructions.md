# Lab 7: Unstructured Data Processing

In this lab, you will work with a dataset that simulates real-world messy data. The dataset contains standard structured columns (ID, Date, Customer_ID, UPC, Number_Items, Total) but also a "Notes" column that is a dump of unstructured text containing critical information like Invoice Numbers, Account Representative Names, Follow-up Dates, and general notes.

Your goal is to parse this `Notes` column into structured data, using regular expressions (RegEx).
This lab offers instructions for three different approaches: Excel or Google Sheets formulas (`REGEXEXTRACT`), Excel Office Scripts (TypeScript), and Python (RegEx is the built-in library `re`).

[TOC]

## 1. Assignment

To complete this lab, submit the following on Canvas:

1. *Regular Expressions*: Enter the regular expression you used for each column into the matching input field on the Canvas quiz:
    * Invoice
    * Account Rep Name
    * Follow-up Date
    * General Notes
2. *CSV File*: A cleaned version of the dataset where the `Notes` column has been split into `Invoice_Number`, `Contact_Name`, `Follow_Up_Date`, and `Clean_Notes`.

*Note*: The quiz asks for *just* the regular expression, not the Excel or Python code around it. So if you entered `=REGEXEXTRACT([@notes], "Inv\w*\s*#:\s*([^\n]+)", 2)` into an Excel cell, your Canvas answer is only the part inside the quotes, `Inv\w*\s*#:\s*([^\n]+)`, without any quotes around it. {: .note}


### 1.1. Learning Objectives

By the end of this lab, you will be able to:

* Identify unstructured text patterns suitable for regex extraction.
* Use tools to extract usable information from unstructured text, including:
    * Excel and Google Sheets `REGEXEXTRACT` formulas for quick text extraction
    * Excel Office Scripts (TypeScript) for, among other automation, regex-based text parsing
    * Python's `re` module for robust pattern matching and extracting


### 1.2. Rubric and Grading

Grading is based the percentage of rows your CSV gets right. Each of the four new columns is checked row by row against the answer key, so a pattern that works on most rows but misses an edge case loses only those rows. The edge cases to check before you submit:

* *Title variants*: every spelling of each field title listed in [Section 2](#2-data) must match.
* *Missing follow-up dates*: about a third of the rows have no follow-up date. Leave `Follow_Up_Date` blank for those rows (not `#N/A`).
* *Multi-line notes*: a few notes continue onto a second line. `Clean_Notes` should contain the whole note, not just its first line.


## 2. Data

The dataset `lab7_data.xlsx` is provided on Canvas

* *Structured Columns*: `id`, `date`, `customer_id`, `upc`, `number_items`, `total`.
* *Unstructured Column*: `notes`. This column typically looks like:
    ```text
    Inv #: INV2022-68987
    Rep: Gimli Gloinsson
    Follow-up By: 2022-07-07
    Notes: Inspected the Dwarven axe heads delivery. Minor chipping on three units (Lot AX-77). 
    Initiated RMA process. Billing adjustment pending.
    ```

In the `notes` column, there are inconsistencies and missing fields (a very common scenario in real-world data). The following patterns dictate how the data are generally formatted, and will guide your regex extraction logic:

* All fields have `[title]:` as a format, meaning you could brute-force search for those, or use regular expressions that look for the general pattern with a colon to end it.
* **Invoice #**: Can have the title `Invoice #`, `Invoice#`, `Inv #`, or `Inv#`
    * Logic: `Inv____#:` --> end of line
* **Account rep**: Can have the title `Rep`, `Representative`, `Account Rep`, `ARep`
    * Logic: `(A____)?Rep____:` --> end of line
* **Follow up date**: *Can be missing!* Can have the title `Follow-up Date`, `Follow up Date`, `Follow-up On`, `Follow-up By`, `Follow-up`
    * Logic *if found*: `Follow____:` --> end of line
* **Notes**: Can have newlines in it, meaning the notes spill onto the next line. Can have the title `Note` or `Notes`
    * Logic: `Notes?:` --> end of the cell, *including* line breaks
    * Careful: `.` and `[^\n]` both stop at a line break. To capture everything through the end of the cell, use `[\s\S]+`, which means "one or more of any whitespace or non-whitespace character," i.e., anything at all, line breaks included.


### 2.1. Practice Your Patterns

Before writing formulas or code, try your regular expressions here. The left box holds a sample `notes` cell; you can edit it, or load one of the other samples to check that your pattern handles the inconsistent titles. Type a pattern on the right and the matches (and any capture groups in parentheses) appear below it as you type.

*Note*: This tester runs JavaScript regex, which agrees with Excel, Google Sheets, and Python on everything you need for this lab. Python-style `(?i)` at the start and `(?P<name>...)` groups are accepted and translated for you. {: .note}

<div class="rx-widget">
<style>
.rx-widget { display: flex; align-items: flex-start; gap: 1.25rem; margin: 1.25rem 0 2rem; padding: 1.25rem; background: #f7f9fc; border: 1px solid #d6e0ee; border-radius: 8px; }
.rx-widget .rx-label { display: block; font-weight: 600; color: #2c5282; margin-bottom: 0.4rem; }
.rx-widget .rx-samples { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem; }
.rx-widget button { font: inherit; font-size: 0.85rem; padding: 0.2rem 0.65rem; border: 1px solid #0066cc; border-radius: 4px; background: white; color: #0066cc; cursor: pointer; }
.rx-widget button:hover { background: #e8f1fb; }
.rx-widget button.rx-active { background: #0066cc; color: white; }
.rx-widget textarea, .rx-widget input[type=text] { box-sizing: border-box; width: 100%; font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 0.9rem; border: 1px solid #b8c4d4; border-radius: 4px; background: white; padding: 0.5rem 0.6rem; }
.rx-widget textarea { min-height: 13rem; resize: vertical; line-height: 1.45; }
.rx-widget textarea:focus, .rx-widget input[type=text]:focus { outline: 2px solid #0066cc; outline-offset: -1px; }
.rx-widget input.rx-bad { border-color: #BE0000; outline-color: #BE0000; }
.rx-widget .rx-flags { display: flex; flex-wrap: wrap; gap: 1rem; margin: 0.5rem 0 1rem; font-size: 0.85rem; color: #444; }
.rx-widget .rx-flags label { cursor: pointer; }
.rx-widget .rx-flags code { font-size: 0.8rem; }
.rx-widget .rx-out { background: white; border: 1px solid #b8c4d4; border-radius: 4px; padding: 0.6rem 0.75rem; min-height: 6rem; font-size: 0.9rem; }
.rx-widget .rx-placeholder { color: #999; font-style: italic; }
.rx-widget .rx-error { color: #BE0000; font-weight: 600; }
.rx-widget .rx-summary { font-weight: 600; margin-bottom: 0.5rem; }
.rx-widget .rx-hl { white-space: pre-wrap; word-break: break-word; font-family: Consolas, Monaco, 'Courier New', monospace; font-size: 0.85rem; background: #fafafa; border: 1px dashed #ccc; border-radius: 4px; padding: 0.5rem; margin-bottom: 0.75rem; }
.rx-widget .rx-hl mark { background: #ffe58a; border-radius: 2px; box-shadow: 0 0 0 1px #e0b400; }
.rx-widget table { width: 100%; font-size: 0.85rem; margin: 0; box-shadow: none; }
.rx-widget table > :is(thead, tbody) > tr > :is(th, td) { padding: 0.25rem 0.5rem; vertical-align: top; }
.rx-widget th { white-space: nowrap; }
.rx-widget td.rx-val { font-family: Consolas, Monaco, 'Courier New', monospace; white-space: pre-wrap; word-break: break-word; }
.rx-widget .rx-none { color: #999; font-style: italic; }
.rx-widget .rx-left { flex: 0 0 40%; min-width: 0; }
.rx-widget .rx-right { flex: 1 1 0; min-width: 0; }
@media (max-width: 900px) {
  .rx-widget { flex-direction: column; align-items: stretch; }
  .rx-widget .rx-left, .rx-widget .rx-right { flex: none; width: 100%; }
}
</style>
<div class="rx-left">
<span class="rx-label">Sample <code>notes</code> text</span>
<div class="rx-samples">
<button type="button" data-sample="0" class="rx-active">Sample 1</button>
<button type="button" data-sample="1">Sample 2</button>
<button type="button" data-sample="2">Sample 3</button>
<button type="button" data-sample="3">All three</button>
</div>
<textarea class="rx-text" spellcheck="false" aria-label="Sample notes text"></textarea>
</div>
<div class="rx-right">
<label class="rx-label" for="rx-pattern">Your regular expression</label>
<input type="text" id="rx-pattern" class="rx-pattern" spellcheck="false" autocomplete="off" placeholder="e.g. Inv\w*\s*#:\s*([^\n]+)">
<div class="rx-flags">
<label><input type="checkbox" class="rx-flag" value="i"> Ignore case <code>i</code></label>
</div>
<span class="rx-label">Results</span>
<div class="rx-out" aria-live="polite"><span class="rx-placeholder">Error</span></div>
</div>
<script>
(function () {
  var SAMPLES = [
    "Inv #: INV2022-68987\nRep: Gimli Gloinsson\nFollow-up By: 2022-07-07\nNotes: Inspected the Dwarven axe heads delivery. Minor chipping on three units (Lot AX-77). Initiated RMA process. Billing adjustment pending.",
    "Invoice#: INV2023-10442\nAccount Rep: Arwen Undomiel\nNote: Customer requested split shipment.\nSecond pallet held at Rivendell warehouse until\nreceiving dock is cleared.",
    "Inv#: INV2023-55120\nARep: Samwise Gamgee\nFollow up Date: 2023-03-14\nNotes: Price discrepancy on garden supplies; credit memo issued."
  ];
  SAMPLES.push(SAMPLES.join("\n\n"));
  var root = document.currentScript.parentNode;
  var text = root.querySelector(".rx-text");
  var pat = root.querySelector(".rx-pattern");
  var out = root.querySelector(".rx-out");
  var flags = root.querySelectorAll(".rx-flag");
  var buttons = root.querySelectorAll("button[data-sample]");
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function show(s) {
    return s === undefined ? '<span class="rx-none">(not matched)</span>' : s === "" ? '<span class="rx-none">(empty)</span>' : esc(s);
  }
  function run() {
    var src = pat.value;
    pat.classList.remove("rx-bad");
    if (!src) { out.innerHTML = '<span class="rx-placeholder">Error</span>'; return; }
    var f = "g";
    flags.forEach(function (cb) { if (cb.checked) f += cb.value; });
    // Accept Python-style syntax: leading (?i)/(?ms) flags and (?P<name>...) groups
    var lead = src.match(/^\(\?([ims]+)\)/);
    if (lead) {
      src = src.slice(lead[0].length);
      lead[1].split("").forEach(function (c) { if (f.indexOf(c) < 0) f += c; });
    }
    src = src.replace(/\(\?P</g, "(?<");
    var re;
    try { re = new RegExp(src, f); }
    catch (e) {
      pat.classList.add("rx-bad");
      out.innerHTML = '<span class="rx-error">Error: ' + esc(e.message.replace(/^Invalid regular expression: /, "")) + "</span>";
      return;
    }
    var s = text.value, matches = [], m;
    var it = s.matchAll(re);
    while (matches.length < 200 && !(m = it.next()).done) matches.push(m.value);
    if (!matches.length) {
      out.innerHTML = '<span class="rx-error">Error: no match</span> <span class="rx-none">(Excel would show #N/A)</span>';
      return;
    }
    var hl = "", pos = 0;
    matches.forEach(function (mm) {
      if (mm[0] === "") return;
      hl += esc(s.slice(pos, mm.index)) + "<mark>" + esc(mm[0]) + "</mark>";
      pos = mm.index + mm[0].length;
    });
    hl += esc(s.slice(pos));
    var ngroups = matches[0].length - 1;
    var names = {};
    if (matches[0].groups) Object.keys(matches[0].groups).forEach(function (k) {
      for (var g = 1; g <= ngroups; g++) if (matches[0][g] === matches[0].groups[k] && !names[g]) { names[g] = k; break; }
    });
    var head = "<thead><tr><th>#</th><th>Full match</th>";
    for (var g = 1; g <= ngroups; g++) head += "<th>Group " + g + (names[g] ? " (" + esc(names[g]) + ")" : "") + "</th>";
    var rows = matches.map(function (mm, i) {
      var r = "<tr><td>" + (i + 1) + '</td><td class="rx-val">' + show(mm[0]) + "</td>";
      for (var g = 1; g <= ngroups; g++) r += '<td class="rx-val">' + show(mm[g]) + "</td>";
      return r + "</tr>";
    }).join("");
    out.innerHTML = '<div class="rx-summary">' + matches.length + (matches.length === 200 ? "+" : "") +
      " match" + (matches.length === 1 ? "" : "es") + (ngroups ? ", " + ngroups + " capture group" + (ngroups === 1 ? "" : "s") : "") +
      '</div><div class="rx-hl">' + hl + "</div><table>" + head + "</tr></thead><tbody>" + rows + "</tbody></table>";
  }
  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      buttons.forEach(function (x) { x.classList.remove("rx-active"); });
      b.classList.add("rx-active");
      text.value = SAMPLES[+b.getAttribute("data-sample")];
      run();
    });
  });
  text.value = SAMPLES[0];
  text.addEventListener("input", function () { buttons.forEach(function (x) { x.classList.remove("rx-active"); }); run(); });
  pat.addEventListener("input", run);
  flags.forEach(function (cb) { cb.addEventListener("change", run); });
})();
</script>
</div>


## 3. How-to Steps

### 3.1. Excel/Google Sheets (`REGEXEXTRACT`)
Modern Excel (or Google Sheets, if you don't have the latest Excel version with built-in regex functions) has built-in regex functions: `REGEXTEST` (called `REGEXMATCH` in Google Sheets), `REGEXEXTRACT`, and `REGEXREPLACE`.

The `REGEXEXTRACT` function ([documentation](https://support.microsoft.com/en-us/excel/functions/regexextract-function)) is used to extract specific patterns from text. It takes three arguments: the text to search, the regular expression pattern, and whether to return capture groups. That last argument will probably be 2 for yours, so start with that and adjust if necessary.

1.  Open the Excel file.
2.  Add new columns that will use `REGEXEXTRACT` to extract the data from the `notes` column
    1.  Create four new headers to fill with formulas: `Invoice_Number`, `Contact_Name`, `Follow_Up_Date`, and `Clean_Notes`.
    2.  For each row, look at the `notes` column.
    3.  Use regex to extract data, for example: `=REGEXEXTRACT([@notes], "Inv\w*\s*#:\s*([^\n]+)", 2)` to pull out the Invoice.
    4.  Repeat for Contact, Date, and Clean Notes, using appropriate regular expressions for each.
3.  Save-As (or Export from Google Sheets) the cleaned sheet as CSV for upload to Canvas.

A few things that will trip you up in a spreadsheet:

* *Missing values show `#N/A`*: When the pattern finds nothing (e.g., a row with no follow-up date), `REGEXEXTRACT` returns `#N/A`. Wrap it to get a blank instead: `=IFERROR(REGEXEXTRACT(...), "")`.
* *Extra parentheses spill*: With the `2` argument, Excel returns *every* capture group, one per cell. If your pattern has two sets of parentheses, such as `(A\w*\s*)?Rep...:\s*([^\n]+)`, the result tries to spill into the next column and you get `#SPILL!`. Use `(?:...)` for parentheses you need for grouping but don't want it returned, e.g., `(?:A\w*\s*)?Rep`. The `?:` makes it a non-capturing group.
* *Case matters*: Excel's `REGEXEXTRACT` is case-sensitive by default, so `inv` won't match `Inv`. Add a fourth argument of `1` to ignore case.
* *Google Sheets is slightly different*: Its `REGEXEXTRACT` takes only two arguments (text and pattern) and returns the capture groups automatically, so leave off the `, 2`. To ignore case, start the pattern with `(?i)`.


### 3.2. Excel Office Scripts (a modern VBA replacement)
Modern Excel supports **Office Scripts**, which uses TypeScript to automate tasks. 
Office Scripts give you automation capabilities similar to VBA, but using TypeScript instead of Visual Basic, and lacking some of the legacy features and integrations that VBA has like custom functions or event-driven execution.
Alternatively, you could use VBA on Windows, or Python in Excel Online, but we won't cover that here.

The basic idea is to write a script that iterates through the `notes` column, applies regex patterns to extract the relevant information, and writes it back to new columns.

1.  Open your Excel file
2.  Go to the **Automate** tab > **New Script**
3.  Write a script that iterates through the sheet, adding the 4 new columns by using regular expressions to extract the data from the `notes` column
    1.  Create 4 new headers to fill with data: `Invoice_Number`, `Contact_Name`, `Follow_Up_Date`, and `Clean_Notes`.
    2.  For each row, look at the `notes` column.
    3.  Use regex to extract data, for example: `const regex = /Inv\w*\s*#:\s*([^\n]+)/;`
    4.  Write the extracted values into new columns

This is where asking an LLM for help with Office Scripts can be very useful, as the syntax can be a bit tricky if you're not used to it.
Here's the prompt I asked Claude (also uploading the Excel file and these Lab instructions for context):

```md
I have this spreadsheet, and want to write an officescript regular expression parser.
I want to create 4 new columns (`Invoice_Number`, `Contact_Name`, `Follow_Up_Date`,
 and `Clean_Notes`), extracting the data from the `notes` field with regular 
 expressions. Please write the officescript macro to do this.
```


### 3.3. Python (`re`)

Python is great for customized, flexible, and powerful text processing.

1. Load the data using `pandas`.
2. Use the built-in pandas `Series.str.extract` method with a regular expression to get the data. It returns the first capture group, so add `expand=False` to return just a single column:
    ```python
    import pandas as pd
    df = pd.read_excel("lab7_data.xlsx")

    df['Invoice_Number'] = df['notes'].str.extract(r"Inv\w*\s*#:\s*([^\n]+)", expand=False)
    ```
3. Repeat for Contact, Date, and Clean Notes, changing the output column name and the regular expression. Rows with no match get a missing value (`NaN`), which is written as a blank cell in the CSV.
4. Save the cleaned dataframe to csv for upload: `df.to_csv("lab7_data_cleaned.csv", index=False)`


```python
import re
# If you're curious, re is the regex module. You can do things like:
pattern = re.compile(r"Inv\w*\s*#:\s*([^\n]+)")
pattern.search("Inv #: INV2022-68987").group(1)  # This would return 'INV2022-68987'
pattern.sub(r"INVOICE#: \1", "Inv #: INV2022-68987")  # This would return 'INVOICE#: INV2022-68987'.
# That \1 is a backreference to the first group in the pattern, which is the actual invoice number. Super cool.
```
