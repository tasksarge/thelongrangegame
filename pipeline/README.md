# pipeline

Pulls the three JSON files the site reads, from NBA.com Stats through
`nba_api`, and validates them against the 2016 paper's anchors.

## Rebuild in two commands

```
make venv
make data
```

`make venv` creates `.venv` with `python3` and installs `requirements.txt`.
`make data` runs the three pulls, then `validate.py`, which exits nonzero if
any of the seven PRD tests fails. `make validate` reruns only the tests.

Run the pulls on a local machine. stats.nba.com sits behind Akamai bot
filtering that drops or 403s cloud runners and some non-browser clients; the
scripts send the browser headers nba_api documents, sleep 1.5 s between
seasons, retry three times with backoff and time out at 60 s. A pull that
fails after its retries exits nonzero and writes nothing, so a half-refreshed
data set never ships.

Raw endpoint responses are cached in `pipeline/raw/` (gitignored). An
interrupted pull resumes from the cache; `make clean-raw` forces a fresh pull.

## Outputs

| Script | Output | Row |
|--------|--------|-----|
| `pull_shot_locations.py` | `data/shot_buckets.json` | season, bucket (lt8, 8_16, 16_24, 24plus, backcourt), fga, fgm, usage_pct, source_url, pulled_at |
| `pull_league_pergame.py` | `data/league.json` | season, fga, fg3a, fg3m, fg3_pct, fg3a_rate, pace, source_url, pulled_at |
| `pull_curry.py` | `data/curry.json` | season, gp, fg3m, fg3a, fg3m_per_game, age, source_url, pulled_at |
| `constants/*.json` | hand-entered | game7, quotes, timeline; every entry has source_url |

Each pull script accepts optional start years, e.g.
`.venv/bin/python pipeline/pull_shot_locations.py 2014 2016`, for a quick
partial check. `validate.py` still expects the full range.

Definitions: usage_pct is the bucket's share of all FGA across the five
NBA.com 8ft-range buckets, league-wide, per season. League per-game values
are team-game weighted (league totals divided by team-games). fg3_pct is
league 3PM over 3PA. Curry's age is season end year minus 1988.

`checks.md` records the Basketball-Reference and PRD anchor values the data
is compared against.

## When the JSON API will not answer

Akamai in front of `stats.nba.com` drops scripted clients on some networks (every request hangs to the
timeout, while `www.nba.com/stats` loads normally in a browser). The public stats pages render the same
tables, so the fallback is to read them as a person would and convert:

1. Save each season's table from the page text into `pipeline/browser/<kind>/<season>.txt`
   (`shooting` = Teams › Shooting, 8ft Range, Totals; `traditional` = Teams › Traditional, Per Game;
   `advanced` = Teams › Advanced, Per Game; plus `curry_totals.txt` from the player career page, Totals).
   Each file starts with `# source: <page url>` and `# read: <ISO time>`.
2. `make data-browser` converts them with the same bucket math and runs the seven validation tests.

Rows built this way carry the page URL as `source_url`. The first 2026 build used this path.
