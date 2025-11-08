# Lab 10: Classifiers and Cost Evaluation

Lab 10 introduces you to building, interpreting, and evaluating logistic regression classifiers, and estimating the expected-cost effects of different errors. The data are of customer accounts receivable (AR) payment behavior, and the goal is to predict which customers are likely to default on their payments. You will build two classifiers: one using only payment and credit features, and another adding customer demographic characteristics. You will evaluate model performance using classification metrics (precision, recall, F1 score) and ROC/AUC analysis, and perform cost-benefit analysis to determine optimal classification thresholds.


[TOC]

## 1. Assignment

**Submission:** To complete this lab, complete the Canvas quiz, including uploading screenshots and reporting results:

1. **Base Logit Classifier**: Logistic regression predicting customer non-payment of Accounts Receivable using payment and credit features
2. **Classifier with Demographics**: Logistic regression building on the base model by adding customer demographic features (gender, education, marital status, age)
3. **Classifier Error Estimation**: Evaluation of the two classifiers using cost metrics (confusion matrix, precision, recall, F1 score) and ROC/AUC analysis
4. **Cost-Benefit Analysis**: Estimation of expected costs associated with different classification thresholds

Data are adapted from a dataset of an anonymous company's dataset of 30,000 customers, and contain that customer's payment behavior, extended credit limit, and demographic information.


### 1.1. Learning Objectives

By the end of this lab, you will be able to:

* Build and estimate logistic regression classifiers for binary outcomes
* Interpret logistic regression coefficients (log-odds, odds ratios, and their meaning)
* Evaluate classifier performance using confusion matrices and classification metrics (accuracy, precision, recall, F1 score)
* Understand ROC curves and AUC (Area Under Curve) as threshold-independent performance measures
* Apply cost-sensitive evaluation by incorporating business costs of false positive and false negative errors
* Understand the business implications of classification thresholds and optimize threshold selection based on cost-benefit analysis


### 1.2. Tools

As always, you can use whatever modality you are comfortable with, but it should again be noted that Tableau doesn't have logistic regression capabilities, so Python or Excel are recommended. Further, not even Excel has native logistic regression support (it's possible using the Solver add-in with manual log-likelihood setup, but not practical for this lab). So if you are planning on using Excel, we will use OLS as our regression, and pretend the output is a probability like a logistic regression (which is fine when we're wanting to use the prediction as a classifier, meaning we're just taking a cutoff at a threshold). This also hopefully serves as a nice reminder that a) OLS is awesome, and b) OLS and logistic regression often give similar results (and in this dataset, almost exactly the same results!).

* **Excel**: Use OLS regression via Data Analysis Toolpak. Predicted values will be interpreted as probabilities, as with a logistic regression, and from there everything will be calculated as if it were a logistic regression, including classification metrics.
* **Python**: `statsmodels` library provides `logit()` function for logistic regression with well-formatted output. `sklearn.metrics` provides all classification metrics. Gotta love Python!

---
## 2. Data

The dataset for this lab contains customer accounts receivable (AR) payment data from an anonymous company. The data includes 29,881 customer records with information about their payment behavior, credit limits, and demographic characteristics. This allows you to build predictive models for identifying customers at risk of non-payment, and to evaluate the trade-offs between different types of classification errors.

The dataset `ar_default_data.csv` contains the following variables:

* **Outcome Variable:**
    * `bad_ar`: Binary indicator (1 = customer defaulted on payment in the next month, 0 = customer did not default)
* **Payment and Credit Features:**
    * `credit_limit`: Maximum credit extended to customer (thousands of dollars)
    * `outstanding_balance`: Current outstanding balance (thousands of dollars)
    * `pay_this_month`: Payment status this month (0 = paid on time or did not have any transactions with the company (see next variable), 1 = AR age 30 - 60 days, 2 = AR age 60 - 90 days, 3 = AR age 90+ days)
    * `no_activity_this_month`: Binary indicator (1 = no transactions or payments this month, 0 = activity occurred)
    * `last_payment_portion`: Portion of balance paid in last payment (0 to 2, where 1 = paid 100% balance, <1 = partial payment, >1 = overpaid, or paid current period and settled previous balance)
    * `num_recent_payments`: Number of payments made in last 6 months months (0-6, where 6 indicates consistent payment history)
* **Demographic Features:**
    * `gender`: Customer gender (male, female)
    * `education`: Education level (1-high school, 2-university, 3-graduate school, 4-trade school, 5-phd)
    * `marital_status`: Marital status (married, single, divorced)
    * `age_decile`: Customer age group (20-70, representing age deciles, e.g., 20 = 20-29, 30 = 30-39, etc.)

