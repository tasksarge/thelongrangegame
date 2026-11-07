"""Shared helpers for the nba_api pulls.

Rules enforced here (PRD section 5):
  * browser headers on every stats.nba.com request
  * 1.5 s sleep between seasons
  * three retries with exponential backoff, 60 s timeout
  * every output row carries source_url and an ISO pulled_at
  * a failed pull never writes a partial data file
"""
from __future__ import annotations

import json
import os
import sys
import time
from datetime import datetime, timezone
from typing import Any, Callable, Dict, List, Optional
from urllib.parse import urlencode

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
RAW_DIR = os.path.join(ROOT, "pipeline", "raw")

FIRST_SEASON_START = 1996   # 1996-97: first season with NBA.com shot-location buckets
LAST_SEASON_START = 2025    # 2025-26: latest completed season as of 2026-11-07

SLEEP_BETWEEN_SEASONS = 1.5
RETRIES = 3
TIMEOUT = 60
STATS_BASE = "https://stats.nba.com/stats/"

# Browser headers recommended in the nba_api docs. Akamai in front of
# stats.nba.com drops or 403s requests without them.
HEADERS: Dict[str, str] = {
    "Host": "stats.nba.com",
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "x-nba-stats-origin": "stats",
    "x-nba-stats-token": "true",
    "Connection": "keep-alive",
    "Referer": "https://www.nba.com/",
    "Origin": "https://www.nba.com",
    "Pragma": "no-cache",
    "Cache-Control": "no-cache",
}


def season_label(start_year: int) -> str:
    """1996 -> '1996-97'."""
    return "%d-%02d" % (start_year, (start_year + 1) % 100)


def seasons(first: int = FIRST_SEASON_START, last: int = LAST_SEASON_START) -> List[str]:
    return [season_label(y) for y in range(first, last + 1)]


def season_end_year(season: str) -> int:
    return int(season[:4]) + 1


def now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def endpoint_url(endpoint: str, params: Dict[str, Any]) -> str:
    """The stats.nba.com URL the row traces to (used as source_url)."""
    return STATS_BASE + endpoint + "?" + urlencode(params)


def log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def with_retries(label: str, fn: Callable[[], Any]) -> Any:
    """Call fn() up to RETRIES+1 times with exponential backoff."""
    delay = 2.0
    last: Optional[BaseException] = None
    for attempt in range(1, RETRIES + 2):
        try:
            return fn()
        except Exception as exc:  # noqa: BLE001 - we want every network error
            last = exc
            log("  %s: attempt %d/%d failed: %s: %s" % (label, attempt, RETRIES + 1, type(exc).__name__, str(exc)[:160]))
            if attempt <= RETRIES:
                time.sleep(delay)
                delay *= 2
    raise RuntimeError("%s: gave up after %d attempts (%s: %s)" % (label, RETRIES + 1, type(last).__name__, last))


def raw_path(name: str) -> str:
    return os.path.join(RAW_DIR, name + ".json")


def fetch_cached(name: str, fetch: Callable[[], Dict[str, Any]], use_cache: bool = True) -> Dict[str, Any]:
    """Return the raw endpoint JSON, from pipeline/raw/ if already pulled.

    The raw cache lets an interrupted pull resume without re-hitting
    stats.nba.com. It is gitignored; delete it (make clean-raw) to force a
    fresh pull.
    """
    path = raw_path(name)
    if use_cache and os.path.exists(path):
        with open(path) as fh:
            return json.load(fh)
    payload = with_retries(name, fetch)
    os.makedirs(RAW_DIR, exist_ok=True)
    with open(path, "w") as fh:
        json.dump(payload, fh)
    return payload


def write_json(filename: str, rows: List[Dict[str, Any]]) -> str:
    os.makedirs(DATA_DIR, exist_ok=True)
    path = os.path.join(DATA_DIR, filename)
    for row in rows:
        if not row.get("source_url") or not row.get("pulled_at"):
            raise ValueError("row without source_url/pulled_at in %s: %r" % (filename, row))
    tmp = path + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(rows, fh, indent=1)
        fh.write("\n")
    os.replace(tmp, path)
    log("wrote %s (%d rows, %d bytes)" % (os.path.relpath(path, ROOT), len(rows), os.path.getsize(path)))
    return path


def parse_season_args(argv: List[str]) -> List[str]:
    """Optional CLI override: pull_x.py 1996 2025  (start years, inclusive)."""
    if len(argv) >= 3:
        return seasons(int(argv[1]), int(argv[2]))
    return seasons()


def result_set(payload: Dict[str, Any], name: Optional[str] = None) -> Dict[str, Any]:
    sets = payload["resultSets"]
    if isinstance(sets, dict):  # LeagueDashTeamShotLocations returns a single dict
        return sets
    if name is None:
        return sets[0]
    for s in sets:
        if s["name"] == name:
            return s
    raise KeyError("result set %s not in %s" % (name, [s["name"] for s in sets]))
