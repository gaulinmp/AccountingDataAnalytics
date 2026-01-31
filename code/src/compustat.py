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
        for c in "gics_sector gics_group gics_industry gics_subindustry".split():
            df[c + '_name'] = df[c].map(GICS_LOOKUP[c])

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
                , oancf, ebit, ebitda, ni, ib, pi, sale, revt, epspi AS eps, epspx AS eps_noex
                , xad, xrd, xsga, xint, capx, cogs, dvt, ibc - oancf AS accruals
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
                    AND (fyear >= 1995) AND (fyear < 2029)
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

    def _post_read_hook(self, df: pd.DataFrame) -> pd.DataFrame:
        # Ensure date columns are datetime
        # Add GICS sector labels to gics_sector_name
        for c in "gics_sector gics_group gics_industry gics_subindustry".split():
            df[c + '_name'] = df[c].map(GICS_LOOKUP[c])

        df.loc[df.auditor == "Coopers & Lybrand", 'auditor'] = 'PricewaterhouseCoopers'
        df.loc[df.auditor == "Touche Ross", 'auditor'] = 'Deloitte & Touche'

        df['auop'] = df['auop'].map({
            # This code indicates that the financial statements were not audited.
            0 : "Unaudited",
            # This code indicates that the financial statements are presented fairly.
            1 : "Unqualified",
            # This code indicates that the financial statements are presented fairly, but the auditing firm is concerned about either limitation on the scope of the examination or unsatisfactory financial statement presentations.
            2 : "Qualified",
            # This code indicates that the auditing firm does not express an opinion on the financial statements.
            3 : "No opinion",
            # This code indicates that the auditing firm's opinion is unqualified, but explanatory language has been added to the standard report.
            4 : "Unqualified with additional language",
            # This code indicates that the financial statements are not presented fairly.
            5 : "Adverse opinion",
        })

        return df



GICS_SECTORS = {
    10: 'Energy',
    15: 'Materials',
    20: 'Industrials',
    25: 'Consumer Discretionary',
    30: 'Consumer Staples',
    35: 'Health Care',
    40: 'Financials',
    45: 'Information Technology',
    50: 'Communication Services',
    55: 'Utilities',
    60: 'Real Estate'
}

GICS_GROUPS = {
    # 10 Energy Sector
    1010: 'Energy',
    1510: 'Materials',
    # 20 Industrials Sector
    2010: 'Capital Goods',
    2020: 'Commercial & Professional Services',
    2030: 'Transportation',
    # 25 Consumer Discretionary Sector
    2510: 'Automobiles & Components',
    2520: 'Consumer Durables & Apparel',
    2530: 'Consumer Services',
    2540: 'Media', # new code
    2550: 'Retailing',
    # 30 Consumer Staples Sector
    3010: 'Food & Staples Retailing',
    3020: 'Food, Beverage & Tobacco',
    3030: 'Household & Personal Products',
    # 35 Health Care Sector
    3510: 'Health Care Equipment & Services',
    3520: 'Pharmaceuticals, Biotechnology & Life Sciences',
    # 40 Financials Sector
    4010: 'Banks',
    4020: 'Financial Services',
    4030: 'Insurance',
    4040: 'Real Estate', # old code
    # 45 Information Technology Sector
    4510: 'Software & Services',
    4520: 'Technology Hardware & Equipment',
    4530: 'Semiconductors & Semiconductor Equipment',
    # 50 Communication Services Sector
    5010: 'Telecommunication Services',
    5020: 'Media & Entertainment',
    # 55 Utilities Sector
    5510: 'Utilities',
    # 60 Real Estate Sector
    6010: 'Real Estate',
    6020: 'Real Estate Management & Development', # old code
}

