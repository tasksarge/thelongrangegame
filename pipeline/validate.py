#!/usr/bin/env python
"""The seven validation tests from PRD section 5. Exit 1 on any failure.

1. For every season, the five bucket shares sum to 100 +/- 0.2.
2. 24+ ft usage in 1997-98 within [15, 17]; in 2015-16 within [27.5, 29.5].
3. 3PA per game in 2015-16 within [23.6, 24.6]; in 2024-25 within [37.1, 38.1].
4. 3PM per game in 1997-98 within [4.2, 4.8]; in 2015-16 within [8.0, 9.0].
   (The PRD's band was [4.6, 5.6], read off the paper's Figure 1-2 start point of about 5.1.
   NBA.com has 4.40 for 1997-98 = 12.71 attempts x 34.6%, so the paper's 1998 start does not
   reproduce; the 2016 end does. The test asserts the NBA.com value and the page says so.)
5. Curry 2015-16: fg3m = 402, gp = 79.
6. Every row in every data file has a non-empty source_url and an ISO pulled_at.
7. The latest season in league.json matches the latest in shot_buckets.json.
"""
from __future__ import annotations

import json
import os
import re
import sys
from collections import defaultdict
from typing import Any, Dict, List, Optional, Tuple

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
CONST_DIR = os.path.join(ROOT, "pipeline", "constants")
DATA_FILES = ["shot_buckets.json", "league.json", "curry.json"]
ISO_RE = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$")

Result = Tuple[str, str, bool, str]  # (id, name, passed, detail)


def load(name: str) -> Optional[List[Dict[str, Any]]]:
    path = os.path.join(DATA_DIR, name)
    if not os.path.exists(path):
        return None
    with open(path) as fh:
        return json.load(fh)


def in_band(val: Optional[float], lo: float, hi: float) -> bool:
    return val is not None and lo <= val <= hi


def fmt(val: Optional[float]) -> str:
    return "missing" if val is None else "%.2f" % val


def main() -> int:
    buckets = load("shot_buckets.json")
    league = load("league.json")
    curry = load("curry.json")
    results: List[Result] = []

    # --- 1. bucket shares sum to 100 +/- 0.2 -------------------------------
    if buckets is None:
        results.append(("1", "Bucket shares sum to 100 +/- 0.2 per season", False, "data/shot_buckets.json missing"))
    else:
        sums: Dict[str, float] = defaultdict(float)
        counts: Dict[str, int] = defaultdict(int)
        for r in buckets:
            sums[r["season"]] += float(r["usage_pct"])
            counts[r["season"]] += 1
        bad = ["%s=%.2f(n=%d)" % (s, v, counts[s]) for s, v in sorted(sums.items()) if abs(v - 100) > 0.2 or counts[s] != 5]
        results.append(("1", "Bucket shares sum to 100 +/- 0.2 per season", not bad and bool(sums),
                        "%d seasons ok" % len(sums) if not bad else "off: " + ", ".join(bad[:6])))

    # --- 2. 24+ ft usage anchors -------------------------------------------
    def usage(season: str) -> Optional[float]:
        if buckets is None:
            return None
        for r in buckets:
            if r["season"] == season and r["bucket"] == "24plus":
                return float(r["usage_pct"])
        return None

    u98, u16 = usage("1997-98"), usage("2015-16")
    results.append(("2", "24+ ft usage: 1997-98 in [15,17], 2015-16 in [27.5,29.5]",
                    in_band(u98, 15, 17) and in_band(u16, 27.5, 29.5),
                    "1997-98=%s 2015-16=%s" % (fmt(u98), fmt(u16))))

    # --- 3 & 4. league per game anchors ------------------------------------
    def lg(season: str, field: str) -> Optional[float]:
        if league is None:
            return None
        for r in league:
            if r["season"] == season:
                return None if r.get(field) is None else float(r[field])
        return None

    a16, a25 = lg("2015-16", "fg3a"), lg("2024-25", "fg3a")
    results.append(("3", "3PA/game: 2015-16 in [23.6,24.6], 2024-25 in [37.1,38.1]",
                    in_band(a16, 23.6, 24.6) and in_band(a25, 37.1, 38.1),
                    "2015-16=%s 2024-25=%s" % (fmt(a16), fmt(a25))))
    m98, m16 = lg("1997-98", "fg3m"), lg("2015-16", "fg3m")
    results.append(("4", "3PM/game: 1997-98 in [4.2,4.8] (paper drew ~5.1), 2015-16 in [8.0,9.0]",
                    in_band(m98, 4.2, 4.8) and in_band(m16, 8.0, 9.0),
                    "1997-98=%s 2015-16=%s" % (fmt(m98), fmt(m16))))

    # --- 5. Curry 2015-16 ----------------------------------------------------
    c16 = next((r for r in (curry or []) if r["season"] == "2015-16"), None)
    results.append(("5", "Curry 2015-16: fg3m = 402, gp = 79",
                    c16 is not None and c16.get("fg3m") == 402 and c16.get("gp") == 79,
                    "missing" if c16 is None else "fg3m=%s gp=%s" % (c16.get("fg3m"), c16.get("gp"))))

    # --- 6. provenance on every row ----------------------------------------
    problems: List[str] = []
    checked = 0
    for name, rows in (("shot_buckets.json", buckets), ("league.json", league), ("curry.json", curry)):
        if rows is None:
            problems.append("%s missing" % name)
            continue
        for i, r in enumerate(rows):
            checked += 1
            if not str(r.get("source_url") or "").strip():
                problems.append("%s[%d] source_url" % (name, i))
            if not ISO_RE.match(str(r.get("pulled_at") or "")):
                problems.append("%s[%d] pulled_at" % (name, i))
    # Constants are hand-entered; they carry source_url but no pull timestamp.
    if os.path.isdir(CONST_DIR):
        for name in sorted(os.listdir(CONST_DIR)):
            if not name.endswith(".json"):
                continue
            with open(os.path.join(CONST_DIR, name)) as fh:
                entries = json.load(fh)
            entries = entries if isinstance(entries, list) else entries.get("entries", [])
            for i, e in enumerate(entries):
                checked += 1
                if not str(e.get("source_url") or "").strip():
                    problems.append("constants/%s[%d] source_url" % (name, i))
    results.append(("6", "Every row has source_url and ISO pulled_at (constants: source_url)",
                    not problems and checked > 0,
                    "%d rows checked" % checked if not problems else "; ".join(problems[:5])))

    # --- 7. same latest season across data files ---------------------------
    lb = max((r["season"] for r in buckets), default=None) if buckets else None
    ll = max((r["season"] for r in league), default=None) if league else None
    results.append(("7", "Latest season in league.json == latest in shot_buckets.json",
                    lb is not None and lb == ll, "shot_buckets=%s league=%s" % (lb, ll)))

    # --- report ----------------------------------------------------------
    w = max(len(r[1]) for r in results)
    print("%-3s %-*s %-5s %s" % ("#", w, "test", "ok", "detail"))
    print("-" * (w + 40))
    for tid, name, ok, detail in results:
        print("%-3s %-*s %-5s %s" % (tid, w, name, "PASS" if ok else "FAIL", detail))
    failed = [r for r in results if not r[2]]
    print("-" * (w + 40))
    print("%d/%d passed" % (len(results) - len(failed), len(results)))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
