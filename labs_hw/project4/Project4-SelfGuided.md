# Project 4: Self-Guided Data Analytics Project

[TOC]

## 1. Scenario

Throughout this course, you've developed skills in data manipulation, exploratory data analysis, visualization, and predictive modeling. You've applied these skills to structured scenarios with predefined research questions and datasets. Now, it's your turn to drive the analysis.

In this self-guided project, you will:

1. **Identify a research question** that interests you and results in some actionable insights. It could be related to accounting, finance, sports, healthcare, consumer behavior, or any other domain where you can access data.

2. **Find and combine at least two datasets** to get practice exploring merges across datasets that may not be immediately compatible. This will help you explore relationships between datasets that aren't pre-joined, opening up more possible analyses.

3. **Conduct exploratory data analysis** to understand your data's structure, identify patterns, detect anomalies, and motivate your modeling approach.

4. **Build and evaluate at least two models** to address your research question. Models can entail any combination of modalities we've covered (regression, classification, clustering, etc.).

5. **Present your findings** in a professional presentation that tells a compelling story: what you investigated, why it matters, what you found, and what it means.

This project is an opportunity to demonstrate your ability to independently navigate the full analytics workflow, from problem definition to actionable insights.
I also hope that you could use this project as the start of an analytics portfolio that you could show to potential employers, or at least draw examples from in interviews.


### 1.1. Learning Objectives

This project synthesizes all the skills you've developed throughout the course and gives you experience with self-directed analytical work.

By completing this project, you will:

* **Formulate Research Questions**: Identify a meaningful analytical question and justify its relevance
* **Source and Integrate Data**: Find, evaluate, and merge datasets from multiple sources to support your analysis
* **Perform Exploratory Data Analysis**: Use descriptive statistics and visualization to understand data characteristics, relationships, and quality
* **Apply Modeling Techniques**: Build, estimate, and interpret at least two models appropriate to your research question
* **Evaluate Model Performance**: Assess and compare (if applicable) model performance using appropriate metrics
* **Communicate Findings**: Present analytical work to a general accounting audience with clarity and professionalism



### 1.2. Deliverable

**Tone**: Professional presentation - clear, engaging, data-driven. Tailored to your classmates who may not be familiar with your project's specific domain.

**Format**: Slide deck for a 10-minute presentation (~10 slides, approximately 1 slide per minute). You may include multiple slides for complex sections, but keep the total presentation focused and concise.

Slide deck containing:

1. **Title Slide**: Project title, group member names, date

2. **Research Question & Motivation**:
    * What are you investigating and why does it matter?
    * What gap in understanding or business problem motivates this analysis?
    * Brief preview of your approach and key findings

3. **Setting Details and Description**:
    * Background context for your setting/domain/industry
    * Key concepts, practices, assumptions, and terminology your audience needs to understand
    * Any institutional details that inform your analysis (e.g., regulatory environment, market structure, common practices, what a quaffle is, etc.)
    * If applicable, why this setting is interesting or important for your research question
    * *Note:* The further your topic is from accounting/finance, the more detail you'll need here

4. **Data Sources & Integration**:
    * Description of each dataset (source, scope, key variables)
    * How you merged the datasets and what decisions you had to make
    * Final analytical sample (number of observations, time period, unit of analysis)
    * Any significant data quality issues and how you addressed them

5. **Exploratory Data Analysis**:
    * Summary statistics for key variables, where relevant
    * Visualizations showing distributions, relationships, and patterns
    * Key insights from EDA that motivated your modeling approach
    * Any data transformations or feature engineering performed

6. **Modeling Approach**:
    * Clear statement of what you're predicting/classifying/explaining (your outcome variable)
    * Description of predictor variables and why you chose them
    * Formal model specification (equation notation) for each model, defining all variables
    * Description and explanation/justification of the models you're using (e.g. why/how will your chosen analytics help you answer your research question?)

