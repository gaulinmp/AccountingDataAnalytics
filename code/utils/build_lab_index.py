"""Build the placeholder GitHub Pages site: tracked labs_hw/ HTML plus an index.

Stand-in for the Astro site (parked in .github/workflows/deploy-astro.yml).
Copies every git-tracked labs_hw/**/*.html into OUT_DIR at the same relative
path and writes OUT_DIR/index.html linking to them, grouped by folder. Using
git ls-files means ignored files (solution HTML, scratch output) never ship.

    uv run python code/utils/build_lab_index.py [OUT_DIR] [--week N]

OUT_DIR defaults to _site. --week N leaves out weekK_* folders with K > N, so
labs can be released as the semester goes; project folders are always included.
"""

import argparse
import html
import re
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

parser = argparse.ArgumentParser(description="Build the lab-index Pages site.")
parser.add_argument("out_dir", nargs="?", type=Path, default=ROOT / "_site", help="output folder (default: _site)")
parser.add_argument("--week", type=int, help="include week folders only up to this week number", default=8)
args = parser.parse_args()
OUT = args.out_dir


def folder_key(folder):
    """Weeks in numeric order, then projects, then anything else."""
    m = re.match(r"(week|project)(\d+)", folder)
    if not m:
        return (2, 0, folder)
    return (0 if m[1] == "week" else 1, int(m[2]), folder)


def folder_label(folder):
    m = re.match(r"(week|project)(\d+)_?(.*)", folder)
    if not m:
        return folder
    topic = m[3].replace("_", " ").replace("-", " ")
    return f"{m[1].title()} {m[2]}" + (f": {topic}" if topic else "")


def is_handout(name):
    return re.match(r"(Lab|Homework)-\d+_Instructions|Project\d", Path(name).stem) is not None


def file_label(name):
    """Handouts get a fixed label (their <title> is just "Instructions");
    tools use their <title>, falling back to the file name."""
    stem = Path(name).stem
    m = re.match(r"(Lab|Homework)-(\d+)_Instructions", stem)
    if m:
        return f"{m[1]} {m[2]} instructions"
    if is_handout(name):
        return "Project instructions"
    t = re.search(r"<title>([^<]+)</title>", (ROOT / name).read_text(encoding="utf-8", errors="ignore"))
    return t[1].strip() if t else stem.replace("_", " ").replace("-", " ")


files = subprocess.run(
    ["git", "ls-files", "labs_hw/*.html"], cwd=ROOT, capture_output=True, text=True, check=True
).stdout.split()

groups = {}
for f in files:
    rel = Path(f).relative_to("labs_hw")
    if len(rel.parts) < 2:
        continue  # skip loose files at the labs_hw/ root
    wk = re.match(r"week(\d+)_", rel.parts[0])
    if args.week is not None and wk and int(wk[1]) > args.week:
        continue  # not released yet
    dest = OUT / f
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / f, dest)
    groups.setdefault(rel.parts[0], []).append(f)

sections = []
for folder in sorted(groups, key=folder_key):
    # Handouts first, then tools alphabetically.
    items = sorted(groups[folder], key=lambda f: (not is_handout(f), f))
    links = "\n".join(
        f'      <li><a href="{html.escape(f)}">{html.escape(file_label(f))}</a></li>' for f in items
    )
    sections.append(f"    <h2>{html.escape(folder_label(folder))}</h2>\n    <ul>\n{links}\n    </ul>")

page = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ACCTG 5150 Labs</title>
  <style>
    :root {{ color-scheme: light dark; --fg: #1f2328; --bg: #fff; --muted: #59636e; --link: #0969da; }}
    @media (prefers-color-scheme: dark) {{ :root {{ --fg: #e6edf3; --bg: #0d1117; --muted: #9198a1; --link: #4493f8; }} }}
    body {{ font: 16px/1.5 system-ui, sans-serif; color: var(--fg); background: var(--bg);
           max-width: 44rem; margin: 2rem auto; padding: 0 16px; }}
    h1 {{ margin-bottom: 0.25rem; }}
    p {{ color: var(--muted); margin-top: 0; }}
    h2 {{ font-size: 1.1rem; margin: 1.75rem 0 0.25rem; }}
    ul {{ margin: 0; padding-left: 1.25rem; }}
    a {{ color: var(--link); }}
  </style>
</head>
<body>
  <main>
    <h1>ACCTG 5150 Accounting Analytics</h1>
    <p>Lab instructions, project handouts, and tools.</p>
{chr(10).join(sections)}
  </main>
</body>
</html>
"""
OUT.mkdir(parents=True, exist_ok=True)
(OUT / "index.html").write_text(page, encoding="utf-8")
print(f"Wrote {OUT / 'index.html'} ({sum(map(len, groups.values()))} files)")
