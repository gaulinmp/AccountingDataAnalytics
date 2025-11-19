import pandas
from pathlib import Path
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))

df = pandas.read_excel("tableau_emails.xlsx")
cols = "accounting-data-analytics username none1 none2 Creator None True DEFAULT".split()

for c in cols:
    if c in df: continue
    if 'none' in c:
        df[c] = None
    else:
        df[c] = c

df['username'] = df.username.replace("@", "\x40", regex=False)

for c in '5150-001', '5150-002', '6155-001':
    (
        df
        .query(f'Section.str.contains("{c}") and username.notnull()')
        [cols]
        .to_csv(f"tableau_emails_{c}.csv", index=False, header=False, encoding="utf-8")
    )