7. **Model Results**:
    * Model results and evaluation (coefficients, significance, fit metrics)
    * Interpretation of which variables drive the predictions
    * Assessment of model performance
    * Any diagnostics or validation checks performed

8. **Analysis & Interpretation**:
    * Description of take-aways from your models
        * If comparing models, side-by-side comparison of models and performance
    * Visualizations comparing predictions, errors, or fit
    * How did the models specifically speak to your research question?
    * What can you conclude from your analysis? What was the economic or business significance of your findings?

9.  **Conclusions & Recommendations**:
    * Summary of key findings
    * Practical implications or recommendations based on your analysis
    * Limitations and caveats
    * Potential next steps or extensions

10. **Thank You** / Questions

11. **Appendix** (if needed): Additional technical details, sensitivity analyses, extended results tables, data dictionary


Additionally, you will have to submit a "proposal" quiz in canvas in Week 11, that outlines your RQ and data sources. This is just to make sure you're on the right track and so we can catch any potential issues early.

* **Week 11 Project 4 Proposal**: Submit the canvas quiz with three questions:
  * Your research question and what's the takeaway
  * Description of your two data sources (with URLs/citations)
  * Confirmation that you can have accessed the data already

---
## 2. Grading

Your project will be graded based on the following criteria:

**Note:** The goal is to demonstrate your ability to independently execute a complete analytics project, not to achieve "perfect" model performance. Thoughtful analysis of modest results is more valuable than superficial treatment of strong results.


1. **Research Question & Motivation**: How clearly defined and well-motivated is your research question? Is the business or analytical relevance explained?
    * **Excellent**: Clear, specific research question with compelling motivation. Audience understands why this matters and what you're trying to accomplish.
    * **Good**: Reasonable research question with basic motivation, but could be more specific or compelling.
    * **Needs Work**: Vague or poorly motivated research question.

2. **Data Sourcing & Integration**: How well-explained and appropriate are your data sources? Are their sources cited? Is the data merge correctly executed and well-documented?
    * **Excellent**: Appropriate, high-quality datasets from cited sources. Merge strategy clearly documented with merge keys identified. Data quality issues acknowledged and addressed appropriately.
    * **Good**: Reasonable datasets with adequate merge documentation, minor issues with data quality or documentation.
    * **Needs Work**: Inappropriate data sources, poorly executed merge, or inadequate documentation of data integration.

3. **Exploratory Data Analysis**: How concise and insightful is your EDA? Do your visualizations or summary statistics effectively communicate important data characteristics?
    * **Excellent**: Comprehensive EDA with effective visualizations or summaries. Clear insights about distributions, relationships, and data quality. EDA clearly motivates modeling choices.
    * **Good**: Basic EDA with reasonable visualizations, but limited depth or unclear connection to modeling approach.
    * **Needs Work**: Superficial or absent EDA, poor visualizations, or no connection between EDA and modeling.

4. **Modeling Approach & Justification**: Are your modeling choices appropriate for your research question? Are they clearly documented and justified?
    * **Excellent**: Modeling choices well-suited to research question with clear justification. Variables chosen based on sound reasoning. Potential issues (e.g., look-ahead bias, multicollinearity) avoided/mitigated or acknowledged as necessary.
    * **Good**: Reasonable modeling choices with limited justification, or minor specification issues.
    * **Needs Work**: Inappropriate models for the research question, poor variable choices, or inadequate justification.

5. **Technical Execution**: Are the models correctly implemented? Are results clearly presented and interpreted?
    * **Excellent**: Models correctly estimated and validated. Results clearly presented with appropriate metrics. Output professionally formatted and easy to interpret.
    * **Good**: Models generally correct with minor technical issues or unclear presentation.
    * **Needs Work**: Significant technical errors, incorrect model estimation, or poorly presented results.