GICS_INDUSTRY = {
    # 10 Energy Sector
    101010: "Energy Equipment & Services",
    101020: "Oil, Gas & Consumable Fuels",
    # 15 Materials Sector
    151010: "Chemicals",
    151020: "Construction Materials",
    151030: "Containers & Packaging",
    151040: "Metals & Mining",
    151050: "Paper & Forest Products",
    # 20 Industrials Sector
    201010: "Aerospace & Defense",
    201020: "Building Products",
    201030: "Construction & Engineering",
    201040: "Electrical Equipment",
    201050: "Industrial Conglomerates",
    201060: "Machinery",
    201070: "Trading Companies & Distributors",
    202010: "Commercial Services & Supplies",
    202020: "Professional Services",
    203010: "Air Freight & Logistics",
    203020: "Passenger Airlines",
    203030: "Marine Transportation",
    203040: "Ground Transportation",
    203050: "Transportation Infrastructure",
    # 25 Consumer Discretionary Sector
    251010: "Automobile Components",
    251020: "Automobiles",
    252010: "Household Durables",
    252020: "Leisure Products",
    252030: "Textiles, Apparel & Luxury Goods",
    253010: "Hotels, Restaurants & Leisure",
    253020: "Diversified Consumer Services",
    254010: "Media", # new code
    255010: "Distributors",
    255020: "Internet & Direct Marketing Retail", # old code (2018)
    255030: "Broadline Retail",
    255040: "Specialty Retail",
    # 30 Consumer Staples Sector
    301010: "Consumer Staples Distribution & Retail",
    302010: "Beverages",
    302020: "Food Products",
    302030: "Tobacco",
    303010: "Household Products",
    303020: "Personal Care Products",
    # 35 Health Care Sector
    351010: "Health Care Equipment & Supplies",
    351020: "Health Care Providers & Services",
    351030: "Health Care Technology",
    352010: "Biotechnology",
    352020: "Pharmaceuticals",
    352030: "Life Sciences Tools & Services",
    # 40 Financials Sector
    401010: "Banks",
    401020: "Thrifts & Mortgage Finance", # old code discontinued 2023
    402010: "Financial Services",
    402020: "Consumer Finance",
    402030: "Capital Markets",
    402040: "Mortgage Real Estate Investment Trusts (REITs)",
    403010: "Insurance",
    404030: "Real Estate Management & Development",
    404020: "Real Estate Investment Trusts (REITs)",

    # 45 Information Technology Sector
    451010: "Internet Software & Services", # new code
    451020: "IT Services",
    451030: "Software",
    452010: "Communications Equipment",
    452020: "Technology Hardware, Storage & Peripherals",
    452030: "Electronic Equipment, Instruments & Components",
    453010: "Semiconductors & Semiconductor Equipment",
    # 50 Communication Services Sector
    501010: "Diversified Telecommunication Services",
    501020: "Wireless Telecommunication Services",
    502010: "Media",
    502020: "Entertainment",
    502030: "Interactive Media & Services",
    # 55 Utilities Sector
    551010: "Electric Utilities",
    551020: "Gas Utilities",
    551030: "Multi-Utilities",
    551040: "Water Utilities",
    551050: "Independent Power and Renewable Electricity Producers",
    # 60 Real Estate Sector
    601010: "Diversified REITs",
    601020: "Real Estate Management & Development",
    601025: "Industrial REITs",
    601030: "Hotel & Resort REITs",
    601040: "Office REITs",
    601050: "Health Care REITs",
    601060: "Residential REITs",
    601070: "Retail REITs",
    601080: "Specialized REITs",
    602010: "Real Estate Management & Development",
}

