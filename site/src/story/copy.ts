/** Every 2026-voice line on the page. Rules: under 20 words, numbers carry the weight,
 *  "Stats aren't everything" appears once (Act 2 setup), seasons named by end year. */
import type { MarginNote } from '@/paper/paper';

export const coldOpen = [
  { kicker: 'June 19, 2016', line: 'Oracle Arena. Game 7.', clock: '0:53', score: '89–89' },
  { kicker: '0:53', line: 'Kyrie Irving. Twenty-five feet. Step-back over Stephen Curry.', clock: '0:53', score: '92–89' },
  { kicker: 'Final', line: 'Cavaliers 93, Warriors 89.', clock: '0:00', score: '93–89' },
  { kicker: 'June 20, 2016', line: 'The morning after, a college senior turned this in.', clock: '', score: '' },
  { kicker: 'The paper', line: 'He argued the three-pointer was the future of basketball. Twelve hours earlier, the most prolific three-point team ever had lost the Finals at home.', clock: '', score: '' },
];

export const marginNotes: MarginNote[] = [
  { id: 'arc', page: 'page-1', anchor: 'lengthens to 23 feet', text: '23 feet 9 inches at the top of the arc, 22 feet in the corners.' },
  { id: 'miner', page: 'page-1', anchor: 'courtesy of NBA Miner', text: 'NBA Miner is gone. It wrapped NBA.com\'s shot-location buckets. This page pulls from the same source.' },
  { id: 'match', page: 'page-2', anchor: 'nearly doubled in usage percentage', text: 'Rebuilt in 2026 from NBA.com data, this line matches the 2016 one within half a point. Credit first.' },
  { id: 'fig12start', page: 'page-2', anchor: 'made 3 point basket consequently increased', text: 'The 2016 end of this line reproduces (8.5 vs 8.6). The 1998 start does not: NBA.com has 4.4 makes per team-game, the paper drew about 5.1.' },
  { id: 'skills', page: 'page-2', anchor: 'Players were gaining better skills', text: 'Makes rose because attempts rose. League 3P% has stayed between 33.9% and 36.7% for 29 seasons.' },
  { id: 'sum', page: 'page-3', anchor: '753.9 to 1,310.6', text: 'That legend says "Usage %" but runs 754 to 1,311: likely a Tableau SUM across team rows, about 46× the league figure. Rebuilt as a percentage in Now view.' },
  { id: 'obsolete', page: 'page-3', anchor: 'almost obsolete', text: 'Held. Both midrange buckets keep falling through 2026.' },
  { id: 'df', page: 'page-4', anchor: 'there are 2 because we are looking at', text: 'Model degrees of freedom count fitted parameters (slope and intercept), not variables.' },
  { id: 'pval', page: 'page-4', anchor: 'p-value (significance): 0.0012104', text: 'Two rising series will correlate. A p of 0.0012 on trending time series is not evidence of cause.' },
  { id: 'obvious', page: 'page-5', anchor: "you don't even need numbers to see this obvious truth", text: 'Left in. This is the one sentence a data paper cannot carry.' },
  { id: 'bref', page: 'page-5', anchor: 'Pearson\'s R equaled about 0.95', text: 'The paper credits NBA Miner for the buckets (correct) and never names Basketball-Reference for Curry\'s line (it should).' },
];

export const act2 = {
  title: 'The night before',
  beats: [
    { kicker: 'The season', big: '73–9', lines: ['Curry: 402 threes, the first unanimous MVP.', 'The team took 31.6 threes a game and hit 41.6%.'] },
    { kicker: 'The series', big: '3–1', lines: ['Up 3–1.', 'First team ever to lose a Finals from there.'] },
    { kicker: 'The game', big: '4:39', lines: ['Warriors scoreless over the final 4:39.', 'Curry 6 of 19, 4 of 14 from three, 17 points.', 'The Block, about 1:50 left. The Shot, 0:53.'] },
    { kicker: 'The tempting lesson', big: '', lines: ["Stats aren't everything.", 'Sometimes you have to be great when the moment counts.'] },
    { kicker: 'The actual lesson', big: '', lines: ['The shot that beat the three-point team was a three.', "Seven games is noise. Nineteen seasons isn't."] },
    { kicker: 'Postscript', big: '', lines: ['Three more titles. The all-time record, December 2021.', 'Finals MVP in 2022. Olympic gold in 2024.'] },
  ],
};

export const act3 = {
  title: 'Ten years later',
  fig11: {
    steps: [
      'The 2016 line is already drawn. Watch it keep going.',
      'By 2025, 42.1% of all shots came from beyond the arc.',
      'The ten years after the paper added more attempts per game than the eighteen years it charted.',
    ],
  },
  fig12: {
    steps: [
      'Makes rose because attempts rose.',
      'League 3P% has stayed between 33.9% and 36.7% for all 29 seasons.',
      '"Players got better" was the wrong story. "Coaches changed the shot diet" is the right one.',
    ],
  },
  fig2: {
    steps: [
      'Four distance buckets, 30 seasons, one scale.',
      'The midrange fade continues, now with the 16–24 ft bucket the paper skipped.',
    ],
  },
  fig3: {
    steps: [
      'Seven points in 2016. R² 0.90. Now add seasons.',
      'Curry plateaus near 4 to 5 makes. The league keeps climbing. R² falls to 0.46.',
      'The 2007-08 jump (Morey\'s Rockets) predates his rookie year.',
      'Swap the x-axis for Curry\'s age. It fits the league just as well: r 0.98.',
      'The paper\'s causal claim does not survive its own method.',
    ],
  },
};