6. **Analysis & Conclusions**: How effectively do your analyses directly address and answer your research question? Are your conclusions clearly supported by your results?
    * **Excellent**: Clear connection between analyses and research question. Results directly address what you set out to investigate. Conclusions are well-supported by evidence and logically follow from your findings. Economic or practical significance is clearly articulated.
    * **Good**: Analyses address the research question with some clarity, but connections could be stronger or conclusions could be better supported.
    * **Needs Work**: Weak connection between analyses and research question, conclusions not clearly supported by results, or findings fail to address the original question.

7. **Recommendations & Limitations**: Do you provide actionable recommendations while appropriately acknowledging limitations?
    * **Excellent**: Clear, actionable recommendations or conclusions directly tied to your findings. Thoughtful discussion of limitations (data, model, scope) that appropriately qualifies your recommendations without undermining them. Practical next steps or implications identified.
    * **Good**: Reasonable recommendations with basic acknowledgment of limitations, though connections could be stronger.
    * **Needs Work**: Vague or missing recommendations, limitations ignored entirely, or recommendations not supported by your analysis.

8. **Analytical difficulty or novelty**: Does your project demonstrate creativity, complexity, or novel application of techniques?
    * **Excellent**: Project demonstrates significant creativity or complexity. Use of advanced techniques, novel data sources, or unique combinations of methods. Clear evidence of independent thinking and problem-solving.
    * **Good**: Some creativity or complexity, but could be more ambitious or novel.
    * **Needs Work**: Project is overly simplistic or derivative, lacking in creativity or complexity.

9. **Presentation Quality & Communication**: How effectively does your presentation communicate your work to the target audience (accounting analytics students)?
    * **Excellent**: Clear narrative arc from question to findings. Appropriate level of technical detail for audience. Complex ideas explained accessibly. Professional visualizations and formatting.
    * **Good**: Generally clear presentation with some organizational or communication issues.
    * **Needs Work**: Unclear narrative, inappropriate level of detail, or unprofessional presentation.




---
## 3. Requirements & Suggested Steps

### 3.1. Topic Selection Guidance

**Choose a domain that interests you.** You'll be spending significant time with this data, so pick something you find genuinely interesting.

**Pre-Flight Checklist**: Before committing to a topic, complete this checklist:

* <input type="checkbox" /> Can I download/access the data RIGHT NOW (not "I'll get access eventually")?
* <input type="checkbox" /> Can I actually open and view the datasets to verify they contain what I expect?
* <input type="checkbox" /> After merging, will I have at least 50-100 observations?
* <input type="checkbox" /> Do I have the technical skills to merge these specific datasets (or time to learn, or willingness to ask Mac for help)?
* <input type="checkbox" /> Are my key variables actually present in the data, not just implied by the dataset description?
* <input type="checkbox" /> Have I verified that the datasets are compatible for merging (common keys, time periods align, etc.), or do I have a "cross walk" to connect them?

**Consider data availability early.** Before committing to a topic, verify that:

* Data exists and is accessible (free or within your means)
* You can obtain at least two datasets that can be meaningfully merged
* The data has sufficient observations for modeling (generally 50+ observations minimum, 100+ preferred)
* Key variables are available or can be constructed

**Think about your audience.** The further your topic is from accounting/finance, the more context you'll need to provide in your presentation. This isn't necessarily bad, just budget time for explanation.

**Example topic ideas** (you are not limited to these):

