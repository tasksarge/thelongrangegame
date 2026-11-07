---
name: nba-shot-data
description: Pull NBA.com shot-location buckets, league per-game totals and Curry's lines by season into data/*.json with provenance, then validate. Use when refreshing data, adding a season, or when a pipeline script or validate.py fails.
---

# nba-shot-data

Input: a season range (default 1996-97 through the latest completed season). Output: `data/shot_buckets.json`, `data/league.json`, `data/curry.json`.

## Rules this skill enforces
1. Endpoints: `LeagueDashTeamShotLocations` (distance_range `8ft Range`), `LeagueDashTeamStats` (PerGame), `PlayerCareerStats` (201939). Nothing else.
2. Send the browser headers nba_api documents; sleep 1–2 s between seasons; three retries with backoff; 60 s timeout.
3. League usage % for a bucket = Σ team FGA in bucket / Σ all FGA, per season. Never average team percentages.
4. Every row carries `source_url` and an ISO `pulled_at`.
5. Run `python pipeline/validate.py` before finishing. Any failure is reported, never patched around.
6. Never fabricate a row. If stats.nba.com's JSON API blocks the run, switch to the page-table path: read the Teams › Shooting (8ft Range, Totals), Teams › Traditional and Teams › Advanced tables on www.nba.com/stats for each season into `pipeline/browser/`, then `make data-browser`. Reading rendered pages is fine; scripted fetches that impersonate a browser are not.

## Commands
```
make venv && make data      # pull all three files, then validate
make validate               # validate only
```

## Definitions to keep straight
- 24+ ft usage is the paper's series and NBA.com's bucket. It is close to, but not the same as, 3PA rate (corner threes fall in 16–24).
- Seasons are named by end year on the page ("2016" = 2015-16). The data keeps the "2015-16" form.
- 1996-97 is kept (shorter line that year) and footnoted; the paper starts at 1997-98.
