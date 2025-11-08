# Project 3: Modeling the Market and the Firm

[TOC]

## 1. Scenario

Financial forecasting is a critical function in corporate planning, capital allocation, and strategic decision-making.
When firms forecast their future earnings or financial metrics, they face a fundamental choice: should they rely on broad, market-wide relationships observed across all firms, or focus on their own historical patterns?

In this project, you'll explore this question by building two predictive models of some accounting metric or financial ratio of your choice (e.g., future net income):

1. **General (Cross-Sectional) Model**: A regression model trained on data from all firms in the market, capturing systematic economy-wide relationships between lagged financial metrics and future performance.

2. **Firm-Specific Model**: A regression model using the same explanatory (X) variables, trained exclusively on a single firm's historical data, capturing that firm's idiosyncratic patterns and relationships.

To avoid overfitting, you will fit both models on a "training" dataset, comprising all years before some cutoff year of your choice, splitting the sample into "in-sample" pre-cutoff, and "out-of-sample" post-cutoff.
You will then compare these approaches by evaluating both their in-sample explanatory power and their out-of-sample predictive accuracy.
This comparison will reveal important insights about the nature of financial forecasting, such as whether systematic market patterns outperform firm-specific history.
Again, the project deliverable will be a professional presentation, framed as an internal pitch to management, recommending how the firm should approach financial forecasting given your empirical evidence.

### 1.1. Learning Objectives

This project builds your regression modeling and forecasting skills while deepening your understanding of systematic vs. idiosyncratic firm behavior.

By completing this project, you will:

* **Build Predictive Models**: Develop multiple regression models using lagged financial metrics to predict future accounting performance
* **Understand Cross-Sectional vs. Firm-Specific Patterns**: Distinguish between systematic market-wide relationships and firm-specific dynamics
* **Evaluate Model Performance**: Calculate and interpret in-sample and out-of-sample error metrics (RMSE, MAE) to assess predictive accuracy
* **Interpret Regression Output**: Analyze coefficients, significance levels, and R-squared values to understand what drives predictability
* **Apply Time-Series Forecasting Principles**: Implement proper train/test splits to avoid look-ahead bias in time-series contexts
* **Communicate Quantitative Findings**: Present regression results and forecasting implications to a management audience



### 1.2. Deliverable

**Tone**: Internal management presentation - analytical, data-driven, actionable. Minimal jargon, clear visualizations, focus on business implications.

Slide deck containing (can include multiple slides per section):

1. Title Slide: Project title, group member names, date
2. Executive Summary / Research Question:
    * What are you forecasting and why does it matter?
    * Clear statement of the comparison: general market model vs. firm-specific model
    * Brief preview of key findings