* *Accounting/Finance:*
    * Analyzing audit fee determinants using firm characteristics and auditor data
    * Modeling IPO underpricing using company fundamentals and market conditions (Jay Ritter [provides IPO data](https://site.warrington.ufl.edu/ritter/ipo-data/))
    * Predicting sales growth using CPI basket subsets by business model (e.g. Walmart vs. Ralph Lauren)
* *Healthcare:*
    * Predicting hospital readmission rates using patient demographics and clinical data
    * Analyzing drug effectiveness using clinical trial data and patient characteristics
    * Classifying disease risk using genetic markers and lifestyle factors
* *Sports:*
    * Predicting NBA player performance using historical stats and physical attributes
    * Analyzing factors that determine team success in college football
    * Classifying whether tennis players will win tournaments based on performance metrics
* *Other:*
    * Predicting real estate prices using property characteristics and neighborhood data
    * Analyzing movie success using budget, cast, and social media data
    * Classifying customer churn using transaction history and demographic data


### 3.3. Core Requirements

Your project must include:

1. **At least two datasets** that you merge together
    * Datasets can come from any source: public databases, course materials, company reports, web scraping, APIs, etc.
    * The merge must be meaningful (i.e., the combined dataset enables analysis not possible with either dataset alone)
    * Document your merge key(s) and any data quality issues encountered

2. **Exploratory Data Analysis (EDA)** for yourself to understand the data, but not necessarily entirely included in your presentation. Your presentation should just include the most relevant EDA results that help tell your story. But for your edification, a helpful EDA checklist includes:
    * Summary statistics for key variables
    * Identification and resolution of data issues (missing values, outliers, duplicates)
    * Visualizations that are useful and provide specific insights (e.g. distributions, correlations, trends, etc.)
    * *For your presentation*: each visualization or table should further the audience's understanding of a key part of your analysis (e.g., why certain predictors matter, how the outcome variable behaves, what data quality issues you addressed)

    **Note**: Focus on quality over quantity. A few well-chosen, clearly explained visualizations are better than many generic plots.

3. **At least two predictive models** that address the same outcome variable. Both models must be meaningfully different, such as:
    * Two different model types (e.g., linear regression vs. logistic regression, OLS vs. regularized regression)
        * For example: a classifier to predict default, and a regression to measure the magnitude of loss given default
    * Same model type with substantively different approaches, variables, time, etc.
        * Example: a cross-sectional and a time-series regression
        * Example: modeling differences over time with models pre-2020 vs. post-2020
    * An unsupervised first step leading into a supervised model
        * Example: dimensionality reduction on a large feature set followed by a regression or classification model
    * The point is to have some variation in your analytics, so any combination that achieves some demonstration of breadth is acceptable. I don't want you to feel concerned about this requirement; I want to teach you that that where one model can provide some insight, multpile provide even more.

4. **Model validation** appropriate to your analysis:
    * For predictive models: Train/test split, cross-validation, or out-of-sample validation
    * For explanatory models: Appropriate verification of validity (e.g. cross-sectional analyses of robustness, sensitivity analyses, etc.)
    * Documentation of validation approach and results

5. **Model evaluation** using appropriate metrics for your model type:
    * Regression: R-squared, RMSE, MAE, etc.
    * Classification: Accuracy, precision, recall, F1-score, AUC, etc.
    * Analysis of model performance and variable significance (economic and statistical)

6. **Professional presentation** (10 minutes) following the deliverable structure in Section 1.2


### 3.4. Suggested Workflow

The following steps provide a roadmap for completing the project. You don't need to follow them exactly, but they represent a logical progression:

1. **Initial Research Question**
    * Brainstorm topics of interest
    * Identify potential data sources
    * Formulate an initial research question
    * Verify data availability and accessibility
2. **Data Collection & Integration**
    * Obtain datasets from identified sources
    * Document data sources, scope, and limitations
    * Perform the merge, documenting merge keys and match rates
    * Create your analytical sample
3. **Data Cleaning & Preparation**
    * Handle missing values
    * Identify and address outliers
    * Create any derived variables or transformations needed
    * Verify data quality
4. **Exploratory Data Analysis**
    * Calculate summary statistics
    * Create visualizations of distributions and relationships
    * Identify patterns, trends, and anomalies
    * Develop hypotheses about what might predict your outcome
5. **Research Question Refinement**
    * Refine your research question based on EDA insights
    * Decide on the specific outcome variable to model
    * Select predictor variables informed by EDA
6. **Model Development**
    * Choose appropriate model types for your research question
    * If needed, split data into training/testing sets
    * Estimate your models
7. **Model Evaluation & Comparison**
    * Calculate appropriate performance metrics
    * Interpret model coefficients and significance
    * Create visualizations / tabulations of model results
8. **Presentation Development**
    * Build slide deck following deliverable structure
    * Create clear visualizations for presentation
    * Practice explaining technical concepts to non-experts
    * Prepare for Q&A
9. **Practice & Refinement**
    * Rehearse presentation, alone or with peers
    * Refine slides based on feedback
    * Prepare for potential questions
    * Polish final deliverable
    * Rehearse timing to fit within 10 minutes (this is harder than you think, ten minutes flies by!)


### 3.2. Data Sources

Here are some potential sources for data, tagged by difficulty level. This is not exhaustive list by any means, feel free to use others:

1. **Beginner-Friendly** (Well-documented, easy to download, CSV/Excel format):
    * Wharton Research Data Services ([wrds.wharton.upenn.edu](https://wrds.wharton.upenn.edu/))
        * WRDS is the source of the course datasets (Compustat, CRSP)
    * Kaggle datasets ([kaggle.com/datasets](https://www.kaggle.com/datasets))
    * UCI Machine Learning Repository ([archive.ics.uci.edu/ml](https://archive.ics.uci.edu/ml))
    * Federal Reserve Economic Data (FRED, [data](https://fred.stlouisfed.org/), [excel plugin](https://fred.stlouisfed.org/fred-addin/))
    * U.S. government data ([data.gov](https://www.data.gov/))
    * Academic paper replication data (many journals require data sharing)

2. **Intermediate** (May require basic scripting, account creation, or data cleaning):
    * Yahoo Finance, Alpha Vantage (stock prices, returns)
    * Google Dataset Search ([datasetsearch.research.google.com](https://datasetsearch.research.google.com/))
    * Baseball Reference, Basketball Reference, etc. (downloadable stats)
    * ESPN, Sports Reference family of sites
    * Zillow Research Data, Realtor.com
    * World Bank, IMF, BLS (Bureau of Labor Statistics)
    * CDC data ([wonder.cdc.gov](https://wonder.cdc.gov/))
    * Medicare/Medicaid data ([data.cms.gov](https://data.cms.gov/))

3. **Advanced** (Requires API knowledge, web scraping, or specialized tools):
    * SEC EDGAR filings (financial statements, disclosures), requires parsing, perhaps with my [pyedgar](https://github.com/gaulinmp/pyedgar/) package
    * Twitter API, Reddit API (rate limits, authentication required)
    * Clinical trial registries ([clinicaltrials.gov](https://clinicaltrials.gov/))
    * Company investor relations websites
    * County assessor offices


### 3.5. Technical Considerations

* **Data Merging:**
    * Document your merge strategy clearly
    * Check merge quality: how many observations matched? How many didn't? Why?
    * Consider whether you need 1:1, 1:many, or many:many merges
    * Handle non-matches appropriately (drop, keep, investigate?)

* **Model Selection:**
    * For regression: OLS is a great starting point; consider more advanced alternatives for many predictors (or consider dimensionality reduction first)
    * For classification: logistic regression is interpretable; tree-based methods (Random Forest, Gradient Boosting) can capture non-linearities
    * Consider whether you need train/test splits (generally yes for predictive models)
    * Think about whether you're doing explanation (understanding relationships) vs. prediction (forecasting accurately)

* **Common Pitfalls to Avoid:**
    * **Look-ahead bias**: Don't use information that wouldn't have been available at the time of prediction
    * **Data leakage**: Don't use information about the outcome to create predictors
    * **Overfitting**: Models that fit training data perfectly but fail on new data
    * **Ignoring missing data**: Document how you handle missing values
    * **Mechanical relationships**: Don't predict ROA using Assets when ROA is mathematically derived from Assets (NI / Assets)
    * **Insufficient data**: Some models need more data than others; be realistic about what you can estimate

* **Red Flags - Stop and Reconsider If:**
    * Your merged dataset has <50 observations after merging
    * Your models achieve >98% accuracy (likely indicates data leakage)
    * You can't explain why you chose your specific predictor variables
    * Your EDA findings have no connection to your choice of model variables
    * Your merge match rate is <30% (not a problem necessarily), and you don't know why (this is the problem)
    * You're predicting an outcome variable using a predictor that's mathematically derived from it
    * Your two models are nearly identical (e.g., same model with one variable added/removed)

* **Getting Help:**
    * Me! Don't hesitate!
    * Labs and project instructions were all designed to provide a roadmap & foundation to build from
    * Classmates
    * LLMs for idea generation, coding, debugging, etc.


### 3.6. Presentation Tips

* **Tell a story:** Your presentation should have a clear narrative arc:
    1. Here's an interesting question
    2. Here's how I investigated it
    3. Here's what I found
    4. Here's what it means

* **Know your audience:** Your classmates are accounting analytics students. They:
    * Understand basic statistics and modeling concepts
    * May not know your specific domain (sports, healthcare, etc.)
    * Care about business implications, not just technical details

* **Visualize effectively:**
    * Every chart should have a clear purpose
    * Use visualization best practices we covered, and clearly highlight the key takeaway on each chart
    * Label axes, include legends, use readable fonts
    * Don't clutter slides with too dense information (remember, a picture is worth a thousand words)

* **Practice:**
    * Rehearse multiple times
    * Time yourself (aim for 10 minutes)
    * Anticipate questions and prepare answers
    * Be ready to defend your choices



---
## 4. Frequently Asked Questions

**Q: Can I use only course datasets (e.g., Compustat and CRSP)?**
A: Yes, as long as you're merging at least two distinct datasets and addressing a research question of your own design.

**Q: What if my models don't perform well?**
A: That's okay! The goal is to demonstrate the analytical process, not achieve perfect predictive accuracy. Thoughtful analysis of *why* models don't perform well is valuable.

**Q: Can my group have X many people?**
A: Yes.

**Q: How many observations do I need?**
A: It depends on your model complexity, but generally aim for at least 50-100 observations. For complex models, you may need many many more. Simple rule of thumb: you should have at least some variables be significant.

**Q: What if I can't find two datasets to merge?**
A: Come talk to me early. I can help you identify data sources or adjust your research question.

**Q: Can I use Python/Excel/Tableau?**
A: Use whatever tools you're comfortable with. Hopefully by now you know what the tools are good and bad at (e.g. Tableau can't do advanced statistical modeling, Excel struggles past basic supervised learning techniques).

**Q: Can I use R?**
A: Eww. Fine.

**Q: What if my EDA reveals data quality issues?**
A: Document them and explain how you addressed them (dropping observations, imputing values, etc.). Part of being a good analyst is handling imperfect data.

**Q: How technical should my presentation be?**
A: Technical enough to demonstrate competence, but accessible enough for your classmates to understand. Think: clear explanation of what you did and why, not every line of code.

**Q: Can I use data I've collected myself (e.g., surveys)?**
A: Yes, but ensure you have sufficient data quality and can meaningfully merge it with another dataset.

**Q: What if my two models perform almost identically?**
A: Analyze why! Sometimes different approaches yield similar results, that's an interesting finding worth exploring.

**Q: How much code should I show in my presentation?**
A: Generally, very little to none. Focus on methods and results, not implementation details. Code can go in an appendix if needed.

**Q: Can I use this project for another class?**
A: Sure, but a) check with that instructor first, and b) ensure this project meets all the above requirements. I would suggest, however, that you at least do some additional work to push your learning further. Practice is necessary to master any skill, especially analytics.

**Q: What if my datasets don't merge well (e.g., only 50% match rate)?**
A: Document the merge quality issues and explain why they occurred. If the match rate is too low (<30%), you may need to reconsider your data sources or merge strategy. You also should realize that sometimes merges will just occur on a subset of firms by design, think merging in bankruptcy data where the un-matched firms just didn't go bankrupt (so fill with 0s)

**Q: Can I change my topic partway through the project?**
A: You can work on whatever topic you want up until the due date in Canvas. Obviously, though, changing topics late in the project will require a lot of work to catch up.

**Q: How do I cite data sources?**
A: Include a bibliography or references slide in your appendix with full citations for all data sources, including URLs and access dates where applicable.


---
## 5. Example Project Outlines

These brief outlines illustrate the range of possible projects. Your project should be more detailed and complete. We provide both simpler examples using readily-available data and more ambitious examples to show the full range of possibilities.

### Example 1: Financial Distress Prediction (Simple - Uses Course Data)
* **Research Question**: Can we predict financial distress using accounting ratios and stock market performance?
* **Data Source 1**: Compustat financial data (from course materials) - balance sheet and income statement items
* **Data Source 2**: CRSP stock returns data (from course materials) - stock returns and volatility
* **Merge**: Company identifier (GVKEY/PERMNO link)
* **Models**: Logistic regression with accounting ratios only vs. logistic regression with accounting ratios + market-based measures (returns, volatility)
* **Comparison**: AUC, precision, and recall to assess whether market data improves distress prediction beyond accounting information

### Example 2: Sales Performance Analysis (Simple - Uses Kaggle Data)
* **Research Question**: What drives retail product sales?
* **Data Source 1**: Kaggle retail sales dataset (product-level sales, prices, promotions)
* **Data Source 2**: Kaggle customer demographics dataset (store location demographics)
* **Merge**: Store ID
* **Models**: OLS regression with product characteristics only vs. OLS with product characteristics + demographic controls
* **Comparison**: R-squared and out-of-sample RMSE to evaluate whether demographics improve sales predictions

### Example 3: Predicting Startup Success (Advanced)
* **Research Question**: What factors predict whether a startup will receive Series B funding?
* **Data Source 1**: Crunchbase data on startups (funding rounds, industry, location)
* **Data Source 2**: LinkedIn company data (employee growth, executive backgrounds)
* **Merge**: Company name/ID
* **Models**: Logistic regression (baseline model with just funding/industry variables) vs. Random Forest (incorporating employee growth and executive experience)
* **Comparison**: Precision, recall, and AUC to determine which factors are most predictive

### Example 4: Retail Sales Forecasting (Advanced)
* **Research Question**: Can we improve retail sales forecasts by incorporating local economic indicators?
* **Data Source 1**: Retailer store-level sales data
* **Data Source 2**: County-level unemployment and income data from BLS/Census
* **Merge**: Store location to county
* **Models**: Linear regression with store characteristics only vs. linear regression with store characteristics plus local economic indicators
* **Comparison**: Out-of-sample RMSE to assess whether local economic data improves forecast accuracy

### Example 5: NFL Player Performance (Advanced)
* **Research Question**: Does college performance predict NFL success for quarterbacks?
* **Data Source 1**: College football statistics (passing yards, completion %, wins)
* **Data Source 2**: NFL combine measurements and first 3 years NFL statistics
* **Merge**: Player name
* **Models**: Ridge regression (regularized to handle many correlated college stats) vs. simpler OLS with just key college metrics
* **Comparison**: R-squared and MAE for predicting NFL QB rating

### Example 6: Credit Risk Assessment (Advanced)
* **Research Question**: What drives small business loan default?
* **Data Source 1**: SBA loan data (loan amount, industry, location, default status)
* **Data Source 2**: Economic indicators by region (GDP growth, unemployment)
* **Merge**: Location and time period
* **Models**: Logistic regression vs. Gradient Boosted Trees
* **Comparison**: Classification metrics (accuracy, precision, recall) and feature importance
