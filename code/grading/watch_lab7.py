"""Watch the Desktop for new Lab 7 output files and check them against the solution.

Run:   uv run python code/grading/watch_lab7.py            # watch ~/Desktop
       uv run python code/grading/watch_lab7.py FILE ...   # check specific files once

On startup, everything already on the Desktop is ignored. Any .csv/.xlsx that shows
up (or is re-saved) afterward gets compared column-by-column to lab7_solution.csv.
"""

import re
import sys
import time
from pathlib import Path

import pandas as pd

WATCH_DIR = Path.home() / "Desktop"
SOLUTION = (Path(__file__).resolve().parents[2]
            / "labs_hw" / "week7_unstructured-review" / "lab7_solution.csv")
EXTENSIONS = {".csv", ".xlsx", ".xlsm"}
POLL_SECONDS = 1.0
N_EXAMPLES = 3

GRADED = ["Invoice_Number", "Contact_Name", "Follow_Up_Date", "Clean_Notes"]
EMPTY = {"", "nan", "none", "nat", "#n/a", "#value!", "#calc!", "#name?", "#ref!", "#num!"}


def norm_col(name):
    """Case-insensitive, with spaces and underscores interchangeable."""
    return str(name).strip().lower().replace(" ", "_")


def norm_val(v):
    """Turn a cell into a comparable string; Excel errors and blanks become ''."""
    if v is None or (pd.api.types.is_scalar(v) and pd.isna(v)):  # NaN, NaT, None
        return ""
    if isinstance(v, pd.Timestamp) or hasattr(v, "strftime"):
        return v.strftime("%Y-%m-%d")
    s = str(v).replace("\r\n", "\n").replace("_x000D_", "").strip()
    if s.lower() in EMPTY:
        return ""
    # "2022-03-11 00:00:00" from a date-typed cell
    m = re.fullmatch(r"(\d{4}-\d{2}-\d{2})[ T]00:00:00", s)
    return m.group(1) if m else s


def row_key(v):
    """Whitespace-insensitive key for aligning rows on the raw notes text."""
    return re.sub(r"\s+", " ", norm_val(v))


def with_line_prefix(expected, notes):
    """Prefix the expected value with its label from the raw notes line, e.g. '[Rep:] Smeagol G.'.

    Finds the value (or failing that, its first word) in the notes and takes everything
    from the start of that line up to it.
    """
    if not expected:
        return expected
    notes = notes.replace("\r\n", "\n")
    pos = notes.find(expected)
    if pos == -1:
        pos = notes.find(expected.split()[0])
    if pos == -1:
        return expected
    prefix = notes[notes.rfind("\n", 0, pos) + 1:pos].strip()
    return f"[{prefix}] {expected}" if prefix else expected


def read_any(path):
    if path.suffix.lower() == ".csv":
        return pd.read_csv(path, dtype=str, keep_default_na=False, encoding_errors="replace")
    return pd.read_excel(path)  # first sheet


def find_columns(df):
    """Map each graded column to the student's column (or None).

    Tries, in order: exact name, norm_col match, then any unclaimed column whose
    name contains the target's first word (e.g. "follow" finds "Follow-up").
    """
    by_norm = {norm_col(c): c for c in df.columns}

    def lookup(name):
        return name if name in df.columns else by_norm.get(norm_col(name))

    raw_notes = lookup("notes")
    mapping = {target: lookup(target) for target in GRADED}
    # First-word fallback runs after all exact matches so it can't steal a column.
    used = {raw_notes, *mapping.values()}
    for target, col in mapping.items():
        if col is None:
            word = norm_col(target).split("_")[0]
            col = next((c for c in df.columns if c not in used and word in norm_col(c)), None)
            mapping[target] = col
            used.add(col)
    return raw_notes, mapping


def align(sol, df, raw_notes):
    """Return the student's rows in solution order (by notes text if possible)."""
    if raw_notes is not None:
        keys = df[raw_notes].map(row_key)
        if keys.is_unique:
            aligned = df.set_index(keys).reindex(sol["notes"].map(row_key))
            n_found = aligned.index.isin(keys).sum()
            if n_found >= len(sol) * 0.9:
                return aligned.reset_index(drop=True), f"by notes text ({n_found}/{len(sol)} rows found)"
    return df.reset_index(drop=True), "by row position"


