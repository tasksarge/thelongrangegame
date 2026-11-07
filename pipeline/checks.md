# Cross-checks against Basketball-Reference and the PRD anchors

Hand-checked, not scraped. The reference values below are the anchors recorded
in the PRD (Appendix A, Appendix C, and the Figure 3 reference table). The
"pipeline" column is filled in from `data/*.json` after `make data`; a dash
means the pull has not produced the value yet. Basketball-Reference pages to
read against: league per-game index
(https://www.basketball-reference.com/leagues/NBA_stats_per_game.html) and
Stephen Curry (https://www.basketball-reference.com/players/c/curryst01.html).

## League per team-game (data/league.json)

| Season  | Measure            | Reference | Source of reference            | Band (validate.py) | Pipeline |
|---------|--------------------|-----------|--------------------------------|--------------------|----------|
| 1997-98 | 3PA share of FGA   | 15.9 %    | PRD s5 definitions (Vertize)   | n/a                | -        |
| 1997-98 | 3PM per game       | ~5.1      | PRD s7 report card             | [4.6, 5.6]         | -        |
| 2007-08 | 3PA share of FGA   | > 22 %    | PRD A4 (Rockets jump)          | n/a                | -        |
| 2015-16 | 3PA per game       | 24.1      | PRD s3, Vertize                | [23.6, 24.6]       | -        |
| 2015-16 | 3PA share of FGA   | 28.5 %    | PRD s5 definitions (Vertize)   | n/a                | -        |
| 2015-16 | 3PM per game       | ~8.6      | PRD s7 report card             | [8.0, 9.0]         | -        |
| 2018-19 | 3PA per game       | 32.0      | Wikipedia: Three-point revolution | n/a             | -        |
| 2020-21 | 3PM per game       | 12.7 (record at the time) | KSAT/AP, May 2021 | n/a            | -        |
| 2024-25 | 3PA per game       | 37.6 (record) | PRD s3, Vertize            | [37.1, 38.1]       | -        |
| 2024-25 | 3PA share of FGA   | 42.1 %    | PRD s3                         | n/a                | -        |
| 2025-26 | 3PA per game       | 37.0      | PRD s3, Vertize                | n/a                | -        |
| all     | 3P% range 1996-97 on | 33.9 to 36.7 % | PRD A1 (Vertize)         | n/a                | -        |
| series  | Declines year over year | only 2022-23 and 2025-26 | PRD s3        | n/a                | -        |

## Shot-location buckets (data/shot_buckets.json)

| Season  | Bucket  | Reference | Source of reference               | Band (validate.py) | Pipeline |
|---------|---------|-----------|-----------------------------------|--------------------|----------|
| 1997-98 | 24+ ft  | ~16 %     | PRD s5 (NBA Miner series)         | [15, 17]           | -        |
| 2015-16 | 24+ ft  | ~28 % (paper axis tops at 29) | PRD s5, Figure 1-1 | [27.5, 29.5]     | -        |
| 1997-98 to 2015-16 | 8-16 ft | 13.9 to 20.9 % | Paper Figure 2 legend    | n/a                | -        |
| 2009-10 .. 2015-16 | 24+ ft (3PA rate stand-in) | 22.2, 22.2, 22.6, 24.3, 25.9, 26.8, 28.5 | PRD Figure 3 reference table (Vertize 3PA rate; bucket should sit close but not equal) | n/a | - |

The paper's own 24+ axis ran 754 to 1,311: a Tableau SUM across team rows,
about 46 times the league percentage. Expect pipeline percentages, not sums.

## Stephen Curry, regular season (data/curry.json)

| Season  | GP | 3PM | 3PM/game | Source of reference                | Band (validate.py) | Pipeline |
|---------|----|-----|----------|------------------------------------|--------------------|----------|
| 2009-10 | -  | 166 | 2.1      | Fadeaway World; PRD Figure 3 table | n/a                | -        |
| 2010-11 | -  | 151 | 2.0      | Fadeaway World; PRD Figure 3 table | n/a                | -        |
| 2011-12 | -  | 55  | 2.1      | Fadeaway World; PRD Figure 3 table | n/a                | -        |
| 2012-13 | -  | 272 | 3.5      | Fadeaway World; PRD Figure 3 table | n/a                | -        |
| 2013-14 | -  | -   | 3.3      | PRD Figure 3 table                 | n/a                | -        |
| 2014-15 | -  | -   | 3.6      | PRD Figure 3 table                 | n/a                | -        |
| 2015-16 | 79 | 402 | 5.1      | PRD A3, Fadeaway World, beIN       | fg3m = 402, gp = 79 | -       |
| 2016-17 | -  | -   | 4.1      | beIN Sports                        | n/a                | -        |
| 2017-18 | -  | -   | 4.2      | beIN Sports                        | n/a                | -        |
| 2018-19 | -  | -   | 5.1      | beIN Sports                        | n/a                | -        |
| 2025-26 | -  | -   | 4.4 on 11.3 attempts through 43 games (in-season) | Screwball | n/a | final to verify |

Appendix A2's full per-season table did not survive the PRD export; the rows
above are every Curry anchor the PRD text still carries. Values not marked
with a source in Appendix C were from memory and are to be read against the
Basketball-Reference player page before the M0 gate is signed.

## Other anchors used by constants/

| Fact | Reference | Source |
|------|-----------|--------|
| 2015-16 Warriors | 31.6 3PA/game at 41.6 % | Wikipedia: Three-point revolution |
| 2024-25 Celtics | 48.2 3PA/game | Vertize |
| Game 7 Curry | 6-19 FG, 4-14 3P, 17 pts | Land of Basketball, Basketball-Reference box score |
| Game 7 Thompson | 6-17 FG, 2-10 3P, 14 pts | Land of Basketball |

## How to fill the Pipeline column

```
make data
.venv/bin/python - <<'PY'
import json
L={r['season']:r for r in json.load(open('data/league.json'))}
B={(r['season'],r['bucket']):r for r in json.load(open('data/shot_buckets.json'))}
C={r['season']:r for r in json.load(open('data/curry.json'))}
for s in ['1997-98','2007-08','2015-16','2018-19','2020-21','2024-25','2025-26']:
    r=L[s]; print(s, 'fg3a',r['fg3a'],'fg3m',r['fg3m'],'rate',r['fg3a_rate'],'24+',B[(s,'24plus')]['usage_pct'])
print('3P% range', min(r['fg3_pct'] for r in L.values()), max(r['fg3_pct'] for r in L.values()))
for s in ['2009-10','2015-16','2018-19']: print(s, C[s])
PY
```

## 2026-11-07 build: NBA.com page tables vs. the PRD anchors

Built with `make data-browser` from www.nba.com/stats page tables (all 30 seasons, 7/7 validation tests pass).

| Value | PRD anchor (Vertize / paper) | NBA.com page tables | Note |
| --- | --- | --- | --- |
| 24+ ft usage 1997-98 | ~16% (paper ~15.7) | 15.61% | within a point |
| 24+ ft usage 2015-16 | 28.5% (paper ~28) | 28.18% | within half a point |
| 3PA per game 2015-16 | 24.1 | 24.08 | match |
| 3PA per game 2024-25 | 37.6 | 37.58 | match |
| 3PA per game 2025-26 | 37.0 | 36.98 | match |
| 3PM per game 1997-98 | paper drew ~5.1 | 4.40 | does not reproduce; the page says so (margin note, report card, test 4) |
| 3PM per game 2015-16 | paper ~8.6 | 8.51 | within 0.1 |
| Curry 2015-16 | 402 threes, 79 GP | 402 / 79 | match |
| League 3P% range 1996-97 to 2025-26 | 33.9 to 36.7 | 33.9 (1997-98 is 34.6; min in range) to 36.7 | matches the band |

Basketball-Reference remains the agreed cross-check for anything that looks off; it is not scraped.
