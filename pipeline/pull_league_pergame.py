#!/usr/bin/env python
"""data/league.json: league per-team-game averages per season.

Source: LeagueDashTeamStats (PerGame; MeasureType Base for FGA/3PA/3PM,
Advanced for PACE), Regular Season, one call per measure per season.

Averages are across the league's teams weighted by games played, i.e. league
totals divided by team-games. With a full 82-game slate this equals the simple
mean of the team per-game values; in 2019-20 (64-75 GP) it is the correct one.
fg3_pct = league 3PM / league 3PA x100 (not the mean of team percentages).
fg3a_rate = fg3a / fga x100.
"""
from __future__ import annotations

import sys
import time
from typing import Any, Dict, List, Optional

from nba_api.stats.endpoints import LeagueDashTeamStats

from common import (HEADERS, SLEEP_BETWEEN_SEASONS, TIMEOUT, endpoint_url, fetch_cached,
                    log, now_iso, parse_season_args, result_set, write_json)

ENDPOINT = "leaguedashteamstats"


def params_for(season: str, measure: str) -> Dict[str, Any]:
    return {
        "LastNGames": 0, "LeagueID": "00", "MeasureType": measure, "Month": 0, "OpponentTeamID": 0,
        "PaceAdjust": "N", "PerMode": "PerGame", "Period": 0, "PlusMinus": "N", "Rank": "N",
        "Season": season, "SeasonType": "Regular Season", "TeamID": 0,
    }


def fetch(season: str, measure: str) -> Dict[str, Any]:
    ep = LeagueDashTeamStats(
        season=season, per_mode_detailed="PerGame", measure_type_detailed_defense=measure,
        season_type_all_star="Regular Season", headers=HEADERS, timeout=TIMEOUT,
    )
    return ep.get_dict()


def weighted_mean(rows: List[List[Any]], cols: List[str], field: str) -> Optional[float]:
    gp_i, f_i = cols.index("GP"), cols.index(field)
    num = den = 0.0
    for r in rows:
        gp = float(r[gp_i] or 0)
        val = r[f_i]
        if val is None:
            continue
        num += float(val) * gp
        den += gp
    return num / den if den else None


def main(argv: List[str]) -> int:
    out: List[Dict[str, Any]] = []
    for n, season in enumerate(parse_season_args(argv)):
        if n:
            time.sleep(SLEEP_BETWEEN_SEASONS)
        log("league per game %s (Base)" % season)
        base = result_set(fetch_cached("teamstats_base_%s" % season, lambda: fetch(season, "Base")), "LeagueDashTeamStats")
        cols, rows = base["headers"], base["rowSet"]
        if not rows:
            raise ValueError("%s: no team rows" % season)
        fga = weighted_mean(rows, cols, "FGA")
        fg3a = weighted_mean(rows, cols, "FG3A")
        fg3m = weighted_mean(rows, cols, "FG3M")
        pace: Optional[float] = None
        time.sleep(SLEEP_BETWEEN_SEASONS)
        log("league per game %s (Advanced)" % season)
        try:
            adv = result_set(fetch_cached("teamstats_adv_%s" % season, lambda: fetch(season, "Advanced")), "LeagueDashTeamStats")
            pace = weighted_mean(adv["rowSet"], adv["headers"], "PACE")
        except Exception as exc:  # noqa: BLE001 - pace is optional per the data spec
            log("  pace unavailable for %s: %s" % (season, exc))
        out.append({
            "season": season,
            "teams": len(rows),
            "fga": round(fga, 2),
            "fg3a": round(fg3a, 2),
            "fg3m": round(fg3m, 2),
            "fg3_pct": round(100.0 * fg3m / fg3a, 2) if fg3a else None,
            "fg3a_rate": round(100.0 * fg3a / fga, 2) if fga else None,
            "pace": round(pace, 2) if pace is not None else None,
            "source_url": endpoint_url(ENDPOINT, params_for(season, "Base")),
            "pace_source_url": endpoint_url(ENDPOINT, params_for(season, "Advanced")) if pace is not None else None,
            "pulled_at": now_iso(),
        })
    write_json("league.json", out)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
