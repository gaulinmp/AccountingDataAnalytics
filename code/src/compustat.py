#!/usr/bin/env python
# -*- coding: utf-8 -*-

# STDlib imports
import os
from pathlib import Path
import logging
# import datetime as dt

# 3rd party package imports
import numpy as np
import pandas as pd
from reslib.data.cache import DataFrameCache as _DataFrameCache

# project imports
from . import wrds_connection, DATA_DIR


# Local _logger
_logger = logging.getLogger(__name__)


class CompustatAnnual(_DataFrameCache):
    """
    Read Compustat data from cache if it exists,
    or read from WRDS Postrgres server, and write out to
    `interim` cache folder.

    Variables: https://wrds-www.wharton.upenn.edu/data-dictionary/comp_na_daily_all/funda/
    """

    # Arguments passed to _pd.read_csv
    file_format = "csv"
    read_args = {"compression": None}
    override_directory = DATA_DIR

    def make_dataset(self):
        # Build sub-queries
        gics = """
            SELECT gvkey AS gvkey_hgic, ggroup AS ggroup_hgic, gind AS gind_hgic,
                    gsector AS gsector_hgic, gsubind AS gsubind_hgic,
                    indfrom AS indfrom_hgic, indthru AS indthru_hgic
            FROM comp.co_hgic"""

        # final FUNDA query
        funda_query = f"""
            SELECT a.gvkey, a.tic, a.conm AS name, a.fyear, a.fyr, a.datadate
                , (a.datadate - ast.funda_start) AS age_days
                , at, act, lt, lct, invt, ap, rect, recd
                , (COALESCE(dltt, 0) + COALESCE(dlc, 0)) AS total_debt, che, re
                , oancf, ebit, ebitda, ni, ib, pi, sale, revt, epspi, epspx
                , xad, xrd, xsga, xint, capx, cogs, dvt
                , emp
                , prcc_f AS share_price, csho AS shares_outstanding
                , GREATEST(a.prcc_f * a.csho, COALESCE(mkvalt, 0)) AS mve
                , COALESCE(seq /* Shareholder Equity is reported SE if not missing */
                    /* if SEQ missing, use Total Common Equity plus Preferred Stock Par Value  */
                    ,ceq + pstk
                    /* otherwise, Total Assets-(Total Liabilities+Minority Interest) */
                    ,at - lt - COALESCE(mib, 0))
                    AS seq
                , seq AS bve
                , CASE
                    WHEN CAST(a.au AS INTEGER) >= 1 AND CAST(a.au AS INTEGER) <= 8 THEN 1
                    ELSE 0
                END AS bign
                , CASE au
                    WHEN '0' THEN 'Unaudited'
                    WHEN '1' THEN 'Arthur Andersen'
                    WHEN '2' THEN 'Arthur Young'
                    WHEN '3' THEN 'Coopers & Lybrand'
                    WHEN '4' THEN 'Ernst & Young'
                    WHEN '5' THEN 'Deloitte & Touche'
                    WHEN '6' THEN 'KPMG'
                    WHEN '7' THEN 'PricewaterhouseCoopers'
                    WHEN '8' THEN 'Touche Ross'
                    WHEN '9' THEN 'Other'
                    WHEN '10' THEN 'Altschuler, Melvoin and Glasser'
                    WHEN '11' THEN 'BDO International'
                    WHEN '12' THEN 'BKD LLP'
                    WHEN '13' THEN 'Cherry Bekaert LLP'
                    WHEN '14' THEN 'Clarkson, Gordon'
                    WHEN '15' THEN 'CliftonLarsonAllen LLP'
                    WHEN '16' THEN 'Crowe Horwath'
                    WHEN '17' THEN 'Grant Thornton'
                    WHEN '18' THEN 'CohnReznick LLP'
                    WHEN '19' THEN 'Kenneth Leventhal'
                    WHEN '20' THEN 'Laventhol and Horwath'
                    WHEN '21' THEN 'RSM'
                    WHEN '22' THEN 'Moore Stephens'
                    WHEN '23' THEN 'Moss Adams'
                    WHEN '24' THEN 'PKF International'
                    WHEN '25' THEN 'Plante & Moran'
                    WHEN '26' THEN 'EisnerAmper LLP'
                    WHEN '27' THEN 'Spicer & Oppenheim'
                    ELSE 'Other'
                END AS auditor
                , auop, auopic
                , gics.*
            FROM (
                SELECT *
                FROM comp.funda
                WHERE INDFMT = 'INDL'
                    AND (DATAFMT = 'STD')
                    AND (POPSRC = 'D')
                    AND (CONSOL = 'C')
                    AND (fyear >= 2000) AND (fyear < 2025)
                    AND gvkey IS NOT NULL
                    AND fyr IS NOT NULL
                    AND at IS NOT NULL
                    AND prcc_f IS NOT NULL
                ) a
            LEFT JOIN (SELECT gvkey, MIN(datadate) AS funda_start
                    FROM comp.funda GROUP BY gvkey) ast
                ON (a.gvkey = ast.gvkey)
            LEFT JOIN ({gics}) AS gics
                ON (a.gvkey = gics.gvkey_hgic
                    AND gics.indfrom_hgic <= a.datadate
                    AND a.datadate <= COALESCE(gics.indthru_hgic, current_date));
            """

        _logger.debug(f"Compustat query: {funda_query}")
        with wrds_connection() as wrds:
            df = wrds.read_sql(funda_query)
        _logger.debug(f"Compustat result: {len(df)}")

        for c in "gvkey_hgic indfrom_hgic indthru_hgic".split():
            if c in df:
                del df[c]

        df = df.rename(
                columns={
                    "gsector_hgic": "gics_sector",
                    "ggroup_hgic": "gics_group",
                    "gind_hgic": "gics_industry",
                    "gsubind_hgic": "gics_subindustry",
                }
            )
        # Add GICS sector labels to gics_sector_name
        df['gics_sector_name'] = df['gics_sector'].map({
            10: 'Energy',
            '10': 'Energy',
            15: 'Materials',
            '15': 'Materials',
            20: 'Industrials',
            '20': 'Industrials',
            25: 'Consumer Discretionary',
            '25': 'Consumer Discretionary',
            30: 'Consumer Staples',
            '30': 'Consumer Staples',
            35: 'Health Care',
            '35': 'Health Care',
            40: 'Financials',
            '40': 'Financials',
            45: 'Information Technology',
            '45': 'Information Technology',
            50: 'Telecommunication Services',
            '50': 'Telecommunication Services',
            55: 'Utilities',
            '55': 'Utilities',
        })

        cols = ['gvkey', 'tic', 'name', 'fyear', 'fyr', 'age_days']
        for c in df:
            if c not in cols:
                cols.append(c)
        cols = [c for c in cols if c in df]

        return df[cols]

    @property
    def cleandata(self):
        df = self.data
        return (
            df
            .sort_values('at')
            .assign(
                firm_id=lambda df: df.groupby('gvkey', sort=False).ngroup(),
                gvkey=lambda df: df.firm_id,
            )
            .rename(columns={'fyr': 'fiscal_year_end_month'})
            .drop(columns=['gvkey'])
            .sort_values("firm_id fyear fiscal_year_end_month".split())
            .drop_duplicates('firm_id fyear'.split())
            .reset_index(drop=True)
        )

