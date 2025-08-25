# Homework 2: Initial Analysis of Journal Entry Data

<!-- Make a Homework 2 markdown file in the "labs_hw\week2_connecting-to-data", similar to the formatting of Lab-2_Instructions.md. The Homework 2 should start where Lab 2 left off, with the cleaned dataset, and discuss the initial analysis of the Journal Entry dataset. The first questions should be inferred from "labs_hw\week2_connecting-to-data\Homework 2 - Opening and Cleaning Data.ipynb". The homework markdown file should not have nearly as many steps listed, but should have a section describing Pivot Tables with sub-sections detailing Excel, Tableau, and Python. -->

Building on Lab 2, this homework focuses on performing initial analysis of the cleaned Journal Entry dataset. You will explore the data to understand transaction patterns, user behavior, and the structure of journal entries within the organization's accounting system.

[TOC]

## Assignment Notes

### Learning Objectives

By the end of this homework, you will be able to:

* Perform initial data exploration and analysis on cleaned financial data.
* Calculate basic descriptive statistics for transaction amounts and patterns.
* Analyze user behavior and transaction characteristics.
* Create and interpret pivot tables in multiple modalities (Excel, Tableau, Python).
* Identify patterns in journal entry data that might indicate business processes or controls.

### Submission Expectations

* Submit a PDF document with screenshots and answers to the analysis questions, demonstrating your analysis of the Journal Entry dataset.

### Rubric and Grading

1. **Submitted**: *Submitted the assignment*
    * **3 - Successful:** Submitted a completed solution. (80 pts)
    * **2 - Successful - late:** Submitted a completed solution after the deadline. (70 pts)
    * **1 - Incomplete:** Submitted a partial result. (50 pts)
    * **0 - No Evidence:** No submission. (0 pts)
2. **Mastery**: *Submitted the assignment in more than one modality. Expectation is just one, this is for more points and more experience.*
    * **2 - Exceeds:** Submitted in three or more modalities, amazing job! (10 pts)
    * **1 - Mastery:** Submitted in two modalities, fantastic job! (5 pts)
    * **0 - Expected:** Submitted one modality, great job! (0 pts)
3. **Subjective** quality: *Subjective estimate of the quality of the output. For this homework, that will be based on the clarity of your analysis and the quality of your pivot tables and visualizations.*
    * **3 - High Quality:** Beautiful, graceful, clever, or otherwise high quality analysis and presentation. (15 pts)
    * **2 - Good Quality:** Aesthetic, elegant, logical, or otherwise good quality analysis. (10 pts)
    * **1 - Low Quality:** Messy, quick, illogical, confusing, or otherwise low quality analysis. (5 pts)
    * **0 - None:** No submission. (0 pts)

## Starting Point

This homework assumes you have successfully completed Lab 2 and have a cleaned version of the `JEA Detail.txt` dataset. Your cleaned dataset should contain the following columns:

* **Account**: The general ledger account name
* **Account Category**: The category classification of the account
* **Post Date**: The date the transaction was posted
* **Period**: The accounting period (month) of the transaction
* **User ID**: The person who entered the transaction
* **Manual**: Whether the transaction was entered manually (Yes/No)
* **Description**: Description of the transaction
* **Transaction Number**: Unique identifier for the transaction
* **Location**: The location code where the transaction occurred
* **Amount**: The dollar amount of the transaction


## Analysis Questions

### Q1: Transaction Amount Analysis

Using your cleaned dataset, answer the following questions:

1. **What is the total number of transactions?**
2. **What is the sum of all transaction amounts?**
3. **Explain in one sentence why the sum of all amounts is the value that it is.** (Hint: Think about the fundamental accounting equation and the nature of journal entries)

### Q2: User Transaction Analysis

Analyze transaction patterns by user:

1. **What is the total number of transactions by each user?**
2. **What is the sum of all amounts by each user?**
3. **Which user has the highest number of transactions, and why might this be the case?**

### Q3: Time-Based Analysis with Pivot Tables

Create a pivot table showing transaction amounts by user and time period:

1. **What is the sum of all amounts by each user for each period?** Create a pivot table with User ID as rows and Period as columns, showing the sum of amounts.

### Q4: Transaction Structure Exploration

Examine the structure and patterns within individual transactions:

1. **What is the median number of journal entries per transaction?**
2. **How many transactions have exactly 4 journal entries?** (This is a common pattern in accounting)
3. **Are there any transactions with entries from multiple users?** If so, provide an example.

## Submission

To complete this homework, provide evidence of your analysis in one or more modalities:

1. **Answer All Questions:**
    * Provide clear, concise answers to all analysis questions (Q1-Q4)
    * Include the actual values/results from your analysis

2. **Create Pivot Tables:**
    * Create at least one pivot table showing User ID vs. Period analysis
    * Ensure your pivot table includes row and column totals
    * Format the table for easy reading

3. **Take Screenshots:**
    * Capture screenshots of your pivot tables and analysis results
    * Ensure all values are clearly visible
    * Include any relevant summary statistics or insights

4. **Create Document:**
    * Compile your answers and screenshots into a single document
    * Organize your responses clearly with appropriate headers
    * Include brief explanations of your findings

5. **Save as PDF:**
    * Export your document as `[your uid]_Homework2.pdf`
    * Upload to the Canvas assignment

## Tips for Success

* Remember that journal entries should balance (debits = credits), which explains why amounts sum to zero
* Look for patterns in user behavior - automated entries vs. manual entries often show different characteristics
* Pay attention to the timing of transactions - are there patterns by month or user?
* Consider the business context when interpreting your results
* Don't just report numbers - provide brief explanations of what the patterns might mean