export interface Claim { claim: string; verdict: 'Held, then accelerated' | 'Half right' | 'Held' | 'Not supported' | 'Minor error'; evidence: string; chart?: 'fig11' | 'fig12' | 'fig2' | 'fig3' }
export const reportCard: Claim[] = [
  { claim: 'Shots beyond 24 ft "nearly doubled" 1998 to 2016 and the three went "from a luxury to a necessity"', verdict: 'Held, then accelerated', evidence: '24+ ft usage about 16% to 28.5% by 2016; three-point rate 42.1% in 2024-25; attempts 12.7 → 24.1 → 37.6 per game.', chart: 'fig11' },
  { claim: '"Players were gaining better skills to utilize and convert on the 3 point shot"', verdict: 'Half right', evidence: 'Makes per game rose (4.4 → 8.5 → over 13; the paper\'s 1998 start of 5.1 does not reproduce) but league 3P% stayed between 33.9% and 36.7% every season. The gain is volume, not accuracy.', chart: 'fig12' },
  { claim: 'Midrange "almost obsolete"', verdict: 'Held', evidence: '8–16 ft and 16–24 ft shares keep falling through 2025-26.', chart: 'fig2' },
  { claim: '"Steph Curry\'s abilities have influenced the league to take more 3 pointers" (r ≈ 0.95, n = 7)', verdict: 'Not supported', evidence: 'Any two rising series correlate. The 2007-08 jump predates Curry. Past 2016, R² collapses. Curry\'s age fits the league just as well (r 0.98 over 17 seasons).', chart: 'fig3' },
  { claim: 'The line is "22 feet from each corner and lengthens to 23 feet"', verdict: 'Minor error', evidence: '23 ft 9 in at the top of the arc; 22 ft in the corners.' },
];

export const backlash = [
  { when: '2024-25', who: 'The league', quote: 'A record 37.6 attempts a game. The Celtics: 48.2.', url: 'https://www.vertizesports.com/' },
  { when: 'January 2025', who: 'Adam Silver', quote: '"We will tweak it, we will correct those issues."', url: 'https://www.cbssports.com/nba/' },
  { when: 'October 2025', who: 'LeBron James', quote: 'Concedes the league has a three-point problem.', url: 'https://frontofficesports.com/' },
  { when: 'March 2026', who: 'Adam Silver, Paris', quote: '"I\'m listening to the critics."', url: 'https://frontofficesports.com/' },
  { when: '2025-26', who: 'The league', quote: '37.0 attempts a game. Only the second year-over-year decline in 29 seasons.', url: 'https://www.vertizesports.com/' },
  { when: 'June 13, 2026', who: 'The Finals', quote: 'Knicks over Spurs. Eight different champions in eight years. Dynasties ended as the shot spread.', url: 'https://en.wikipedia.org/wiki/2026_NBA_Finals' },
];

export const epilogue = {
  title: 'Was 2024-25 the peak?',
  lines: [
    'From 12.7 to 24.1 took eighteen seasons. From 24.1 to 37.6 took nine.',
    'The two dips, 2022-23 and 2025-26, are the only declines in the series.',
    'That is why this ends on a question, not a verdict.',
  ],
  closing: 'In 2016 I wrote that the three ball went from a luxury to a necessity. Ten years later the league is asking whether it became a problem. Both can be true.',
};

export const method = {
  title: 'How this page was built',
  lines: [
    'One pipeline pulls NBA.com shot-location buckets by season, the same source NBA Miner wrapped in 2016.',
    'Every chart has a Data button: the file, the pull date, the URL and the exact rows plotted.',
    'Five Claude skills in the repo enforce the pipeline, the chart rules, paper fidelity, the copy rules and the asset review. A fresh clone rebuilds in two commands.',
  ],
  repo: 'https://github.com/',
  notes: [
    '24+ ft usage is the paper\'s series and NBA.com\'s bucket. It tracks true three-point attempt rate closely (about 15.6% vs 15.9% in 1997-98) but is not identical: a 22-ft corner three falls in the 16–24 bucket.',
    'The line was 22 ft all the way around from 1994-95 through 1996-97, which is why 1996-97 shows a higher rate than 1997-98. The paper starts at 1997-98 on purpose; the data keeps 1996-97.',
    'Seasons are named by the year they end, as the paper did. "2016" is 2015-16.',
    'League averages are team-game weighted: sum of team totals over team games. League 3P% is makes over attempts, not an average of team percentages.',
  ],
};
