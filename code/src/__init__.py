#!/usr/bin/env python
# -*- coding: utf-8 -*-

# STDlib imports
import os
from pathlib import Path
import logging

# 3rd party package imports
import numpy as np
import pandas as pd
from urllib.parse import quote_plus
import sqlalchemy as sa
from sqlalchemy.exc import DBAPIError
try:
    import psycopg
    PSYCOPG = "psycopg"
except ImportError:
    PSYCOPG = "psycopg2"

# project imports
for pwd_path in ("~/Dropbox/Documents/Personal/config/wrds.pwd", "~/wrds.pwd"):
    try:
        with open(os.path.expanduser(pwd_path), "r", encoding="utf-8") as fh:
            wrds_user, wrds_password = fh.read().strip().split("\n")
            os.environ["WRDS_USER"] = wrds_user
            os.environ["WRDS_PASSWORD"] = wrds_password
    except FileNotFoundError:
        continue

# project imports
ROOT_DIR = Path('.').absolute()
for i in range(10):
    if len({'code', 'data'} & set(os.listdir(ROOT_DIR))) == 2:
        break
    ROOT_DIR = ROOT_DIR.parent
else:
    raise RuntimeError('Cannot find root directory!')

CODE_DIR = ROOT_DIR / "code"
DATA_DIR = ROOT_DIR / "data"
LAB_DIR = ROOT_DIR / "labs_hw"
SLIDE_DIR = ROOT_DIR / "slides"

# Local logger
_logger = logging.getLogger(__name__)


def string_to_int(x):
    """convert cik and gvkey to integers (ignoring nan and None)"""
    try:
        return int(x)
    except ValueError:
        return np.nan


class wrds_connection(object):
    db_url = "wrds-pgdata.wharton.upenn.edu"
    db_port = 9737
    db_table = "wrds"
    db_conargs = {"sslmode": "require", "application_name": "win32 python 3.10.0/wrds 3.2.0"}

    engine = None
    connection = None

    def __init__(self, wrds_user=None, wrds_password=None):
        self._usr = wrds_user or os.environ.get("WRDS_USER", None)
        self._pass = wrds_password or os.environ.get("WRDS_PASSWORD", None)
        if self._usr is None or self._pass is None:
            raise ValueError("Please set WRDS_USER and WRDS_PASSWORD environment variables.")
        # [DB_FLAVOR]+[DB_PYTHON_LIBRARY]://[USERNAME]:[PASSWORD]@[DB_HOST]:[PORT]/[DB_NAME]
        self._url = (
            f"postgresql+{PSYCOPG}://{self._usr}:{quote_plus(self._pass)}@{self.db_url}:{self.db_port}/{self.db_table}"
        )

    def __enter__(self):
        self.engine = sa.create_engine(self._url, isolation_level="AUTOCOMMIT", connect_args=self.db_conargs)
        self.connection = self.engine.connect()
        _logger.debug(f"Connected to {self.engine}")
        return self

    def __exit__(self, *args, **kwargs):
        self.connection.close()
        self.engine.dispose()
        self.engine = None

    def read_sql(self, sql_statement, *args, chunksize=500000, **kwargs):
        # could also be self.engine? Maybe this doesn't work anymore?
        if isinstance(sql_statement, str):
            sql_statement = sa.text(sql_statement)
            _logger.debug(f"Executing SQL: {sql_statement}")
        try:
            df = pd.read_sql_query(sql_statement, self.connection, *args, chunksize=chunksize, **kwargs)
            _logger.debug(f"SQL query executed successfully, retrieved {df}.")
            if chunksize is None:
                return df
            else:
                try:
                    _logger.debug(f"Returning {len(df)} chunks of {len(df[0])} rows.")
                except Exception:
                    _logger.debug(f"Returning chunks: {df}.")
                return pd.concat(df)
        except DBAPIError as e:
            _logger.error(f"Error: {e}")
            raise
