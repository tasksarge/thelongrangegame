/**
 * The committed pipeline output, typed. Nothing on the page calls an API at runtime.
 * The JSON files are plain arrays of rows (see pipeline/common.py write_json).
 *
 * Loaded through the `@data` alias with import.meta.glob so a missing file degrades to an empty
 * array (and a console error) instead of breaking the build while the pipeline is still running.
 */
import type { CurryRow, LeagueRow, ShotBucketRow } from './types';
import { endYear } from './types';

const files = import.meta.glob('@data/*.json', { eager: true, import: 'default' }) as Record<string, unknown>;

function rowsOf<T>(name: string): T[] {
  const entry = Object.entries(files).find(([k]) => k.endsWith(`/${name}`));
  const j = entry?.[1];
  if (!entry) {
    console.error(`[charts] data/${name} is missing; run \`make data\` in the repo root.`);
    return [];
  }
  if (Array.isArray(j)) return j as T[];
  if (j && typeof j === 'object') {
    const o = j as Record<string, unknown>;
    for (const k of ['rows', 'data', 'default']) if (Array.isArray(o[k])) return o[k] as T[];
  }
  return [];
}

const bySeason = <T extends { season: string }>(a: T[]): T[] => [...a].sort((p, q) => endYear(p.season) - endYear(q.season));

export const league: LeagueRow[] = bySeason(rowsOf<LeagueRow>('league.json'));
export const shots: ShotBucketRow[] = bySeason(rowsOf<ShotBucketRow>('shot_buckets.json'));
export const curry: CurryRow[] = bySeason(rowsOf<CurryRow>('curry.json'));

/** True when all three files were present at build time. */
export const dataPresent = league.length > 0 && shots.length > 0 && curry.length > 0;
/** True when the files look like a finished pull (the pipeline writes season by season). */
export const dataComplete = league.length >= 25 && shots.length >= 125 && curry.length >= 7;

export const bucket = (b: ShotBucketRow['bucket']): ShotBucketRow[] => shots.filter((r) => r.bucket === b);

export interface LatestSeason {
  season: string;
  endYear: number;
  pulledAt: string;
}
/** The latest season in league.json (the pipeline guarantees it matches shot_buckets.json). */
export function latestSeason(): LatestSeason {
  const last = league[league.length - 1];
  return last
    ? { season: last.season, endYear: endYear(last.season), pulledAt: last.pulled_at }
    : { season: '', endYear: NaN, pulledAt: '' };
}
