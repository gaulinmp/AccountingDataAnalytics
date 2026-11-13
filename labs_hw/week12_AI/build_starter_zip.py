"""Zip the Lab 12 starter folder for students.

    uv run python labs_hw/week12_AI/build_starter_zip.py

Writes comp-dashboard-starter.zip next to this script, from the folder of the same name.
Re-run after editing anything in the folder, then commit both. The zip is
byte-for-byte reproducible (sorted entries, fixed timestamps), so re-running
without changes leaves git clean.

sec_companies.csv in that folder is built separately (from the 10-K cache via
pyedgar) with these columns:

    cik,name,accession,sic,revenue,ticker

where revenue is the latest annual revenue in USD (not millions) and accession
is the 10-K filing it came from. Students' tools use it to pick same-industry
peers of similar size.
"""

import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
STARTER = HERE / "comp-dashboard-starter"
ZIP_PATH = STARTER.with_suffix(".zip")
CSV_PATH = STARTER / "sec_companies.csv"

# Never shipped to students: per-machine junk and anything their own run creates.
ZIP_SKIP = {".DS_Store", ".env", "uv.lock", "SPEC.md"}
ZIP_SKIP_DIRS = {"cache", ".venv", "__pycache__"}

files = sorted(
    p
    for p in STARTER.rglob("*")
    if p.is_file() and p.name not in ZIP_SKIP and not ZIP_SKIP_DIRS.intersection(p.relative_to(STARTER).parts)
)
with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as z:
    for p in files:
        # Fixed timestamp and permissions so the zip only changes when a file does.
        info = zipfile.ZipInfo(f"{STARTER.name}/{p.relative_to(STARTER).as_posix()}", (2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o644 << 16
        z.writestr(info, p.read_bytes())
print(f"Wrote {ZIP_PATH.name}: {len(files)} files, {ZIP_PATH.stat().st_size / 1024:.0f} KB")

n = len(CSV_PATH.read_text(encoding="utf-8").splitlines()) - 1 if CSV_PATH.exists() else 0
if n < 1000:
    print(f"WARNING: sec_companies.csv has {n} companies, so it is missing or still the placeholder.")