class CompustatAnnualRDQ(_DataFrameCache):
    """
    Read Compustat data from cache if it exists,
    or read from WRDS Postrgres server, and write out to
    `interim` cache folder.

    Variables: https://wrds-www.wharton.upenn.edu/data-dictionary/comp_na_daily_all/funda/
    """

    # Arguments passed to _pd.read_csv
    file_format = "csv"
    read_args = {"compression": None, "parse_dates": ["datadate", "rdq"]}
    override_directory = DATA_DIR

    def make_dataset(self):
        # Build sub-queries
        gics = """
            SELECT gvkey AS gvkey_hgic, ggroup AS ggroup_hgic, gind AS gind_hgic,
                    gsector AS gsector_hgic, gsubind AS gsubind_hgic,
                    indfrom AS indfrom_hgic, indthru AS indthru_hgic
            FROM comp.co_hgic"""

        # final FUNDA query
        funda_query = f"""
            SELECT DISTINCT CAST(a.gvkey AS integer) as gvkey
                , a.tic, a.conm AS name, a.fyear, a.fyr, a.datadate
                , fundq.rdq, fundq.datacqtr, fundq.datafqtr
                , lnk.lpermno AS permno, lnk.lpermco AS permco
                , (a.datadate - ast.funda_start) AS age_days
                , at, act, lt, lct, invt, ap, rect, recd
                , (COALESCE(dltt, 0) + COALESCE(dlc, 0)) AS total_debt, che, re
                , oancf, ebit, ebitda, ni, ib, pi, sale, revt, epspi, epspx
                , xad, xrd, xsga, xint, capx, cogs, dvt
                , emp
                , prcc_f AS share_price, csho AS shares_outstanding
                , GREATEST(a.prcc_f * a.csho, COALESCE(mkvalt, 0)) AS mve
                , COALESCE(seq /* Shareholder Equity is reported SE if not missing */
                    /* if SEQ missing, use Total Common Equity plus Preferred Stock Par Value  */
                    ,ceq + pstk
                    /* otherwise, Total Assets-(Total Liabilities+Minority Interest) */
                    ,at - lt - COALESCE(mib, 0))
                    AS seq
                , seq AS bve
                , CASE
                    WHEN CAST(a.au AS INTEGER) >= 1 AND CAST(a.au AS INTEGER) <= 8 THEN 1
                    ELSE 0
                END AS bign
                , CASE au
                    WHEN '0' THEN 'Unaudited'
                    WHEN '1' THEN 'Arthur Andersen'
                    WHEN '2' THEN 'Arthur Young'
                    WHEN '3' THEN 'Coopers & Lybrand'
                    WHEN '4' THEN 'Ernst & Young'
                    WHEN '5' THEN 'Deloitte & Touche'
                    WHEN '6' THEN 'KPMG'
                    WHEN '7' THEN 'PricewaterhouseCoopers'
                    WHEN '8' THEN 'Touche Ross'
                    WHEN '9' THEN 'Other'
                    WHEN '10' THEN 'Altschuler, Melvoin and Glasser'
                    WHEN '11' THEN 'BDO International'
                    WHEN '12' THEN 'BKD LLP'
                    WHEN '13' THEN 'Cherry Bekaert LLP'
                    WHEN '14' THEN 'Clarkson, Gordon'
                    WHEN '15' THEN 'CliftonLarsonAllen LLP'
                    WHEN '16' THEN 'Crowe Horwath'
                    WHEN '17' THEN 'Grant Thornton'
                    WHEN '18' THEN 'CohnReznick LLP'
                    WHEN '19' THEN 'Kenneth Leventhal'
                    WHEN '20' THEN 'Laventhol and Horwath'
                    WHEN '21' THEN 'RSM'
                    WHEN '22' THEN 'Moore Stephens'
                    WHEN '23' THEN 'Moss Adams'
                    WHEN '24' THEN 'PKF International'
                    WHEN '25' THEN 'Plante & Moran'
                    WHEN '26' THEN 'EisnerAmper LLP'
                    WHEN '27' THEN 'Spicer & Oppenheim'
                    ELSE 'Other'
                END AS auditor
                , auop, auopic
                , gics.*
            FROM (
                SELECT *
                FROM comp.funda
                WHERE INDFMT = 'INDL'
                    AND (DATAFMT = 'STD')
                    AND (POPSRC = 'D')
                    AND (CONSOL = 'C')
                    AND (fyear >= 2015) AND (fyear < 2025)
                    AND gvkey IS NOT NULL
                    AND fyr IS NOT NULL
                    AND at IS NOT NULL
                    AND prcc_f IS NOT NULL
                ) a
            LEFT JOIN (SELECT gvkey, MIN(datadate) AS funda_start
                    FROM comp.funda GROUP BY gvkey) ast
                ON (a.gvkey = ast.gvkey)
            LEFT JOIN ({gics}) AS gics
                ON (a.gvkey = gics.gvkey_hgic
                    AND gics.indfrom_hgic <= a.datadate
                    AND a.datadate <= COALESCE(gics.indthru_hgic, current_date))
            LEFT JOIN (
                SELECT DISTINCT gvkey, datadate, fyearq, fyr, datacqtr, datafqtr, rdq
                FROM comp.fundq
                WHERE (INDFMT = 'INDL')
                    AND (DATAFMT = 'STD')
                    AND (POPSRC = 'D')
                    AND (CONSOL = 'C')
                    AND (RDQ IS NOT NULL)) AS fundq
                ON fundq.gvkey = a.gvkey
                    AND fundq.datadate = a.datadate
                    AND fundq.fyearq = a.fyear
                    AND fundq.fyr = a.fyr
            LEFT JOIN (SELECT gvkey, lpermno, lpermco, linkdt, linkenddt FROM crsp.ccmxpf_linktable WHERE usedflag=1 AND linkprim IN ('P', 'C', 'J')) AS lnk
                ON a.gvkey = lnk.gvkey
                    AND a.datadate BETWEEN COALESCE(lnk.linkdt, '1900-01-01') AND COALESCE(lnk.linkenddt, NOW())
            ;"""

        _logger.debug(f"Compustat query: {funda_query}")
        with wrds_connection() as wrds:
            df = wrds.read_sql(funda_query)
        _logger.debug(f"Compustat result: {len(df)}")

        for c in "gvkey_hgic indfrom_hgic indthru_hgic".split():
            if c in df:
                del df[c]

        df = df.rename(
                columns={
                    "gsector_hgic": "gics_sector",
                    "ggroup_hgic": "gics_group",
                    "gind_hgic": "gics_industry",
                    "gsubind_hgic": "gics_subindustry",
                }
            )
        # Add GICS sector labels to gics_sector_name
        df['gics_sector_name'] = df['gics_sector'].map({
            10: 'Energy',
            '10': 'Energy',
            15: 'Materials',
            '15': 'Materials',
            20: 'Industrials',
            '20': 'Industrials',
            25: 'Consumer Discretionary',
            '25': 'Consumer Discretionary',
            30: 'Consumer Staples',
            '30': 'Consumer Staples',
            35: 'Health Care',
            '35': 'Health Care',
            40: 'Financials',
            '40': 'Financials',
            45: 'Information Technology',
            '45': 'Information Technology',
            50: 'Telecommunication Services',
            '50': 'Telecommunication Services',
            55: 'Utilities',
            '55': 'Utilities',
            60: 'Real Estate',
            '60': 'Real Estate',
        })

        cols = ['gvkey', 'tic', 'name', 'fyear', 'fyr', 'rdq', 'age_days']
        for c in df:
            if c not in cols:
                cols.append(c)
        cols = [c for c in cols if c in df]

        return df[cols]

    @property
    def cleandata(self):
        df = self.data
        return (
            df
            .sort_values('at')
            .assign(
                firm_id=lambda df: df.groupby('gvkey', sort=False).ngroup(),
                gvkey=lambda df: df.firm_id,
            )
            .rename(columns={'fyr': 'fiscal_year_end_month'})
            .drop(columns=['gvkey'])
            .sort_values("firm_id fyear fiscal_year_end_month".split())
            .drop_duplicates('firm_id fyear'.split())
            .reset_index(drop=True)
        )
