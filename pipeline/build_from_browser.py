#!/usr/bin/env python
"""Build data/*.json from stats tables read off www.nba.com/stats pages.

stats.nba.com's JSON API does not answer scripted clients on every network,
but the public stats pages render the same numbers as HTML tables. This
script converts the saved page tables in pipeline/browser/ into the three
data files, with the page URL as source_url. Same schema, same math as the
API pulls (pipeline/pull_*.py); validate.py runs on the result either way.

Inputs (written by hand or by a browsing agent, one file per season):
  pipeline/browser/shooting/<season>.txt     Teams > Shooting, 8ft Range, Totals
  pipeline/browser/traditional/<season>.txt  Teams > Traditional, Per Game
  pipeline/browser/advanced/<season>.txt     Teams > Advanced, Per Game (pace; optional)
  pipeline/browser/curry_totals.txt          Player 201939 career, Totals
Each file starts with '# source: <url>' and '# read: <iso>' then the table text.
"""
from __future__ import annotations

import glob
import os
import re
import sys
from typing import Dict, List, Optional, Tuple

from common import DATA_DIR, ROOT, log, season_end_year, write_json

BROWSER_DIR = os.path.join(ROOT, "pipeline", "browser")
BUCKETS = ["lt8", "8_16", "16_24", "24plus", "backcourt"]
NUM = re.compile(r"^-?(\d{1,3}(,\d{3})+|\d+)?(\.\d+)?$")


def num(t: str) -> float:
    return float(t.replace(",", ""))


def read_table(path: str) -> Tuple[str, str, List[str]]:
    src = read = ""
    lines: List[str] = []
    with open(path) as fh:
        for raw in fh:
            line = raw.rstrip("\n")
            if line.startswith("# source:"):
                src = line.split(":", 1)[1].strip()
            elif line.startswith("# read:"):
                read = line.split(":", 1)[1].strip()
            elif line.strip():
                lines.append(line.strip())
    if not src or not read:
        raise ValueError("%s: missing '# source:' or '# read:' header" % path)
    return src, read, lines


def split_row(line: str) -> Tuple[str, List[float]]:
    """'1 Golden State Warriors 82 73 ...' -> ('Golden State Warriors', [82, 73, ...])."""
    toks = line.split()
    # drop a leading rank
    if len(toks) > 1 and NUM.match(toks[0]) and toks[0] and not NUM.match(toks[1]):
        toks = toks[1:]
    i = 0
    while i < len(toks) and not NUM.match(toks[i]):
        i += 1
    name = " ".join(toks[:i])
    nums = [num(t) for t in toks[i:] if NUM.match(t) and t not in ('', '-', '.')]
    return name, nums


def team_rows(lines: List[str]) -> List[Tuple[str, List[float]]]:
    rows = []
    for l in lines:
        if l.upper() == l and not any(ch.isdigit() for ch in l):
            continue  # header lines
        if l.startswith("TEAM ") or l.startswith("SEASON "):
            continue
        name, nums = split_row(l)
        if name and len(nums) >= 5:
            rows.append((name, nums))
    return rows


def season_from_path(p: str) -> str:
    return os.path.splitext(os.path.basename(p))[0]


def build_shot_buckets() -> List[Dict]:
    out: List[Dict] = []
    files = sorted(glob.glob(os.path.join(BROWSER_DIR, "shooting", "*.txt")))
    for p in files:
        season = season_from_path(p)
        src, read, lines = read_table(p)
        rows = team_rows(lines)
        if len(rows) < 28:
            raise ValueError("%s: only %d team rows" % (p, len(rows)))
        tot = {b: [0.0, 0.0] for b in BUCKETS}  # fgm, fga
        for name, nums in rows:
            if len(nums) < 15:
                raise ValueError("%s: short row for %s: %r" % (p, name, nums))
            for k, b in enumerate(BUCKETS):
                tot[b][0] += nums[k * 3]
                tot[b][1] += nums[k * 3 + 1]
        all_fga = sum(v[1] for v in tot.values())
        for b in BUCKETS:
            fgm, fga = tot[b]
            out.append({
                "season": season, "bucket": b, "fga": int(fga), "fgm": int(fgm),
                "usage_pct": round(fga / all_fga * 100, 3),
                "teams": len(rows), "source_url": src, "pulled_at": read,
            })
    out.sort(key=lambda r: (r["season"], BUCKETS.index(r["bucket"])))
    return out


