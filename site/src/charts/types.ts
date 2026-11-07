/** Shared contract between the story shell and every chart module. */

export type Mode = 'then' | 'now';

export interface ShotBucketRow {
  season: string;      // "1997-98"
  bucket: 'lt8' | '8_16' | '16_24' | '24plus' | 'backcourt';
  fga: number;
  fgm: number;
  usage_pct: number;   // 0..100
  source_url: string;
  pulled_at: string;   // ISO
}

export interface LeagueRow {
  season: string;
  fga: number;         // per team-game
  fg3a: number;
  fg3m: number;
  fg3_pct: number;     // 0..100
  fg3a_rate: number;   // fg3a / fga * 100
  pace: number | null;
  source_url: string;
  pulled_at: string;
}

export interface CurryRow {
  season: string;
  gp: number;
  fg3m: number;
  fg3a: number;
  fg3m_per_game: number;
  age: number;
  source_url: string;
  pulled_at: string;
}

export interface DataSource {
  file: string;        // "data/league.json"
  pulledAt: string;    // ISO from the rows
  url: string;         // the stats.nba.com endpoint or page
  rows: Record<string, unknown>[]; // exactly the rows plotted
}

export interface ChartHandle {
  el: HTMLElement;
  /** Then = the 2016 paper's range, axis and flaws, labeled. Now = corrected scale, extended range. */
  setMode(mode: Mode): void;
  /** 0..1 scroll progress inside the chart's scene; charts use it to extend/reveal series. */
  setProgress(t: number): void;
  /** One sentence carrying the key numbers, for aria-label and the alt text line. */
  alt(): string;
  source(): DataSource;
  destroy(): void;
}

export interface ChartOptions {
  mode?: Mode;
  /** Season label by end year, as the paper did: "2016" = 2015-16. */
  compact?: boolean;
}

/** Season "2015-16" -> 2016 */
export const endYear = (season: string): number => Number(season.slice(0, 4)) + 1;
/** 2016 -> "2015-16" */
export const seasonOf = (endYear: number): string =>
  `${endYear - 1}-${String(endYear % 100).padStart(2, '0')}`;