GICS_SUB_INDUSTRY = {
    # 10 Energy Sector
    10101010: "Oil & Gas Drilling",
    10101020: "Oil & Gas Equipment & Services",
    10102010: "Integrated Oil & Gas",
    10102020: "Oil & Gas Exploration & Production",
    10102030: "Oil & Gas Refining & Marketing",
    10102040: "Oil & Gas Storage & Transportation",
    10102050: "Coal & Consumable Fuels",
    # 15 Materials Sector
    15101010: "Commodity Chemicals",
    15101020: "Diversified Chemicals",
    15101030: "Fertilizers & Agricultural Chemicals",
    15101040: "Industrial Gases",
    15101050: "Specialty Chemicals",
    15102010: "Construction Materials",
    15103010: "Metal, Glass & Plastic Containers",
    15103020: "Paper & Plastic Packaging Products & Materials",
    15104010: "Aluminum",
    15104020: "Diversified Metals & Mining",
    15104025: "Copper",
    15104030: "Gold",
    15104040: "Precious Metals & Minerals",
    15104045: "Silver",
    15104050: "Steel",
    15105010: "Forest Products",
    15105020: "Paper Products",
    # 20 Industrials Sector
    20101010: "Aerospace & Defense",
    20102010: "Building Products",
    20103010: "Construction & Engineering",
    20104010: "Electrical Components & Equipment",
    20104020: "Heavy Electrical Equipment",
    20105010: "Industrial Conglomerates",
    20106010: "Construction Machinery & Heavy Transportation Equipment",
    20106015: "Agricultural & Farm Machinery",
    20106020: "Industrial Machinery & Supplies & Components",
    20107010: "Trading Companies & Distributors",
    20201010: "Commercial Printing",
    20201050: "Environmental & Facilities Services",
    20201060: "Office Services & Supplies",
    20201070: "Diversified Support Services",
    20201080: "Security & Alarm Services",
    20202010: "Human Resource & Employment Services",
    20202020: "Research & Consulting Services",
    20202030: "Data Processing & Outsourced Services",
    20301010: "Air Freight & Logistics",
    20302010: "Passenger Airlines",
    20303010: "Marine Transportation",
    20304010: "Rail Transportation",
    20304020: "Trucking", # Old code (2018)
    20304030: "Cargo Ground Transportation",
    20304040: "Passenger Ground Transportation",
    20305010: "Airport Services",
    20305020: "Highways & Railtracks",
    20305030: "Marine Ports & Services",
    # 25 Consumer Discretionary Sector
    25101010: "Automotive Parts & Equipment",
    25101020: "Tires & Rubber",
    25102010: "Automobile Manufacturers",
    25102020: "Motorcycle Manufacturers",
    25201010: "Consumer Electronics",
    25201020: "Home Furnishings",
    25201030: "Homebuilding",
    25201040: "Household Appliances",
    25201050: "Housewares & Specialties",
    25202010: "Leisure Products",
    25203010: "Apparel, Accessories & Luxury Goods",
    25203020: "Footwear",
    25203030: "Textiles",
    25301010: "Casinos & Gaming",
    25301020: "Hotels, Resorts & Cruise Lines",
    25301030: "Leisure Facilities",
    25301040: "Restaurants",
    25302010: "Education Services",
    25302020: "Specialized Consumer Services",
    25401010: "Advertising",
    25401020: "Broadcasting",
    25401025: "Cable & Satellite",
    25401030: "Movies & Entertainment",
    25401040: "Publishing",
    25501010: "Distributors",
    25502010: "Internet & Direct Marketing Retail",
    25502020: "Internet & Direct Marketing Retail", # old code (2018)
    25503030: "Broadline Retail",
    25504010: "Apparel Retail",
    25504020: "Computer & Electronics Retail",
    25504030: "Home Improvement Retail",
    25504040: "Other Specialty Retail",
    25504050: "Automotive Retail",
    25504060: "Homefurnishing Retail",
    # 30 Consumer Staples Sector
    30101010: "Drug Retail",
    30101020: "Food Distributors",
    30101030: "Food Retail",
    30101040: "Consumer Staples Merchandise Retail",
    30201010: "Brewers",
    30201020: "Distillers & Vintners",
    30201030: "Soft Drinks & Non-alcoholic Beverages",
    30202010: "Agricultural Products & Services",
    30202030: "Packaged Foods & Meats",
    30203010: "Tobacco",
    30301010: "Household Products",
    30302010: "Personal Care Products",
    # 35 Health Care Sector
    35101010: "Health Care Equipment",
    35101020: "Health Care Supplies",
    35102010: "Health Care Distributors",
    35102015: "Health Care Services",
    35102020: "Health Care Facilities",
    35102030: "Managed Health Care",
    35103010: "Health Care Technology",
    35201010: "Biotechnology",
    35202010: "Pharmaceuticals",
    35203010: "Life Sciences Tools & Services",
    # 40 Financials Sector
    40101010: "Diversified Banks",
    40101015: "Regional Banks",
    40102010: "Thrifts & Mortgage Finance", # old code (discontinued 2023)
    40201020: "Diversified Financial Services",
    40201030: "Multi-Sector Holdings",
    40201040: "Specialized Finance",
    40201050: "Commercial & Residential Mortgage Finance",
    40201060: "Transaction & Payment Processing Services",
    40202010: "Consumer Finance",
    40203010: "Asset Management & Custody Banks",
    40203020: "Investment Banking & Brokerage",
    40203030: "Diversified Capital Markets",
    40203040: "Financial Exchanges & Data",
    40204010: "Mortgage REITs",
    40402010: "Diversified REITs", # old code (discontinued effective close of August 31, 2016)
    40402020: "Industrial REITs", # old code (discontinued effective close of August 31, 2016)
    40402030: "Mortgage REITs", # old code (discontinued effective close of August 31, 2016)
    40402035: "Hotel & Resort REITs", # old code (discontinued effective close of August 31, 2016)
    40402040: "Office REITs", # old code (discontinued effective close of August 31, 2016)
    40402045: "Health Care REITs", # old code (discontinued effective close of August 31, 2016)
    40402050: "Residential REITs", # old code (discontinued effective close of August 31, 2016)
    40402060: "Retail REITs", # old code (discontinued effective close of August 31, 2016)
    40402070: "Specialized REITs", # old code (discontinued effective close of August 31, 2016)

    40301010: "Insurance Brokers",
    40301020: "Life & Health Insurance",
    40301030: "Multi-line Insurance",
    40301040: "Property & Casualty Insurance",
    40301050: "Reinsurance",
    40403010: "Diversified Real Estate Activities",
    40403020: "Real Estate Operating Companies",
    40403030: "Real Estate Development",
    40403040: "Real Estate Services",

    # 45 Information Technology Sector
    45101010: "Internet Software & Services", # new code
    45102010: "IT Consulting & Other Services",
    45102030: "Internet Services & Infrastructure",
    45103010: "Application Software",
    45103020: "Systems Software",
    45201020: "Communications Equipment",
    45202030: "Technology Hardware, Storage & Peripherals",
    45203010: "Electronic Equipment & Instruments",
    45203015: "Electronic Components",
    45203020: "Electronic Manufacturing Services",
    45203030: "Technology Distributors",
    45301010: "Semiconductor Materials & Equipment",
    45301020: "Semiconductors",
    # 50 Communication Services Sector
    50101010: "Alternative Carriers",
    50101020: "Integrated Telecommunication Services",
    50102010: "Wireless Telecommunication Services",
    50201010: "Advertising",
    50201020: "Broadcasting",
    50201030: "Cable & Satellite",
    50201040: "Publishing",
    50202010: "Movies & Entertainment",
    50202020: "Interactive Home Entertainment",
    50203010: "Interactive Media & Services",
    # 55 Utilities Sector
    55101010: "Electric Utilities",
    55102010: "Gas Utilities",
    55103010: "Multi-Utilities",
    55104010: "Water Utilities",
    55105010: "Independent Power Producers & Energy Traders",
    55105020: "Renewable Electricity",
    # 60 Real Estate Sector
    60101010: "Diversified REITs",
    60101020: "Industrial REITs",
    60101030: "Hotel & Resort REITs",
    60101040: "Office REITs",
    60101050: "Health Care REITs",
    60101060: "Residential REITs",
    60101070: "Retail REITs",
    60101080: "Specialized REITs",
    60102010: "Diversified Real Estate Activities",
    60102020: "Real Estate Operating Companies",
    60102030: "Real Estate Development",
    60102040: "Real Estate Services",
    60102510: "Industrial REITs",
    60103010: "Hotel & Resort REITs",
    60104010: "Office REITs",
    60105010: "Health Care REITs",
    60106010: "Multi-Family Residential REITs",
    60106020: "Single-Family Residential REITs",
    60107010: "Retail REITs",
    60108010: "Other Specialized REITs",
    60108020: "Self-Storage REITs",
    60108030: "Telecom Tower REITs",
    60108040: "Timber REITs",
    60108050: "Data Center REITs",
    60201010: "Diversified Real Estate Activities",
    60201020: "Real Estate Operating Companies",
    60201030: "Real Estate Development",
    60201040: "Real Estate Services",
}

GICS_LOOKUP = {
    'gics_sector': GICS_SECTORS,
    'gics_group': GICS_GROUPS,
    'gics_industry': GICS_INDUSTRY,
    'gics_subindustry': GICS_SUB_INDUSTRY,
}