3. Data & Methodology:
    * Outcome variable being predicted (e.g., next year's net income)
    * Predictor variables selected (this year's financial metrics / ratios, stock returns, etc.)
    * Training period and testing period (fiscal years before and after chosen cutoff year)
    * Description of focal firm selected for firm-specific analysis
    * Brief justification of model specification choices
4. General (Cross-Sectional) Model Results:
    * Report of model (coefficients and their significance)
    * R-squared and in-sample error metrics (RMSE/MAE)
    * Identification of those financial metrics that drive predictions across all firms
    * Interpretation of systematic market-wide relationships
5. Firm-Specific Model Results:
    * Report of model (coefficients and their significance)
        * It may be helpful to include a side-by-side comparison of coefficients from both models
    * R-squared and in-sample error metrics (RMSE/MAE)
    * Identification of those financial metrics that drive predictions for this specific firm
    * Interpretation of how these results differ from the general model
6. Out-of-Sample Performance Comparison:
    * Time-series visualization: actual vs. predicted (from both models) values for focal firm
    * Pre- and Post- cutoff error metrics comparison (RMSE/MAE) for both models
    * Interpretation of which model performed better and why (e.g. economic interpretation of differences in model parameters)
7. Insights & Recommendations:
    * What did you learn about systematic vs. firm-specific patterns?
    * Which approach should management use for forecasting?
    * Limitations and caveats
    * Practical implementation considerations
8. Thank You / Questions
9. Appendix (if needed): Regression output tables, additional sensitivity analyses (e.g., does the cutoff year matter?), technical details




---
## 2. Grading

Your project will be graded based on the following criteria:

**Note:** The goal is not to build a "perfect" forecasting model, but to demonstrate comparative analysis and derive insights about the nature of firm-level predictability. Null results (e.g., "neither model predicts well") are acceptable if analyzed thoughtfully.


1. **Model Specification & Justification**: How well documented are your choices of model (outcome variable, predictor variables), cutoff year, and focal firm? Are the choice of predictor variables justified and appropriate given the chosen outcome variable? Do the predictor variables properly avoid look-ahead bias?
    * **Excellent**: Clear documentation of all choices (model, variables, cutoff year, focal firm). Clear and logical justification for selection of predictor variables based on economic and accounting principles. Predictor variables properly avoid look-ahead bias.
    * **Good**: Reasonable model choices with limited justification, or minor specification issues
    * **Needs Work**: Poor model specification, inappropriate variable choices, or no justification provided

2. **Technical Execution**: Are the models correctly implemented with proper train/test splits? Are the models correctly tabulated or otherwise reported? Are error metrics (RMSE, MAE) reported for both train/test samples?
    * **Excellent**: Proper train/test chronological split, both models correctly estimated and reported, error metrics (RMSE/MAE) accurately calculated and reported for both in-sample and out-of-sample periods
    * **Good**: Models generally correct, with one or both models containing minor technical errors or incomplete tabulation or error analysis
    * **Needs Work**: Technical errors in model estimation, improper or missing train/test split, incorrect error calculations

3. **Comparative Analysis**: How clearly are the general vs. firm-specific models compared? Do you analyze both in-sample and out-of-sample performance? Are these metrics and their implications explained clearly?
    * **Excellent**: Detailed comparison of coefficients and significance between models. In- and out-of-sample performance analyzed and explained clearly. Differences quantified with clear implications explained with economic and accounting reasoning.
    * **Good**: Basic comparison of model performance with limited depth or missing some comparisons
    * **Needs Work**: Insufficient or absent comparative analysis, or unclear explanation of metrics

4. **Insight & Interpretation**: Do you derive meaningful insights about cross-sectional and firm-specific patterns? Are regression coefficients interpreted in business terms? Do you provide economic intuition and justification for the *why* of your findings?
    * **Excellent**: Thoughtful interpretation of cross-sectional vs. firm-specific patterns. Coefficients explained in business terms, providing economic intuition for why one model outperforms (or why they perform similarly).
    * **Good**: Some insights with basic interpretation, or limited connection between results and business implications
    * **Needs Work**: Minimal interpretation, insights disconnected from results, or no economic intuition provided

5. **Recommendations & Conclusions**: Whether there are conclusions provided, with clear acknowledgment of limitations and practical considerations for implementation
    * **Excellent**: Clear conclusions drawn from the analysis, limitations acknowledged, practical implementation considerations discussed
    * **Good**: Unclear or weak conclusions, or limited discussion of limitations and practicalities
    * **Needs Work**: No recommendations or recommendations disconnected from findings

6. **Visualization Quality**: How effectively tables and charts communicate the model and performance
    * **Excellent**: Clean model reports, with significance indicated. Clear time-series plot of actual vs. predicted values, effective comparisons for error metrics, well-labeled and professional.
    * **Good**: Basic model reports and visualizations that communicate results but have formatting or clarity issues
    * **Needs Work**: Poor or missing visualizations

7. **Professionalism & Formatting**: How aesthetic and professional the slides appear
    * **Excellent**: Aesthetic, professional slides, consistent formatting, appropriate for executive audience
    * **Good**: Some formatting issues, generally professional and appropriate
    * **Needs Work**: Unprofessional appearance, significant formatting problems



---
## 3. Suggested Steps and Considerations

The below is a suggested set of steps to help you, especially if you're feeling daunted or stuck. You do not need to follow any or all of these steps, they are just provided as a potential guide if it's useful. I happened to choose predicting net income (`ni_next`) as my outcome variable for WalMart (`WMT`), and a cutoff date of 2020. My predictor variables were `ni`, `accruals`, `bhret_m1_p1`, and `byret_year_post_ea`.

### 3.1. Outline of Major Steps

1. Select Outcome Variable & Focal Firm
    * Choose what you want to predict (e.g., next year's NI)
        * Consider economic relevance and practical importance
        * More importantly, choose something you find interesting
        * Consider choosing a future variable that I have provided (e.g., `ni_next`, `roa_next`), so you do not have to calculate the future value yourself. But if you want to predict something else, more power to you!
    * Select a focal firm for the firm-specific model:
        * Consider well-known firms for better business context (Microsoft, Johnson & Johnson, Coca-Cola, Walmart, etc.)
        * Consider firms that have features related to your chosen outcome variable (e.g., high or low volatility earnings, if you want to have a good or poor performing model)
        * Look for firms with long, consistent histories in the dataset (e.g., 20+ years, the maximum is 29)
        * Verify data quality and completeness for your chosen firm (this is relevant because I have given you truncated data, so some firms may have missing years if they had, e.g., NI in the top 1% across all firms)

2. Choose a Model Specification & Data Split
    * **Note:** you will use the same model for your general and firm-specific models, just trained on different data
    * Select predictor variables based on your accounting & economic intuition:
        * Use only contemporary (T) and lagged (T-1) variables when predicting your future (T+1) outcome, to avoid look-ahead bias
        * Consider both accounting ratios/metrics and stock return variables
        * Consider just choosing a sparse few predictors (5 or fewer) unless you really want the complexity of a larger model
        * Verify data availability for your chosen firm and time periods
        * *Note*: Don't worry about whether your model is "good" or "bad". The goal is to compare the two models, not to build a perfect model. So just choose something reasonable that you find interesting and can explain. For refernce, my example model had R-squared of 0.726 for the full market, and 0.830 for the firm-specific model.
    * Define training/in-sample and testing/out-of-sample periods using a chronological split:
        * For example: training = all data through 2017, testing = 2018-2024
        * Ensure sufficient observations in both periods for your focal firm
        * There is no right or wrong answer for choosing your cutoff date, I just want you to consider (and document) the economic implications of your time split
            * For example, what happens to your model if you choose a cutoff before vs after COVID?
    * **Suggestion**: I strongly recommend a simple linear model (OLS regression), but if you want to try something more complex (e.g., Lasso, Random Forest, etc.), go for it!

3. Data Preparation
    * *Suggestion*: drop all columns you are not using, and then drop rows with any missing values in your remaining variables
    * Create training and testing datasets based on your chronological split
    * For the firm-specific model, create a subset containing only the focal firm's data
    * Handle any problematic outliers as you see fit (though note, I have provided a "truncated" dataset that has removed extreme outliers already, so this will likely only be a concern for new calculations)

4. Build & Evaluate the General (Cross-Sectional) Model
    * Fit your model using all firms in the training period
    * Examine regression output:
        * Which coefficients are statistically significant?
        * What is the R-squared value?
        * Do the coefficients make economic sense?
    * Calculate error metrics (RMSE and MAE) on your focal firm's training & test data
        * Note: depending on what modality you use, this will look different. But in general, you will use the model to predict the outcome, then calculate the error between the predicted and actual values (residuals), and then calculate RMSE and MAE from just your focal firm's residuals pre and post your cutoff year, resulting in 4 error metrics (in-sample RMSE/MAE, out-of-sample RMSE/MAE)
    * Consider the difference between RMSE and MAE, especially in the presence of outliers

5. Build & Evaluate the Firm-Specific Model
    * Re-fit your model using only the focal firm's training data
        * Use the same model specification (same predictors) as the general model
        * Note: Sample size will be much smaller (one firm worth of data instead of all firms). You will also likely have fewer statistically significant predictors as a result (why?).
    * Examine regression output:
        * How do coefficients differ from the general model?
        * Which predictors matter for your specific firm?
        * What is the R-squared value?
    * Calculate the same error metrics for your focal firm's training and test data
        * Consider how these compare to the general model's error metrics

6. Complile Model Comparison
    * Combine and evaluate the in-sample and out-of-sample error metrics
        * **RMSE (Root Mean Squared Error):** Penalizes large errors more heavily. Good for math and statistics reasons, economically interpretable as standard deviation of errors.
        * **MAE (Mean Absolute Error):** Average model error (in absolute terms, i.e. predicting 1 more or 1 less treated the same). Highly interpretable, but mathematically less tractable.
    * Create the model output format for your presentation:
        * Model results including coefficients, significance levels, R-squared
        * Error metrics table including:
            * In-sample RMSE/MAE for both models
            * Out-of-sample RMSE/MAE for both models

7. Create Visualizations
    * Time-series plot for the training and testing period showing:
        * Actual observed values
        * General model predictions
        * Firm-specific model predictions
        * Highlight the cutoff year to differentiate training vs. testing periods
        * Add appropriate labels, legend, and title. It is also recommended to somehow visually differentiate the three lines, e.g. different colors and/or line styles
        * ![WalMart Net Income Prediction](figures/WMT_ni_prediction.png "My WMT Example")
    * Optional supporting visualizations. For example:
        * Bar chart comparing RMSE or MAE across models
        * Appendix: Coefficient comparison plot (coefficients from both models side-by-side)
        * Appendix: Residual plots to assess systematic prediction errors

8. Interpret Results & Derive Insights
    * Examine regression coefficients:
        * What drives predictions in each model (i.e., which predictors are significant)?
        * How do systematic patterns differ from firm-specific patterns?
    * Analyze which model performed better and formulate hypotheses about why:
        * Does the firm behave consistently with overall market patterns (general model wins)?
        * Does the firm have unique dynamics (firm-specific model wins)?
        * Does the specific firm's industry, business model, or other characteristics influence which model works better?
    * Consider broader implications:
        * Does the time period matter (e.g., pre vs post COVID)?
        * When should firms use market benchmarks vs. their own history?
        * What does this tell us about firm-level predictability?

9. Build Final Presentation
    * Use the deliverable structure from Section 1.2
    * Focus on clear narrative arc:
        1. Why this question matters
        2. How you approached it (methodology)
        3. What you found (results with compelling visuals)
        4. What it means (insights and recommendations)
    * Ensure slides are:
        * Visually clean and professional
        * Appropriate for management audience
    * Add any helpful technical details to the appendix



### 3.2. Considerations

**Predicting with Accounting vs Stock Return Variables**: You can choose to predict using only accounting variables, or include stock return variables (or just stock return variables, if you're feeling adventurous). What you choose is less important than your explanation of *why*, specifically what information in your X variable you think will help predict your Y variable. I strongly encourage you to think about the information that stock return variables are capturing, and whether it is likely to be useful for predicting your chosen outcome variable (spoiler: it often is).

**Look-ahead bias**: I have provided a few variables you might choose as your outcome (Y) variable from the *next* fiscal year. They are those labeled `_next` (e.g., `ni_next`). I've provided these future values so that you can more easily avoid look-ahead bias, as long as you keep your predictor (X) variables from the *current* or *previous* fiscal year (though do note that `bhret_year_post_ea` is the returns *up until* next year's earnings announcement, so does not include information released *at* the next year's earnings announcement, and therefore would be fine to use as an X variable without the lookahead bias).

**Mechanical relationships**: Related to look-ahead bias, in this dataset, be careful about choosing outcome (Y) variables that are mechanically related to your predictor (X) variables. For example, predicting `roa_next` using `at` as a predictor is problematic, since `roa_next = ni_next / at`, so you would be regressing `at` on `1/at`, a mechanical relationship. This is just another example of why data analysis can be tricky, and why you should always think carefully about your model specification.

**Economic Reasoning**: The most important part of this project is tying your decisions, analyses, and conclusion to economic reasoning. Why do you think your X variables should predict your Y variable? Why do you think certain variables are significant or not significant? Why do you think the general model out or under performs the firm model? These are the questions that a data analyst must ask and answer as a daily part of the job, and the experience I want you to get practice with. The more you can ground your analysis in economic reasoning, the better. If this sounds intimidating, a) you got this, and b) I encourage you to try out using an LLM to bounce ideas off of, or suggest potential economic logic. But remember, LLMs can be wrong, or too reticent to disagree with you unless you push them, so always think critically about what they suggest.

**Stationarity**: In this project, I encourage you to ignore the issue of stationarity. Many financial time series are non-stationary, which can lead to spurious regression results. However, addressing stationarity (e.g., through differencing or detrending) can complicate the analysis and interpretation. For this project, focus on considering the economic questions of predicting future values using today's information, but do be aware that in practice, there are statistical issues depending on the variable you choose that would have to be addressed with more math. A simple TL;DR would be that if you choose a variable that is "sticky" (e.g., total assets), you would probably want to model the change in total assets, rather than the level of total assets. But again, for this project, I encourage you to ignore this issue.


### 3.3. Technical Quickstart

#### 3.3.1. Excel

For Excel, you can use the built-in regression tool in the Data Analysis Toolpak.

1. Load your data into Excel, ensuring you have columns for your outcome variable (Y) and predictor variables (X).
2. Split your data into training (pre-cutoff year) and testing (post-cutoff year) datasets (I just manually filter the rows to the right years, drop missings for the relevant columns, and copy/paste to a new sheet).
3. Go to `Data` -> `Data Analysis` -> `Regression`.
4. Set your Y Range to your outcome variable column in the training data.
5. Set your X Range to your predictor variable columns in the training data.
6. Check `Labels` if you included headers in your selection of the ranges.
7. Choose an output range or new worksheet for the regression results.
8. Click `OK` to run the regression and view the output.
9. You can now calculate the predicted values for your training and testing datasets using the regression coefficients. You can also do this by checking "Residuals" in the regression options, but then you need to align the residuals with the original data.
    * E.g. if your model is ni_next = m\*ni + b, and 
        * NI is in column C
        * Your regression results output put Intercept is in E5, and the coefficient for NI is in E6,
        * Create a new column, called `ni_predicted` with the formula `$E$5 + $E$6 * C2`, copy that formula down the column for all values of ni_next and ni.
        * Just make sure you use the frozen reference (e.g. `$E$5`) for the coefficients when copying the formula so it keeps pointing to the same coefficients.
    * Do this for both models, one on all firm data, and one on just the focal firm's data (but remember, just run the model on the training years!)
    * When calculating predicted values, do so for ALL the data, not just the training years. The same model will predict both in-sample and out-of-sample, you'll just calculate separate error metrics for the two periods.
10. Calculate RMSE and MAE using the formulas:
    * RMSE: `=SQRT(AVERAGE((Actual - Predicted)^2))`
    * MAE: `=AVERAGE(ABS(Actual - Predicted))`
    * You can use these formulas in Excel by creating new columns for the `residuals = (Actual - Predicted)` and then applying the formulas to those columns.

#### 3.3.2. Python

```python
from sklearn.metrics import mean_squared_error, mean_absolute_error, mean_absolute_percentage_error
import statsmodels.formula.api as smf

var = 'ni'
cutoff = 2020
ticker = 'WMT'

# Assumes you have data loaded as df
firm_data = df3.query('ticker==@ticker').sort_values('fyear').assign(fyear_next=lambda df: df.fyear + 1)

# Note, this is the "formula" interface to statsmodels, which is very convenient for quickly specifying models. 
# You just write the model as a string, e.g. 'y ~ x1 + x2 + x3', and it handles the rest.
model = smf.ols(f'{var}_next ~ {var} + accruals + bhret_m1_p1 + bhret_year_post_ea', data=df3.query('fyear < @cutoff')).fit()
print("Full Sample Model:")
print(model.summary())

# This is where the prediction happens, just this one line! Gotta love Python. It will create a new column, called ni_hat, with the predicted values.
# To calculate errors, you can just take ni_next - ni_hat
firm_data[f'{var}_hat'] = model.predict(firm_data)

firm_model = smf.ols(f'{var}_next ~ {var} + accruals + bhret_m1_p1 + bhret_year_post_ea', data=firm_data.query('fyear <= @cutoff')).fit()
print("Firm-Specific Model:")
print(firm_model.summary())
firm_data[f'{var}_hat_firm'] = firm_model.predict(firm_data)

# Make the plot
ax = sns.lineplot(x='fyear_next', y=f'{var}_next', data=firm_data, color='blue', label=f'Actual {var.upper()}', marker='o', markersize=2)
sns.lineplot(x='fyear_next', y=f'{var}_hat', data=firm_data, ax=ax, color='red', label=f'Overall Predicted {var.upper()}')
sns.lineplot(x='fyear_next', y=f'{var}_hat_firm', data=firm_data, ax=ax, color='green', label=f'Firm Predicted {var.upper()}')
ax.vlines(cutoff + .5, 0, 20000, color='grey', linestyle='--')

train_data = firm_data.query('fyear <= @cutoff').dropna(subset=[f'{var}_next', f'{var}_hat', f'{var}_hat_firm'])
test_data = firm_data.query('fyear > @cutoff').dropna(subset=[f'{var}_next', f'{var}_hat', f'{var}_hat_firm'])

rmse_overall_train = np.sqrt(mean_squared_error(train_data[f'{var}_next'], train_data[f'{var}_hat']))
rmse_overall_test = np.sqrt(mean_squared_error(test_data[f'{var}_next'], test_data[f'{var}_hat']))
rmse_firm_train = np.sqrt(mean_squared_error(train_data[f'{var}_next'], train_data[f'{var}_hat_firm']))
rmse_firm_test = np.sqrt(mean_squared_error(test_data[f'{var}_next'], test_data[f'{var}_hat_firm']))
rmse_text = f"""RMSE:
{'Model':<17} < {cutoff}    {cutoff}+
{'Overall':<15} {rmse_overall_train:>8.0f} {rmse_overall_test:>8.0f}
{'Firm-Specific':<15} {rmse_firm_train:>8.0f} {rmse_firm_test:>8.0f}"""

mae_overall_train = mean_absolute_error(train_data[f'{var}_next'], train_data[f'{var}_hat'])
mae_overall_test = mean_absolute_error(test_data[f'{var}_next'], test_data[f'{var}_hat'])
mae_firm_train = mean_absolute_error(train_data[f'{var}_next'], train_data[f'{var}_hat_firm'])
mae_firm_test = mean_absolute_error(test_data[f'{var}_next'], test_data[f'{var}_hat_firm'])
mae_text = f"""Mean Abs. Error:
{'Overall':<15} {mae_overall_train:>8.0f} {mae_overall_test:>8.0f}
{'Firm-Specific':<15} {mae_firm_train:>8.0f} {mae_firm_test:>8.0f}"""


mape_overall_train = mean_absolute_percentage_error(train_data[f'{var}_next'], train_data[f'{var}_hat']) * 100
mape_overall_test = mean_absolute_percentage_error(test_data[f'{var}_next'], test_data[f'{var}_hat']) * 100
mape_firm_train = mean_absolute_percentage_error(train_data[f'{var}_next'], train_data[f'{var}_hat_firm']) * 100
mape_firm_test = mean_absolute_percentage_error(test_data[f'{var}_next'], test_data[f'{var}_hat_firm']) * 100
mape_text = f"""Mean Abs. % Error:
{'Overall':<15} {mape_overall_train:>8.1f} {mape_overall_test:>8.1f}
{'Firm-Specific':<15} {mape_firm_train:>8.1f} {mape_firm_test:>8.1f}"""

ax.text(1.03, 0.5, '\n\n'.join([rmse_text, mae_text, mape_text]), transform=ax.transAxes,
    fontfamily='monospace', fontsize=10, verticalalignment='center',
    bbox=dict(boxstyle='round', facecolor='wheat', alpha=0.5))

plt.legend(bbox_to_anchor=(1.0, 1), loc='upper left')
ax.set_ylabel(f"{var.upper()}")
ax.set_xlabel("Fiscal Year")
```

---
## 4. Data

The data for this project is provided as a CSV file, and it pulled from the same Compustat and CRSP databases as in Project 1 & 2, but I've done the merge, calculated ratios, and added next year variables (e.g., `roa_next`, `oancf_next`) and last year variables (e.g., `at_prev`, `ni_prev`).

I have provided quite a few variables, as you will see below. You do not need to use all of them, or even most of them. The goal is to choose a few variables that you think will help predict your chosen outcome variable, and then justify your choices. If you are overwhelmed by the number of variables, I suggest you start by ignoring the dataset, and just choosing accounting measures that you think will be useful predictors based on your accounting and economic intuition. Then, once you have a list of variables you want to use, you can check the dataset to see if they are available, and if not, choose alternatives.

**Note:** I have provided a "truncated" dataset that has removed extreme outliers. This means that across every continuous variable, I have set the top and bottom 1% of values to missing. If you wish to get the raw data for some reason, please reach out and I will provide it to you.

### 4.1. Data Dictionary

* Financial Statement Variables (from `compustat_annual`) in Millions of USD unless otherwise noted:
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
    * `eps`: Earnings Per Share (Basic) - Including Extraordinary Items (amount in $ / share)
    * `eps_noex`: Earnings Per Share (Basic) - Excluding Extraordinary Items (amount in $ / share)
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
* Industry Classification Variables
    * `gics_sector_name`: GICS Sector code
    * `gics_group_name`: GICS Group code
    * `gics_industry_name`: GICS Industry code
    * `gics_subindustry_name`: GICS Subindustry code
* Financial Ratios
    * `gross_margin`: Gross profit margin, calculated as `(sale - cogs) / sale`
    * `operating_margin`: Operating profit margin, calculated as `ebit / sale`
    * `roa`: Return on assets, calculated as `ni / at_prev`
    * `roa_noex`: Return on assets, calculated with earnings before extraordinary items (`ib / at_prev`)
    * `roe`: Return on equity, calculated as `ni / seq_prev`
    * `ep`: Earnings-to-price ratio, calculated as `ni / mve`
    * `current_ratio`: Current ratio, calculated as `act / lct`
    * `quick_ratio`: Quick ratio (acid-test ratio), calculated as `(act - invt) / lct`
    * `inventory_turnover`: Inventory turnover, calculated as `cogs / ((invt + invt_prev) / 2)`
    * `receivables_turnover`: Receivables turnover, calculated as `sale / ((rect + rect_prev) / 2)`
    * `debt_equity`: Debt-to-equity ratio, calculated as `total_debt / seq`
    * `interest_coverage`: Interest coverage ratio, calculated as `ebit / xint`
    * `capex_sales`: Capital expenditure intensity, calculated as `capx / sale`
    * `ni_growth`: Growth in net income, calculated as `ni / ni_prev`
    * `rd_sales`: R&D intensity, calculated as `xrd / sale` (with `xrd` filled to 0 if missing)
    * `sga_sales`: SG&A intensity, calculated as `xsga / sale` (with `xsga` filled to 0 if missing)
    * `fcf_ni`: Free cash flow to net income ratio, calculated as `(oancf - capx) / ni`
    * `accruals_at`: Accruals to average total assets ratio, calculated as `accruals / at_prev`
* Stock Return variables (from `crsp_daily`):
    * `bhret_year_pre_ea`: Buy and hold return for trading days starting from the trading day *after* the previous year's earnings announcement, through the trading day *before* the earnings announcement date(decimal, e.g., 0.15 = 15%)
    * `bhret_year_post_ea`: Buy and hold return for trading days starting from the trading day *after* the earnings announcement date, to the trading day *before* the next earnings announcement (decimal, e.g., 0.10 = 10%)
    * `bhret_0`: Stock return on earnings announcement date (or first trading day after, if the EA does not land on a trading day) (decimal)
    * `bhret_m1_p1`: 3-day return around earnings announcement (day -1 to +1)
    * `positive_ea_return`: Indicator variable for whether the earnings announcement return (`bhret_0`) is positive (1 = positive return, 0 = negative return)
