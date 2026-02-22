#!/usr/bin/env python
# -*- coding: utf-8 -*-
# pylint: disable=W1203

# STDlib imports
import os
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


class CRSP(_DataFrameCache):
    """
    Read Compustat data from cache if it exists,
    or read from WRDS Postrgres server, and write out to
    `interim` cache folder.
    """
    # Arguments passed to _pd.read_csv
    file_format = "csv"
    read_args = {"compression": 'gzip', "parse_dates": ["date"]}
    override_directory = DATA_DIR

    def make_dataset(self):
        # Build sub-queries
        good_gvkeys = "SELECT DISTINCT gvkey FROM comp.fundq WHERE atq IS NOT NULL AND rdq IS NOT NULL AND prccq IS NOT NULL"

        good_permnos = f"SELECT DISTINCT lpermno FROM crsp.ccmxpf_lnkhist WHERE lpermno IS NOT NULL AND gvkey IN ({good_gvkeys})"
        
        # Ols SIZ format
        sql_dsf = f"""
            SELECT a.permno, ticker, shrcls, date, prc, vol, ret, bid, ask, shrout
            FROM crsp.dsf AS a
            LEFT JOIN crsp.stocknames AS b
                ON a.permno = b.permno
                AND a.date BETWEEN COALESCE(b.namedt, '1900-01-01') AND COALESCE(b.nameenddt, current_date)
            WHERE EXTRACT(year from date) >= 1995
                AND a.permno IN ({good_permnos})
        """

        sql_dsf = f"""
        SELECT permno, ticker, dlycaldt AS date,
            dlyret AS ret, dlyprc AS prc, shrout,
            dlyvol AS vol, dlybid AS bid, dlyask AS ask
        FROM crspq.dsf_v2
        WHERE ShareType = 'NS' 
            AND SecurityType = 'EQTY' 
            AND SecuritySubType = 'COM' 
            AND USIncFlg = 'Y' 
            AND IssuerType IN ('ACOR', 'CORP')
            AND primaryexch IN ('N','A', 'Q')
            AND permno IN ({good_permnos})
            AND yyyymmdd >= 19940601
        """

        with wrds_connection() as conn:
            df = conn.read_sql(sql_dsf, parse_dates=['date'])

        return df
