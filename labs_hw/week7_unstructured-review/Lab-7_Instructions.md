# Lab 7: Unstructured Data Processing

In this lab, you will work with a dataset that simulates real-world messy data. The dataset contains standard structured columns (ID, Date, Customer_ID, UPC, Number_Items, Total) but also a "Notes" column that is a dump of unstructured text containing critical information like Invoice Numbers, Account Representative Names, Follow-up Dates, and general notes.

Your goal is to parse this `Notes` column into structured data, using regular expressions (RegEx).
This lab offers instructions for three different approaches: Excel (RegEx in Office Scripts), Google Sheets (`RegExExtract` Formula), and Python (RegEx is a built in library `re`).

[TOC]

## 1. Assignment

To complete this lab, submit the following on Canvas:

1. Regular Expressions used for each column:
    * Invoice
    * Account Rep Name
    * Follow-up Date
    * General Notes
2. *Excel/CSV File*: A cleaned version of the dataset where the `Notes` column has been split into `Invoice_Number`, `Contact_Name`, `Follow_Up_Date`, and `Clean_Notes`.


### 1.1. Learning Objectives

By the end of this lab, you will be able to:

* Identify unstructured text patterns suitable for regex extraction.
* Use tools to extract usable information from unstructured text, including:
    * Excel Office Scripts (TypeScript) for, among other automation, regex-based text parsing
    * Google Sheets `REGEXEXTRACT` for quick text extraction
    * Python's `re` module for robust pattern matching and extracting


## 2. Data

The dataset `lab7_data.xlsx` is provided on Canvas

* *Structured Columns*: `id`, `date`, `customer_id`, `upc`, `number_items`, `total`.
* *Unstructured Column*: `notes`. This column typically looks like:
    ```text
    Inv #: INV2022-68987
    Rep: Gimli Gloinsson
    Follow-up By: 2022-07-07
    Notes: Inspected the Dwarven axe heads delivery. Minor chipping on three units (Lot AX-77). Initiated RMA process. Billing adjustment pending.
    ```

In the `notes` column, there are inconsistencies, typos, and missing fields (a very common scenario in real-world data):

* All fields have `[title]:` as a format, meaning you could brute-force search for those, or use regular expressions that look for the general pattern with a colon to end it.
* **Invoice #**: Can have the title `Invoice #`, `Invoice#`, `Inv #`, or `Inv#`
    * Logic: `Inv____#:` --> end of line
* **Account rep**: Can have the title `Rep`, `Representative`, `Account Rep`, `ARep`
    * Logic: `(A____)?Rep____:` --> end of line
* **Follow up date**: *Can be missing!* Can have the title `Follow-up Date`, `Follow up Date`, `Follow-up On`, `Follow-up By`, `Follow-up`
    * Logic *if found*: `Follow____:` --> end of line
* **Notes**: Can have newlines in it, meaning the notes spill onto the next line. Can have the title `Note` or `Notes`
    * Logic: `Notes?:` --> end


## 3. How-to Steps

### 3.1. Option A: Excel (Office Scripts)
Modern Excel on the web (and desktop) supports **Office Scripts**, which uses TypeScript to automate tasks. 
Alternatively, you could use Python in Excel Online, but we won't cover that here.

The basic idea is to write a script that iterates through the `notes` column, applies regex patterns to extract the relevant information, and writes it back to new columns.

1.  Open your Excel file
2.  Go to the **Automate** tab > **New Script**
3.  Write a script that iterates through the sheet, adding the 4 new columns by using regular expressions to extract the data from the `notes` column
    1.  Create 4 new headers to fill with data: `Invoice_Number`, `Contact_Name`, `Follow_Up_Date`, and `Clean_Notes`.
    2.  For each row, look at the `notes` column.
    3.  Use regex to extract data, for example: `const regex = /Invoice: (.*)/;`
    4.  Write the extracted values into new columns

This is where asking an LLM for help with Office Scripts can be very useful, as the syntax can be a bit tricky if you're not used to it.

Here's the prompt I asked Claude:

```md
I have this spreadsheet, and want to write an officescript regular expression parser.
I want to create 4 new columns (`Invoice_Number`, `Contact_Name`, `Follow_Up_Date`,
 and `Clean_Notes`), extracting the data from the `notes` field with regular 
 expressions. Please write the officescript macro to do this.
```