def check(path, sol):
    print("\n" + "=" * 78)
    print(f"{path.name}   ({time.strftime('%H:%M:%S')})")
    print("=" * 78)
    try:
        df = read_any(path)
    except Exception as e:
        print(f"  Could not read file: {e}")
        return

    print(f"  Rows: {len(df)} (solution {len(sol)})   Columns: {list(df.columns)}")
    raw_notes, mapping = find_columns(df)
    df, how = align(sol, df, raw_notes)
    print(f"  Aligned {how}")

    print(f"\n  {'Column':<16} {'Using':<22} {'Filled':>13} {'Exact match':>16}")
    print(f"  {'-' * 16} {'-' * 22} {'-' * 13} {'-' * 16}")
    problems = []
    pct_right = {}
    for target in GRADED:
        exp = sol[target].map(norm_val)
        n_exp = (exp != "").sum()
        col = mapping[target]
        if col is None:
            print(f"  {target:<16} {'(not found)':<22} {'-':>13} {'-':>16}")
            continue
        got = df[col].map(norm_val) if col in df else pd.Series([""] * len(df))
        got = got.reindex(range(len(sol)), fill_value="")
        n_got = (got != "").sum()
        # Count matches over rows the solution fills, plus spurious fills where it's blank.
        ok = ((got == exp) & (exp != "")).sum()
        pct_right[target] = ok / n_exp
        extra = ((got != "") & (exp == "")).sum()
        flag = "" if ok == n_exp and extra == 0 else "  <--"
        print(f"  {target:<16} {str(col)[:22]:<22} {f'{n_got}/{n_exp}':>13} "
              f"{f'{ok}/{n_exp} ({ok / n_exp:.0%})':>16}{flag}")
        if extra:
            print(f"  {'':<16} {'':<22} {extra} filled where solution is blank")
        bad = (got != exp)
        if bad.any():
            problems.append((target, [(i, got[i], exp[i]) for i in bad[bad].index[:N_EXAMPLES]]))

    score = 1 + sum(pct_right.values())  # missing columns count as 0%
    print("\n  SCORE: 1 + sum(% right) = 1 + "
          + " + ".join(f"{pct_right.get(t, 0):.2f}" for t in GRADED)
          + f" = {score:.2f} / {1 + len(GRADED)}")

    for target, rows in problems:
        print(f"\n  {target} mismatches (first {len(rows)}):")
        for i, g, e in rows:
            print(f"    row {i + 2:>4}: got      {g[:70]!r}")
            print(f"              expected {with_line_prefix(e, sol['notes'][i])[:70]!r}")


def snapshot(folder):
    return {p: p.stat().st_mtime for p in folder.iterdir()
            if p.is_file() and p.suffix.lower() in EXTENSIONS and not p.name.startswith("~$")}


def wait_until_stable(path, tries=20):
    """Wait for downloads/saves to finish: size unchanged across two polls and readable."""
    last = -1
    for _ in range(tries):
        try:
            size = path.stat().st_size
            if size == last and size > 0:
                with open(path, "rb"):
                    return True
            last = size
        except (OSError, PermissionError):
            pass
        time.sleep(0.5)
    return False


def prompt_delete(path):
    """Block until Enter; delete the file unless the user types k. Returns True if deleted."""
    answer = input(f"\n  [Enter] delete {path.name}   [k + Enter] keep: ").strip().lower()
    if answer == "k":
        print("  Kept.")
        return False
    try:
        path.unlink()
        print("  Deleted.")
        return True
    except FileNotFoundError:
        print("  Already gone.")
        return True
    except PermissionError:
        print("  Could not delete (open in Excel?). Kept.")
        return False


def main():
    sol = pd.read_csv(SOLUTION, dtype=str, keep_default_na=False)

    if len(sys.argv) > 1:
        for f in sys.argv[1:]:
            check(Path(f), sol)
        return

    seen = snapshot(WATCH_DIR)
    print(f"Watching {WATCH_DIR} for new {'/'.join(sorted(EXTENSIONS))} files "
          f"(ignoring {len(seen)} already there). Ctrl-C to stop.")
    try:
        while True:
            time.sleep(POLL_SECONDS)
            current = snapshot(WATCH_DIR)
            for path, mtime in list(current.items()):  # copy: we may delete as we go
                if seen.get(path) != mtime and wait_until_stable(path):
                    try:
                        check(path, sol)
                    except Exception as e:  # keep watching even if one file is odd
                        print(f"  Error checking {path.name}: {e!r}")
                    if prompt_delete(path):
                        current.pop(path, None)
                    else:
                        current[path] = path.stat().st_mtime
            seen = current
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
