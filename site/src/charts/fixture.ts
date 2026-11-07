/**
 * FIXTURE — NOT REAL DATA. Used only by charts-dev.html when data/*.json is absent.
 * Shapes follow the PRD's anchor values (Appendix A) with smooth interpolation between them,
 * so the charts can be eyeballed before the pipeline lands. The story never imports this file.
 */
import type { CurryRow, LeagueRow, ShotBucketRow } from './types';
import { seasonOf } from './types';

const PULLED = '2026-11-07T00:00:00Z';
const URL = 'https://stats.nba.com/stats/fixture?note=not-real-data';

/** Piecewise-linear through (endYear, value) anchors, with a tiny deterministic wiggle. */
function series(anchors: [number, number][], wiggle = 0): (y: number) => number {
  return (y) => {
    let i = 0;
    while (i < anchors.length - 2 && anchors[i + 1][0] < y) i++;
    const [x0, v0] = anchors[i];
    const [x1, v1] = anchors[i + 1];
    const t = Math.max(0, Math.min(1, (y - x0) / (x1 - x0)));
    const base = v0 + (v1 - v0) * t;
    return Math.round((base + wiggle * Math.sin(y * 2.3)) * 10) / 10;
  };
}

const YEARS = Array.from({ length: 30 }, (_, i) => 1997 + i); // 1996-97 .. 2025-26

const fg3a = series([[1997, 16.8], [1998, 12.7], [2004, 14.9], [2008, 18.1], [2012, 18.4], [2016, 24.1], [2019, 32.0], [2022, 35.2], [2023, 34.2], [2025, 37.6], [2026, 37.0]], 0.3);
const fg3pct = series([[1997, 36.0], [1998, 34.5], [2004, 34.7], [2010, 35.5], [2016, 35.4], [2021, 36.7], [2024, 36.1], [2026, 35.8]], 0.4);
const fga = series([[1997, 80.0], [1998, 79.0], [2004, 79.5], [2010, 81.0], [2016, 84.6], [2020, 88.8], [2026, 88.0]], 0.3);
const u24 = series([[1997, 17.5], [1998, 15.9], [2004, 17.6], [2008, 22.0], [2012, 22.6], [2014, 25.9], [2016, 28.5], [2019, 35.5], [2022, 39.0], [2023, 38.1], [2025, 42.4], [2026, 41.6]], 0.2);
const u816 = series([[1997, 20.5], [1998, 20.9], [2008, 17.5], [2016, 13.9], [2026, 7.6]], 0.2);
const u1624 = series([[1997, 17.0], [1998, 17.4], [2008, 15.5], [2016, 11.8], [2026, 7.2]], 0.2);

export const fixtureLeague: LeagueRow[] = YEARS.map((y) => {
  const a = fg3a(y);
  const pct = fg3pct(y);
  const f = fga(y);
  return {
    season: seasonOf(y), fga: f, fg3a: a, fg3m: Math.round(a * pct) / 100, fg3_pct: pct,
    fg3a_rate: Math.round((a / f) * 1000) / 10, pace: null, source_url: URL, pulled_at: PULLED,
  };
});

export const fixtureShots: ShotBucketRow[] = YEARS.flatMap((y) => {
  const b24 = u24(y);
  const b816 = u816(y);
  const b1624 = u1624(y);
  const back = 0.4;
  const lt8 = Math.round((100 - b24 - b816 - b1624 - back) * 10) / 10;
  const f = fga(y) * 82 * 30;
  const mk = (bucket: ShotBucketRow['bucket'], pct: number, fgp: number): ShotBucketRow => ({
    season: seasonOf(y), bucket, fga: Math.round(f * pct / 100), fgm: Math.round((f * pct / 100) * fgp),
    usage_pct: pct, source_url: URL, pulled_at: PULLED,
  });
  return [mk('lt8', lt8, 0.58), mk('8_16', b816, 0.40), mk('16_24', b1624, 0.40), mk('24plus', b24, 0.355), mk('backcourt', back, 0.03)];
});

const curryPerGame: [number, number, number][] = [
  // endYear, 3PM per game, games
  [2010, 2.1, 80], [2011, 2.0, 74], [2012, 2.1, 26], [2013, 3.5, 78], [2014, 3.3, 78], [2015, 3.6, 80], [2016, 5.1, 79],
  [2017, 4.1, 79], [2018, 4.2, 51], [2019, 5.1, 69], [2020, 2.4, 5], [2021, 5.3, 63], [2022, 4.5, 64], [2023, 4.9, 56],
  [2024, 4.8, 74], [2025, 4.4, 70], [2026, 4.4, 60],
];
export const fixtureCurry: CurryRow[] = curryPerGame.map(([y, pg, gp]) => ({
  season: seasonOf(y), gp, fg3m: Math.round(pg * gp), fg3a: Math.round(pg * gp / 0.425), fg3m_per_game: pg,
  age: y - 1988, source_url: 'https://www.basketball-reference.com/players/c/curryst01.html#fixture', pulled_at: PULLED,
}));