And he provided this sample code to get you started:

```typescript
function main(workbook: ExcelScript.Workbook) {
  const sheet = workbook.getActiveWorksheet();
  const usedRange = sheet.getUsedRange();
  const data = usedRange.getValues();
  
  const headers = data[0] as string[];
  const notesCol = headers.indexOf('notes');
  
  if (notesCol === -1) {
    console.log("'notes' column not found");
    return;
  }
  
  const newHeaders = ['Invoice_Number', 'Contact_Name', 'Follow_Up_Date', 'Clean_Notes'];
  newHeaders.forEach((header, i) => {
    sheet.getCell(0, headers.length + i).setValue(header);
  });

  // Mac wrote the commented out ones, Claude the ones that aren't. Mine are a bit more flexible.
  const invoicePattern = /(?:Invoice\s*#|Inv\s*#?):\s*([^\n]+)/i;
  // const invoicePattern = /(?:Inv\w*\s*#?):\s*([^\n]+)/i;
  const contactPattern = /(?:Representative|Account\s+Rep|ARep|Rep):\s*([^\n]+)/i;
  // const contactPattern = /(?:A[count ]*)?Rep(?:[^:]*):\s*([^\n]+)/i;
  const followUpPattern = /Follow[-\s]*up(?:\s+(?:On|Date))?:\s*([^\n]+)/i;
  // const followUpPattern = /Follow(?:[^:]*):\s*([^\n]+)/i;
  const notesPattern = /Notes?:\s*(.+)/is;

  // Dropping anything in parentheses in the contact:
  // const contactPattern = /(?:A[count ]*)?Rep(?:[^:]*):\s*([^\n(]+)/i;
  
  for (let row = 1; row < data.length; row++) {
    const notes = data[row][notesCol] as string || '';
    
    const invoiceMatch = notes.match(invoicePattern);
    const contactMatch = notes.match(contactPattern);
    const followUpMatch = notes.match(followUpPattern);
    const notesMatch = notes.match(notesPattern);
    
    sheet.getCell(row, headers.length).setValue(invoiceMatch?.[1]?.trim() || '');
    sheet.getCell(row, headers.length + 1).setValue(contactMatch?.[1]?.trim() || '');
    sheet.getCell(row, headers.length + 2).setValue(followUpMatch?.[1]?.trim() || '');
    sheet.getCell(row, headers.length + 3).setValue(notesMatch?.[1]?.trim() || '');
  }
}
```

### 3.2. Option B: Google Sheets (REGEX)
Google Sheets has powerful built-in regex functions: `REGEXMATCH`, `REGEXEXTRACT`, and `REGEXREPLACE`.

1.  Import the Excel file into Google Sheets.
2.  Create a new column `Invoice_Number`.
3.  Use `=REGEXEXTRACT($G2, "(?:Inv\w*\s*#?):\s*([^\n]+)")` to pull out the Invoice.
4.  Repeat for Contact and Date (see above office script for working regular expressions)
5.  Download the cleaned sheet as CSV for upload to Canvas: `File > Download > Comma-separated values (.csv)`


### 3.3. Option C: Python (`re`)

Python is great for customized, flexible, and powerful text processing.

1. Load the data using `pandas`.
3. Use the built in pandas `Series.str.extract` method with regular expressions to get the data:
    ```python
    import pandas as pd
    df = pd.read_excel("lab7_data.xlsx")

    df['Invoice_Number'] = df['notes'].str.extract(r"(?:Inv\w*\s*#?):\s*([^\n]+)", flags=re.I)
    # Continue with the other three columns using the same approach, just changing the regular expression pattern.
    ```
4.  Repeat for Contact and Date (see above office script for working regular expressions)
5.  Save the cleaned dataframe to Excel for upload: `df.to_excel("lab7_data_cleaned.xlsx", index=False)`


```python
import re
# If you're curious, re is the regex module. You can do things like:
pattern = re.compile(r"(?:Inv\w*\s*#?):\s*([^\n]+)", flags=re.I)
pattern.search("Inv #: INV2022-68987").group(1)  # This would return 'INV2022-68987'
pattern.sub(r"INVOICE#: \1", "Inv #: INV2022-68987")  # This would return 'INVOICE#: INV2022-68987'.
# That \1 is a backreference to the first group in the pattern, which is the actual invoice number. Super cool.
```
