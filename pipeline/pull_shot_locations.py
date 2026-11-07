#!/usr/bin/env python
"""data/shot_buckets.json: league shot usage by NBA.com 8ft-range bucket per season.

Source: LeagueDashTeamShotLocations (distance_range='8ft Range', Regular
Season, Totals), one call per season 1996-97 .. 2025-26. These are the exact
buckets NBA Miner wrapped for the 2016 paper.

usage_pct = sum over teams of FGA in the bucket / sum over teams of FGA
            across the five buckets, x100, per season.
"""
from __future__ import annotations

import re
import sys
import time
from typing import Any, Dict, List

from nba_api.stats.endpoints import LeagueDashTeamShotLocations

from common import (HEADERS, SLEEP_BETWEEN_SEASONS, TIMEOUT, endpoint_url, fetch_cached,
                    log, now_iso, parse_season_args, result_set, write_json)

ENDPOINT = "leaguedashteamshotlocations"
BUCKET_KEYS = {
    "lessthan8ft": "lt8",
    "816ft": "8_16",
    "1624ft": "16_24",
    "24ft": "24plus",
    "backcourtshot": "backcourt",
    "backcourt": "backcourt",
}
BUCKET_ORDER = ["lt8", "8_16", "16_24", "24plus", "backcourt"]


def normalize_label(label: str) -> str:
    key = re.sub(r"[^a-z0-9]", "", label.lower())
    if key not in BUCKET_KEYS:
        raise KeyError("unexpected shot-location bucket label %r" % label)
    return BUCKET_KEYS[key]


def params_for(season: str) -> Dict[str, Any]:
    # Mirrors the parameters nba_api sends for this endpoint (defaults spelled out
    # so the source_url is a complete, reproducible request).
    return {
        "DistanceRange": "8ft Range", "LastNGames": 0, "LeagueID": "00", "MeasureType": "Base",
        "Month": 0, "OpponentTeamID": 0, "PaceAdjust": "N", "PerMode": "Totals", "Period": 0,
        "PlusMinus": "N", "Rank": "N", "Season": season, "SeasonType": "Regular Season", "TeamID": 0,
    }


def fetch_season(season: str) -> Dict[str, Any]:
    ep = LeagueDashTeamShotLocations(
        season=season, distance_range="8ft Range", season_type_all_star="Regular Season",
        per_mode_detailed="Totals", headers=HEADERS, timeout=TIMEOUT,
    )
    return ep.get_dict()


def parse_season(season: str, payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    rs = result_set(payload)
    hdrs = rs["headers"]
    # Two header levels: [0] = shot categories spanning N columns each, [1] = flat column names.
    cat_hdr = next(h for h in hdrs if h.get("name") == "SHOT_CATEGORY")
    col_hdr = next(h for h in hdrs if h.get("name") == "columns")
    skip = int(cat_hdr.get("columnsToSkip", 0))
    span = int(cat_hdr.get("columnSpan", 1))
    categories = cat_hdr["columnNames"]
    columns = col_hdr["columnNames"]
    totals: Dict[str, Dict[str, float]] = {}
    for i, label in enumerate(categories):
        key = normalize_label(label)
        base = skip + i * span
        sub = columns[base: base + span]
        fgm_i = base + sub.index("FGM")
        fga_i = base + sub.index("FGA")
        fgm = sum(float(r[fgm_i] or 0) for r in rs["rowSet"])
        fga = sum(float(r[fga_i] or 0) for r in rs["rowSet"])
        totals[key] = {"fgm": fgm, "fga": fga, "label": label}
    missing = [k for k in BUCKET_ORDER if k not in totals]
    if missing:
        raise ValueError("%s: endpoint did not return buckets %s" % (season, missing))
    all_fga = sum(v["fga"] for v in totals.values())
    if all_fga <= 0:
        raise ValueError("%s: zero FGA returned" % season)
    url = endpoint_url(ENDPOINT, params_for(season))
    pulled = now_iso()
    rows = []
    for key in BUCKET_ORDER:
        v = totals[key]
        rows.append({
            "season": season,
            "bucket": key,
            "bucket_label": v["label"],
            "fga": int(v["fga"]),
            "fgm": int(v["fgm"]),
            "usage_pct": round(100.0 * v["fga"] / all_fga, 3),
            "teams": len(rs["rowSet"]),
            "source_url": url,
            "pulled_at": pulled,
        })
    return rows


def main(argv: List[str]) -> int:
    rows: List[Dict[str, Any]] = []
    for n, season in enumerate(parse_season_args(argv)):
        if n:
            time.sleep(SLEEP_BETWEEN_SEASONS)
        log("shot locations %s" % season)
        payload = fetch_cached("shotloc_%s" % season, lambda: fetch_season(season))
        rows.extend(parse_season(season, payload))
    write_json("shot_buckets.json", rows)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
