#!/usr/bin/env python
"""data/curry.json: Stephen Curry regular-season three-point line by season.

Source: PlayerCareerStats, player id 201939, SeasonTotalsRegularSeason.
age = season end year - 1988 (born March 14, 1988), as the PRD specifies.
"""
from __future__ import annotations

import sys
from typing import Any, Dict, List

from nba_api.stats.endpoints import PlayerCareerStats

from common import (HEADERS, TIMEOUT, endpoint_url, fetch_cached, log, now_iso,
                    result_set, season_end_year, write_json)

PLAYER_ID = 201939
BIRTH_YEAR = 1988
ENDPOINT = "playercareerstats"
PARAMS = {"LeagueID": "00", "PerMode": "Totals", "PlayerID": PLAYER_ID}


def fetch() -> Dict[str, Any]:
    return PlayerCareerStats(player_id=PLAYER_ID, per_mode36="Totals", headers=HEADERS, timeout=TIMEOUT).get_dict()


def main(argv: List[str]) -> int:
    log("curry career stats")
    payload = fetch_cached("curry_career", fetch)
    rs = result_set(payload, "SeasonTotalsRegularSeason")
    cols = rs["headers"]
    url = endpoint_url(ENDPOINT, PARAMS)
    pulled = now_iso()
    rows: List[Dict[str, Any]] = []
    for r in rs["rowSet"]:
        rec = dict(zip(cols, r))
        if rec.get("TEAM_ABBREVIATION") == "TOT":
            continue  # multi-team split rows; Curry has none, but keep the file honest
        season = rec["SEASON_ID"]
        gp, fg3m, fg3a = int(rec["GP"]), int(rec["FG3M"]), int(rec["FG3A"])
        rows.append({
            "season": season,
            "gp": gp,
            "fg3m": fg3m,
            "fg3a": fg3a,
            "fg3m_per_game": round(fg3m / gp, 2) if gp else None,
            "fg3_pct": round(100.0 * fg3m / fg3a, 1) if fg3a else None,
            "age": season_end_year(season) - BIRTH_YEAR,
            "source_url": url,
            "pulled_at": pulled,
        })
    rows.sort(key=lambda x: x["season"])
    write_json("curry.json", rows)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