def header_index(lines: List[str], must: str) -> List[str]:
    for l in lines:
        if l.startswith("TEAM ") and must in l:
            return l.replace("AST RATIO", "AST_RATIO").split()
    raise ValueError("header with %s not found" % must)


def build_league() -> List[Dict]:
    out: List[Dict] = []
    trad = sorted(glob.glob(os.path.join(BROWSER_DIR, "traditional", "*.txt")))
    for p in trad:
        season = season_from_path(p)
        src, read, lines = read_table(p)
        hdr = header_index(lines, "3PA")
        cols = hdr[1:]  # after TEAM
        rows = team_rows(lines)
        if len(rows) < 28:
            raise ValueError("%s: only %d team rows" % (p, len(rows)))
        gp_i, fga_i, fg3a_i, fg3m_i = cols.index("GP"), cols.index("FGA"), cols.index("3PA"), cols.index("3PM")
        # team-game weighted league averages: sum(per_game * gp) / sum(gp)
        gp = sum(n[gp_i] for _, n in rows)
        fga = sum(n[fga_i] * n[gp_i] for _, n in rows) / gp
        fg3a = sum(n[fg3a_i] * n[gp_i] for _, n in rows) / gp
        fg3m = sum(n[fg3m_i] * n[gp_i] for _, n in rows) / gp
        pace: Optional[float] = None
        pace_src = None
        ap = os.path.join(BROWSER_DIR, "advanced", season + ".txt")
        if os.path.exists(ap):
            asrc, _aread, alines = read_table(ap)
            ahdr = header_index(alines, "PACE")
            acols = ahdr[1:]
            arows = team_rows(alines)
            agp_i, apace_i = acols.index("GP"), acols.index("PACE")
            agp = sum(n[agp_i] for _, n in arows)
            if agp:
                pace = round(sum(n[apace_i] * n[agp_i] for _, n in arows) / agp, 2)
                pace_src = asrc
        out.append({
            "season": season, "fga": round(fga, 2), "fg3a": round(fg3a, 2), "fg3m": round(fg3m, 2),
            "fg3_pct": round(fg3m / fg3a * 100, 2), "fg3a_rate": round(fg3a / fga * 100, 2),
            "pace": pace, "teams": len(rows), "team_games": int(gp),
            "source_url": src, "pace_source_url": pace_src, "pulled_at": read,
        })
    out.sort(key=lambda r: r["season"])
    return out


def build_curry() -> List[Dict]:
    p = os.path.join(BROWSER_DIR, "curry_totals.txt")
    src, read, lines = read_table(p)
    hdr = next(l for l in lines if l.startswith("SEASON ")).split()
    cols = hdr[1:]
    out: List[Dict] = []
    for l in lines:
        m = re.match(r"^(\d{4}-\d{2}) (\w+) (.*)$", l)
        if not m:
            continue
        season, _team, rest = m.groups()
        nums = [float(t) for t in rest.split()]
        row = dict(zip(cols[1:], nums))  # cols[0] is TEAM
        end = season_end_year(season)
        if end > 2026:
            continue  # 2026-27 is in progress; the story ends on completed seasons
        gp = int(row["GP"]); fg3m = int(row["3PM"]); fg3a = int(row["3PA"])
        out.append({
            "season": season, "gp": gp, "fg3m": fg3m, "fg3a": fg3a,
            "fg3m_per_game": round(fg3m / gp, 2) if gp else 0.0,
            "age": end - 1988, "source_url": src, "pulled_at": read,
        })
    out.sort(key=lambda r: r["season"])
    return out


def main() -> int:
    which = sys.argv[1:] or ["shot_buckets", "league", "curry"]
    if "shot_buckets" in which:
        write_json("shot_buckets.json", build_shot_buckets())
    if "league" in which:
        write_json("league.json", build_league())
    if "curry" in which:
        write_json("curry.json", build_curry())
    log("data dir: %s" % os.path.relpath(DATA_DIR, ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