*Note*: This dataset exhibits class imbalance, with approximately 22% of customers in the "bad AR" category. This is typical in credit risk modeling and affects how we interpret classification metrics. {: .note}


### 2.2. Key Variables for This Lab

**Outcome Variable (Y)**

* **`bad_ar`**: Binary indicator of customer default
    * 1 = customer failed to pay (bad debt)
    * 0 = customer paid as expected
    * Base rate: ~22% of customers (class imbalance)

**Base Model Predictors (X)**

* **Payment behavior features**: These capture how customers have been managing their payments
    * `credit_limit`: Credit extended (higher limits may indicate lower perceived risk)
    * `outstanding_balance`: Current balance owed (higher balances may indicate higher risk)
    * `pay_this_month`: Current payment delay (worth considering how to treat this variable, as it is ordinal)
    * `no_activity_this_month`: No activity indicator (dormant accounts)
    * `last_payment_portion`: Recent payment amount relative to balance
    * `num_recent_payments`: Payment consistency over time (higher is more consistent, thus less risky)

**Extended Model Predictors (additional Xs)**

* **Demographic features**: These add customer characteristics to assess incremental predictive value
    * `gender`: Male vs female
    * `education`: Educational attainment (5 categories)
    * `marital_status`: Married, single, or other
    * `age_decile`: Age group (younger vs older customers)

**Expected performance**: The base model using payment features should achieve decent predictive performance. Adding demographics may provide modest improvements, but raises questions about whether collecting this additional data is worthwhile given the incremental value and potential fairness concerns.


### 2.3. Understanding Classifier Metrics

Classification models require different evaluation metrics than regression models. The nomenclature (positive/negative, true/false) can be confusing at first, especially if you're thinking of "positive" as "good." In classification, "positive" simply refers to the class of interest, which in this setting of AR defaults, would mean positive is defaulting on AR (which is bad). I will admit that when I made my python and excel solutions, I skipped the whole positive/negative thing, and just refered to it as "default" and "pay", so that when thinking about true positives, I was writing "true default", which meant correctly predicting a customer would default. Hopefully that makes it a bit easier to think about!

Here are the key concepts:

**Confusion Matrix**: A 2 by 2 table showing predicted vs actual classifications

|  | **Predicted: No Default** | **Predicted: Default** |
|---|---|---|
| **Actual: No Default** | True Negative (TN) | False Positive (FP) |
| **Actual: Default** | False Negative (FN) | True Positive (TP) |

**Key Metrics**:

* **Accuracy** = (TP + TN) / Total: Overall correctness, but can be misleading with imbalanced classes
* **Precision** = TP / (TP + FP): Of customers flagged as risky, what % actually defaulted? (Quality of positive predictions)
* **Recall** (Sensitivity) = TP / (TP + FN): Of customers who defaulted, what % did we catch? (Completeness of positive predictions)
* **F1 Score** = 2 * (Precision * Recall) / (Precision + Recall): Harmonic mean balancing precision and recall
* **Specificity** = TN / (TN + FP): Of customers who paid, what % did we correctly identify as non-risky?
* For the ROC curve:


**ROC Curve and AUC**:

* **ROC (Receiver Operating Characteristic) Curve**: Plots True Positive Rate vs False Positive Rate across all thresholds
    * **True Positive Rate (TPR)** = Recall = TP / (TP + FN)
    * **False Positive Rate (FPR)** = 1 - specificity = FP / (FP + TN): Of customers who didn't default, what % did we incorrectly flag as risky?
* **AUC (Area Under Curve)**: Single number summarizing ROC curve. Ranges from 0.5 (random guessing) to 1.0 (perfect classifier)
    * AUC = 0.70-0.75: Acceptable *(our model comes in around here)*
    * AUC = 0.75-0.80: Good
    * AUC = 0.80-0.90: Excellent *(a random forest model on this data comes in around here)*
    * AUC > 0.90: Outstanding (or potentially overfit)

**Classification Thresholds**: By default, classifiers use 0.5 probability as the cutoff. However, business context often requires different thresholds to optimize for specific costs and benefits. Also, if we are using OLS, we likely have to adjust our threshold anyway.

*Note*: With imbalanced classes (78% non-default, 22% default), simply predicting "everyone pays" achieves 78% accuracy but is useless for risk management. This is why precision, recall, and AUC are more informative metrics than accuracy alone. {: .note}


---
## 3. Step-by-Step Instructions

This lab walks you through building and evaluating classification models for credit risk prediction.

Generally, when reporting the output of a logistic regression model, you should include:

* Intercept and coefficients (in log-odds form, the default output of Excel and `statsmodels`)
* Standard errors or z-statistics or P-values for significance testing
* Some R<sup>2</sup> (pseudo, adjusted, etc.)
* Number of observations
* We will separately calculate classification performance metrics (confusion matrix, precision, recall, F1, AUC), so no need to try and fit them in your regression output


### 3.1. Exercise 1: Base Logit/OLS Classifier

**Objective**: Build a logistic regression classifier to predict customer default using payment behavior and credit features.

Logistic regression is the standard approach for binary classification problems in accounting and finance. Unlike OLS regression (which predicts any old value), logistic regression predicts a probability that an observation belongs to a particular class (in our case, the probability of default). The model outputs values between 0 and 1, which can be interpreted as risk scores.

*Excel Note*: Since Excel does not have built-in logistic regression, so you will use OLS regression instead <span class='smol'>(let's just pretend that Excel has kept up with the times, and added even one analytical feature by default. Looking at you, Analysis ToolPak still being a plugin 👀)</span>. We will treat the predicted values from OLS as probabilities, and proceed with classification metrics as if they were from a logistic regression. If it makes you feel any better, OLS and Logit both achieve a 75% AUC score, so effectively identical. {: .note} 

#### 3.1.1. Tasks

1. **Load the dataset**: `ar_default_data.csv` (all 29,881 customer records)
2. **Run logistic regression**:
    * Outcome variable (Y): `bad_ar`
    * Predictor variables (X): `credit_limit`, `outstanding_balance`, `pay_this_month`, `no_activity_this_month`, `last_payment_portion`, `num_recent_payments`
3. **Report the results**: Take a screenshot of your regression output showing coefficients, fit statistics, and R<sup>2</sup>
4. **Generate predictions**:
    * Calculate predicted probabilities for each customer: `bad_ar_prob`
    * Create binary predictions using 0.5 threshold: `bad_ar_predicted = bad_ar_prob > 0.5`
5. **Create confusion matrix**: Compare `bad_ar_predicted` to actual `bad_ar` values
6. **Calculate classification metrics** (remember, TP is correctly predicted defaults, FP is incorrectly predicted defaults, etc.):
    * Accuracy: (TP + TN) / Total
    * Precision: TP / (TP + FP)
    * Recall: TP / (TP + FN)
    * F1 Score: 2 * (Precision * Recall) / (Precision + Recall)

#### 3.1.2. Questions to Answer

1. Which payment features are statistically significant (p-values < 0.05)? What does this tell you about what predicts defaults in this dataset?
2. What is the coefficient on `pay_this_month`? Since logistic regression uses log-odds, what does a positive coefficient mean for the probability of default?
3. What is the precision of your classifier? In general terms, this means: "Of the customers we flagged as high-risk, what percentage actually defaulted?"
4. What is the recall of your classifier? In general terms, this means: "Of the customers who actually defaulted, what percentage did we successfully flag?"
5. Would you prefer to optimize for higher precision or higher recall in a credit risk context? Why? (Consider the business costs of false positives vs false negatives)


### 3.2. Exercise 2: Classifier with Demographics

**Objective**: Enhance the base model by adding demographic features to assess whether customer characteristics provide incremental predictive value.

Demographics are often included in credit risk models, but they raise important questions: Do they materially improve predictions? Is the incremental value worth the additional data collection? Are there fairness and compliance concerns with using demographic variables in credit decisions?

*Excel note*: Yet more Excel issues! Excel doesn't let you run a regression with more than 16 variables. No really. So if you're running out of variables, I suggest grouping up some of the age deciles like `age_60_and_70`, or use it as a single continuous variable. {: .note}


#### 3.2.1. Tasks

1. **Using the same dataset and base model from Exercise 1**, add demographic features:
    * `gender`: only has 2 categories, so one dummy variable is needed (e.g. male OR female, not two)
    * `education`: create a dummy variable for each category, omitting one (see Lab 9 for why)
    * `marital_status`: create a dummy variable for each category, again omitting one
    * `age_decile`: consider whether you want to treat this as continuous or categorical (if categorical, create dummies)
    * *Python note*: `statsmodels` can handle categorical variables directly using the `C()` function as we saw in Lab 9, so no need to manually create dummies.
2. **Run logistic regression** with all features:
    * Outcome variable (Y): `bad_ar`
    * Predictor variables (X): All payment/credit features from Exercise 1 **plus** the demographic variables `gender`, `education`, `marital_status`, `age_decile`, however you choose to code them
3. **Report the results**: Take a screenshot of your regression output
4. **Generate predictions and metrics** using 0.5 threshold
5. **Create comparison table** for your own edification:

| Metric | Base Model (Ex 1) | With Demographics (Ex 2) |
|--------|-------------------|--------------------------|
| Pseudo R<sup>2</sup> | | |
| Accuracy | | |
| Precision | | |
| Recall | | |
| F1 Score | | |

#### 3.2.2. Questions to Answer

1. Which demographic features are statistically significant at the 5% level (p < 0.05)? What does this tell you?
2. How much did the accuracy improve from the base model to the model with demographics? Is this a meaningful improvement?
3. Did precision improve, worsen, or stay roughly the same? What about recall? What does this pattern tell you?
4. Looking at the precision/recall trade-off, is the model improvement worth collecting demographic data? Consider: data collection costs, privacy concerns, and potential regulatory issues with using demographics in credit decisions.


### 3.3. Exercise 3: ROC Curves and Threshold Selection

**Objective**: Understand the trade-offs between precision and recall at different classification thresholds, and use ROC curves to compare model performance.

So far we've used the default 0.5 threshold to convert predicted probabilities into binary classifications. But this threshold is arbitrary! Different thresholds create different precision/recall trade-offs. ROC curves visualize model performance across all possible thresholds, making them invaluable for model comparison and threshold selection.

#### 3.3.1. Tasks

1. **Using your models from Exercises 1**, generate predicted probabilities (don't convert to binary classes yet)
2. **Create threshold analysis table** by making a table of thresholds from 0.0 to 1.0 (e.g., increments of 0.01) and then using those thresholds to calculate confusion matrix components and metrics at each threshold (see the table below which contains a few rows based on my model, as an example. As you can see, I called True Positives "TrueDefault" to keep things straight. I also added a "check sum" column to make sure my counts added up to the total number of observations, verifying that I didn't mess up the formulas):
    * Calculate TP, TN, FP, FN at each threshold
    * Calculate recall and precision at each threshold
    * Calculate True Positive Rate (TPR = recall) and False Positive Rate (FPR = 1 - specificity) at each thresholds
    * Plot TPR vs FPR to create the ROC curve
    * Calculate the area under the curve (AUC)
3. **Calculate AUC** (Area Under the ROC Curve) for your model
4. **Plot Recall and Precision vs Threshold** on the same chart to visualize the trade-off
5. **Plot the ROC curves** based on true positive rate and false positive rate calculations from your table

| Threshold | TruePay | FalsePay | FalseDefault | TrueDefault | check sum | Recall | Precision  | tpr   | fpr    | auc_part |
|-----------|---------|----------|--------------|-------------|-----------|--------|------------|-------|--------|----------|
| 0.5       | 22292   | 4425     | 966          |        2198 |     29881 | 0.331  | 0.694      | 0.331 | 0.0415 | 0.000285 |
| 0.51      | 22312   | 4436     | 946          |        2187 |     29881 | 0.330  | 0.698      | 0.330 | 0.0406 | 0.000226 |
| 0.52      | 22328   | 4459     | 930          |        2164 |     29881 | 0.326  | 0.699      | 0.326 | 0.0399 | 0.000182 |


#### 3.3.2. Questions to Answer

1. Looking at your threshold analysis graph and table, describe the precision/recall trade-off as you move from low thresholds to high thresholds.
2. If your goal was to catch at least 80% of customers who will default (recall ≥ 0.80), what threshold would you choose? What precision does this achieve? How many customers would you flag for collections intervention?
3. What does the ROC curve tell you about model performance? Why is a curve closer to the top-left corner better?
4. Why might you choose a threshold different from 0.5? Give a specific business scenario where a lower threshold (e.g., 0.30) or higher threshold (e.g., 0.70) would be more appropriate.


### 3.4. Exercise 4: Cost-Benefit Analysis

**Objective**: Incorporate business costs into threshold selection by calculating the expected financial impact of different classification errors.

Classification metrics like precision and recall are useful, but they treat all errors equally. In reality, not flagging an account that defaults (false negatives) and incorrectly flagging good customers (false positives) have different business costs. Cost-benefit analysis helps you choose the optimal threshold that minimizes expected losses or maximizes expected profits.

We're going to take an extreme example, and say that the company does not extend any AR credit to those customers who are flagged as likely to default (i.e. above a threshold). This means that we forgoe the expected cost of a default when correct, but forgo the expected value of a customer when wrong. In general, we might choose to calculate those expected costs/benefits from our historical data. Given the limitations of the data we have, we will assume that a default looses the average outstanding balance, and a paying customer generates the average outstanding balance.

* **True Paying Customer (TN)**: Correctly identify paying customer → cost: $0
* **True Defaulting Customer (TP)**: Correctly identify defaulting customer, avoiding their default → benefit: average of outstanding balance for all *defaulting* customers
* **Falsely Predict Default (FP)**: Flag good customer as risky, forgo revenue on account → cost: average of outstanding balance for all *non-defaulting* customers
* **Falsely Predict Paying (FN)**: Miss a defaulting account, write off bad debt → cost: average of outstanding balance for all *defaulting* customers


#### 3.4.1. Tasks

1. **Using your threshold analysis table from Exercise 3**, add calculations for expected costs/benefits at each threshold:
    * Expected cost = # of TP * benefit per TP + # of TN * benefit per TN - # of FP * cost per FP - # of FN * cost per FN
2. **Plot net result vs threshold** to visualize the optimal operating point
3. **Identify the optimal threshold** that minimizes expected costs (it will be net negative, so we're looking for the least negative value)


#### 3.4.2. Questions to Answer

1. What threshold maximizes the net financial result? How does this compare to the default 0.5 threshold?
2. What is the net financial benefit of using the optimal threshold vs using 0.5? Express this as total dollars saved/gained across the entire customer base.
3. At the optimal threshold, what is your precision and recall? How does this compare to the 0.5 threshold?
4. How would your optimal threshold change if FN cost doubled? Test this scenario and explain the intuition (also your precision / recall vs threshold graph will help with this explanation).
5. Why is this cost-benefit approach more useful for business decision-making than simply maximizing an accuracy score?


---
## 4. Business Insights

This lab demonstrates several important classification and risk management principles:

* Payment behavior is often the strongest predictor of default, and the value of demographic features should be carefully evaluated against their costs and fairness implications
* Classification metrics (precision, recall, F1) provide different perspectives on model performance, and should be interpreted in the context of business objectives
* ROC/AUC provides threshold-independent assessment of model discrimination ability
* Default 0.5 threshold is arbitrary; optimal threshold depends on business costs of false positives vs false negatives
* Cost-benefit analysis directly links model predictions to financial outcomes, enabling data-driven threshold selection


---
## 5. Technical Guidance

This section provides step-by-step instructions for implementing the lab exercises.

### 5.1. Excel Implementation

Excel does not have native support for logistic regression. While it's theoretically possible to estimate logistic regression using the Solver add-in by manually setting up the log-likelihood function, this is impractical for a lab setting and error-prone. As a workaround, we will use OLS regression to generate predicted values, and treat these as probabilities for classification purposes. This is a simplification, but for the purposes of this lab, it will suffice.

*Note*: Statisticians, being very grandiose, like to call using OLS in this way a "linear probability model." In practice, OLS and logistic regression for binary outcomes often yield similar classification results, especially when the outcome is not extremely imbalanced, so it's fine to use. But now you know how fancy you can sound doing so. {: .note}

Broadly, the steps are:

1. Prepare your data in a tabular format with features and target variable.
2. Use OLS regression to estimate the models
    1. I put the Y variable in column A, and the X variables for Exercise 1 in columns F-K.
    2. For Exercise 2, add demographic dummy variables, depending on which coding you choose (e.g. how many levels of education, age, etc.) (mine were columns L - U). Just make sure that the variables from Exercise 1 are contiguous with your new demographic dummy variables so you can put them all in the second regression together, and that the total number of variables does not exceed 16.
3. Generate predicted probabilities from the model (I called mine `bad_ar_prob`)
    * This will be just like in Lab 9, where you use the regression coefficients to calculate predicted Y values. 
    * Given where I put my table, my formula for Exercise 1 was:
        * `=$Z$13+$Z$14 * [@[outstanding_balance]] + $Z$15 * [@[pay_this_month]] + $Z$16 * [@[no_activity_this_month]] + $Z$17 * [@[last_payment_portion]] + $Z$18 * [@[num_recent_payments]] + $Z$19 * [@[credit_limit]]`
4. Generate binary predictions using a threshold. I **strongly** recommend referencing the threshold in a cell, so you can easily change it later. I put the value `0.5` in cell `Z1` (and labeled it for clarity), and then my formula for predicted class (which I called `bad_ar_hat`) was:
    * ```=--([@[bad_ar_prob]]>$Z$1)``` (using that `--` trick to convert `TRUE`/`FALSE` to `1`/`0`)
5. Create confusion matrices and calculate metrics at different thresholds
    1. Create a table of thresholds from 0 to 1 (e.g., increments of 0.01). For the formulas below, I made this new table an Excel table called `ThresholdTable`, with the first column named `Threshold`.
    2. For each threshold, calculate the confusion matrix counts (TP, TN, FP, FN) by counting how many predictions fall into each category based on the threshold
        * *Note*: Calculating the confusion matrix requires counting the number of true positives, true negatives, false positives, and false negatives based on the predicted and actual values. This is where being comfortable with binary comes in handy for making Excel formulas, because counting how many rows have `bad_ar == 1` *and* `bad_ar_pred == 1` is mathematically the same as `SUM(bad_ar * bad_ar_pred)`. {: .note}
        * Example formulas (assuming your actual `bad_ar` values are in column A, predicted probabilities in column B):
            * True Positives (TP): `=SUM((--(DataTable[bad_ar_prob] >= [@Threshold]))*(DataTable[bad_ar]))`
            * False Positives (FP): `=SUM((--(DataTable[bad_ar_prob] >= [@Threshold]))*(1-DataTable[bad_ar]))`
            * True Negatives (TN): `=SUM((--(DataTable[bad_ar_prob] < [@Threshold]))*(1-DataTable[bad_ar]))`
            * False Negatives (FN): `=SUM((--(DataTable[bad_ar_prob] < [@Threshold]))*(DataTable[bad_ar]))`
    3. Calculate precision, recall, and other metrics using these confusion matrix counts
    4. Calculate TPR and FPR for ROC curve
        * TPR = Recall = TP / (TP + FN)
        * FPR = FP / (FP + TN)
    5. Calculate the AUC using the trapezoidal rule (you can do this by summing up the areas of trapezoids formed between each pair of points on the ROC curve)
        * The trapezoidal rule formula for each segment is the width (difference in FPR from row to row) times the average height (average of TPR from row to row)
        * My TPR was in column `AW13:112`, and FPR was in column `AX13:112`, so the formula was `=(AX13-AX14) * AVERAGE(AW13:AW14)`
    6. Calculate expected costs/benefits at each threshold (again, I recommend calculating the average outstanding balances in cells, and then referencing them in your formulas)
        * Multiply the TP/TN/FP/FN counts by their respective costs/benefits and sum them up (remembering to add the benefits and subtract the costs)
6. Plot the ROC curve and cost-benefit analysis results using Excel charts
    * Plot Recall vs Threshold and Precision vs Threshold on the same chart
    * Plot TPR vs FPR to create the ROC curve
    * Plot summed cost-benefit vs Threshold to visualize optimal operating point


Note on the confusion matrix calculations: you could also achieve these counts with `SUMPRODUCT` or array formulas that evaluate conditions across your dataset. I'll explain my formula, if you're curious:

* For True Positives (TP), the formula `=SUM((--(DataTable[bad_ar_prob] >= [@Threshold])) * (DataTable[bad_ar]))` works as follows:
    * `--(DataTable[bad_ar_prob] >= [@Threshold])` creates an array of 1s and 0s indicating whether each predicted probability exceeds the threshold (1 for predicted default, 0 for non-default).
    * `DataTable[bad_ar]` is the actual outcome (1 for default, 0 for non-default).
    * Multiplying these two arrays element-wise gives 1 only when both conditions are met because only 1 * 1 = 1 (predicted default and actual default), and 0 otherwise.
    * Finally, `SUM(...)` adds up all the 1s to give the total count of true positives.
* The TN/FN calculations just change the greater-than to a less-than condition (e.g. < threshold means 1 is non-default)
* The FP/TN calculations multiply by `(1 - DataTable[bad_ar])` to flip the actual outcome so non-defaults is a 1, and defaults is a 0 (because 1 - 1 = 0, and 1 - 0 = 1)
    * This flipping of 1s and 0s is a common trick in binary math to isolate the opposite class, but only works with binary variables


### 5.2. Python Implementation

The following is example code for implementing the lab exercises in Python. You could think of each section as a cell in your notebook, but note that the code below doesn't just copy/paste complete the Lab. It does, however, cover all the code you need to complete the exercises.

**Setup and Data Loading**

```python
# Load Imports
import pandas as pd
import numpy as np
import statsmodels.formula.api as smf
from sklearn.metrics import (confusion_matrix, classification_report,
                             accuracy_score, precision_score, recall_score, f1_score,
                             roc_curve, roc_auc_score, auc)
import matplotlib.pyplot as plt
import seaborn as sns

# Load data
df = pd.read_csv('ar_default_data.csv')

# View first few rows
df.head()

# Check class balance
print(f"Default rate: {df['bad_ar'].mean():.2%}")
print(df['bad_ar'].value_counts())
```

**Running Logistic Regression (Exercise 1)**

*Note*: if you want, you could use ols instead of logit here to mimic Excel's approach, but logit is preferred for classification tasks. Just change the `smf.logit` to `smf.ols` and proceed similarly.

```python
# Exercise 1: Base model with payment/credit features
model_e1_base = smf.logit(
    'bad_ar ~ credit_limit + pay_this_month + no_activity_this_month + last_payment_portion + num_recent_payments',
    data=df).fit()
# Exercise 2: Base model + demographics
model_e2_demo = smf.logit(
    'bad_ar ~ credit_limit + pay_this_month + no_activity_this_month + last_payment_portion + num_recent_payments '
    '+ C(gender) + C(education) + C(marital_status) + C(age_decile)',
    data=df).fit()

# Display regression output for screenshot
print(model_e1_base.summary())

# Get predicted probabilities
df['pred_prob_base'] = model_e1_base.predict(df)
df['pred_prob_demo'] = model_e2_demo.predict(df)

# Create binary predictions using 0.5 threshold
df['pred_class_base'] = (df['pred_prob_base'] > 0.5).astype(int)
df['pred_class_demo'] = (df['pred_prob_demo'] > 0.5).astype(int)
```

**Confusion Matrix and Classification Metrics**

```python
# Set threshold variable for changing later
THRESHOLD = 0.5

# Create confusion matrix
cm = confusion_matrix(df['bad_ar'], df['pred_prob_base'] >= THRESHOLD)
print("\nConfusion Matrix:")
print(cm)

# Pretty confusion matrix with labels
cm_df = pd.DataFrame(cm,
                     index=['Actual: Paid', 'Actual: Default'],
                     columns=['Predicted: Paid', 'Predicted: Default'])
print(cm_df)

# Calculate metrics
accuracy = accuracy_score(df['bad_ar'], df['pred_prob_base'] >= THRESHOLD)
precision = precision_score(df['bad_ar'], df['pred_prob_base'] >= THRESHOLD)
recall = recall_score(df['bad_ar'], df['pred_prob_base'] >= THRESHOLD)
f1 = f1_score(df['bad_ar'], df['pred_prob_base'] >= THRESHOLD)

print(f"\nClassification Metrics (threshold=0.5):")
print(f"Accuracy:  {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall:    {recall:.4f}")
print(f"F1 Score:  {f1:.4f}")

# Alternative: Use classification_report for comprehensive output
print("\n" + classification_report(df['bad_ar'], df['pred_prob_base'] >= THRESHOLD,
                                   target_names=['Paid', 'Default']))
```


**ROC Curves**

```python
# Calculate ROC curve for both models
fpr_base, tpr_base, thresholds_base = roc_curve(df['bad_ar'], df['pred_prob_base'])
fpr_demo, tpr_demo, thresholds_demo = roc_curve(df['bad_ar'], df['pred_prob_demo'])

auc_base = auc(fpr_base, tpr_base)
auc_demo = auc(fpr_demo, tpr_demo)

# Plot ROC curves
plt.figure(figsize=(8, 6))
plt.plot(fpr_base, tpr_base, label=f'Base Model (AUC = {auc_base:.3f})')
plt.plot(fpr_demo, tpr_demo, label=f'With Demographics (AUC = {auc_demo:.3f})')
plt.plot([0, 1], [0, 1], 'k--', label='Random Classifier')
plt.xlabel('False Positive Rate')
plt.ylabel('True Positive Rate (Recall)')
plt.title('ROC Curves')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```

**Plot Threshold Analysis**

```python
# Threshold analysis for base model
thresholds_to_test = list(np.arange(0.0, 0.91, 0.01))
threshold_results = []

for threshold in thresholds_to_test:
    pred_class = (df['pred_prob_base'] > threshold).astype(int)

    threshold_results.append({
        'Threshold': threshold,
        'Precision': precision_score(df['bad_ar'], pred_class),
        'Recall': recall_score(df['bad_ar'], pred_class),
        'F1 Score': f1_score(df['bad_ar'], pred_class),
        '% Flagged': pred_class.mean() * 100
    })

threshold_df = pd.DataFrame(threshold_results)
threshold_df.set_index('Threshold')[['Precision', 'Recall', 'F1 Score']].plot()
```

**Cost-Benefit Analysis**

```python
# Define costs/benefits
COST_FP = df.query('bad_ar==0').outstanding_balance.mean()
COST_FN = df.query('bad_ar==1').outstanding_balance.mean()
BENEFIT_TP = df.query('bad_ar==1').outstanding_balance.mean()
COST_TN = 0

# Test multiple thresholds
thresholds_cost = np.arange(0.1, 0.91, 0.01)
cost_results = []

for threshold in thresholds_cost:
    pred_class = (df['pred_prob_base'] > threshold).astype(int)

    # Get confusion matrix components
    tn, fp, fn, tp = confusion_matrix(df['bad_ar'], pred_class).ravel()

    # Calculate costs and benefits
    total_fp_cost = fp * COST_FP
    total_fn_cost = fn * COST_FN
    total_tp_benefit = tp * BENEFIT_TP
    net_result = total_tp_benefit - total_fp_cost - total_fn_cost

    cost_results.append({
        'Threshold': threshold,
        'TP': tp, 'FP': fp, 'FN': fn, 'TN': tn,
        'TP Benefit': total_tp_benefit,
        'FP Cost': total_fp_cost,
        'FN Cost': total_fn_cost,
        'Net Result': net_result
    })

cost_df = pd.DataFrame(cost_results)

# Find optimal threshold
optimal_idx = cost_df['Net Result'].idxmax()
optimal_threshold = cost_df.loc[optimal_idx, 'Threshold']
optimal_net = cost_df.loc[optimal_idx, 'Net Result']

print(f"\nOptimal threshold: {optimal_threshold:.2f}")
print(f"Net result at optimal threshold: ${optimal_net:,.0f}")

# Compare to default 0.5 threshold
threshold_50_net = cost_df.loc[cost_df['Threshold'].round(1) == 0.5, 'Net Result'].values[0]
improvement = optimal_net - threshold_50_net
print(f"Net result at 0.5 threshold: ${threshold_50_net:,.0f}")
print(f"Improvement: ${improvement:,.0f}")

# Plot net result vs threshold
plt.figure(figsize=(10, 6))
plt.plot(cost_df['Threshold'], cost_df['Net Result'], marker='o')
plt.axvline(optimal_threshold, color='r', linestyle='--', label=f'Optimal: {optimal_threshold:.2f}')
plt.axvline(0.5, color='g', linestyle='--', label='Default: 0.50')
plt.xlabel('Classification Threshold')
plt.ylabel('Net Result ($)')
plt.title('Cost-Benefit Analysis: Net Result by Threshold')
plt.legend()
plt.grid(True, alpha=0.3)
plt.show()
```


### 5.3. Common Issues and Troubleshooting

* **Problem**: Very low precision but high recall (or vice versa)
    * **Cause**: Threshold too low (high recall, low precision) or too high (low recall, high precision)
    * **Solution**: This is not a "problem"—it's the precision/recall trade-off. Adjust threshold based on business costs (Exercise 4)

* **Problem**: AUC is around 0.5 (no better than random guessing)
    * **Cause**: Model has no predictive power, or using wrong variables
    * **Solution**: Verify you're using correct outcome variable (`bad_ar`) and predictors. Check that data loaded correctly. AUC should be about 0.75

* **Problem**: Getting different confusion matrix values at threshold 0.5 than classmates
    * **Cause**: Possible differences in how ties are handled or rounding
    * **Solution**: Small differences (1-2 observations) are okay. Large differences suggest using different data or models

* **Problem**: Cost-benefit analysis shows that 0 or 1 threshold is optimal
    * **Cause**: Cost calculations may be wrong, or have the wrong sign
    * **Solution**: Check that you're using BENEFIT for TP (positive number) and subtracting costs, not adding them: `net = TP_benefit - FP_cost - FN_cost`

* **Problem**: ROC curve looks jagged or strange
    * **Cause**: Plotting issue or not enough unique predicted probabilities
    * **Solution**: Make sure you're passing predicted probabilities (0-1 range), not binary classes. Use `df['pred_prob_base']`, not `df['pred_class_base']`

* **Problem**: Python says "module not found" for sklearn or statsmodels
    * **Cause**: Package not installed
    * **Solution**: In Colab, these should be pre-installed. Try running: `!pip install scikit-learn statsmodels` in a cell

* **Problem**: Convergence warnings when fitting logistic regression
    * **Cause**: Model optimization didn't fully converge to best coefficients
    * **Solution**: Usually not a problem if warning says "nearly converged". If persistent, try increasing max iterations: `model.fit(maxiter=100)` or check for perfect separation


*Excel tip*: Don't use Excel for analytics. {: .tip}
