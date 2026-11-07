/**
 * Self-check for stats.ts. No test framework; run with
 *   node src/charts/stats.check.ts        (Node ≥ 23.6 strips types natively)
 *   npx tsx src/charts/stats.check.ts     (older Node)
 * Exit code 1 on any failure.
 */
import { ols, pearson, tCdf, ibeta } from './stats.ts';

let failures = 0;
function check(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? '  ' + detail : ''}`);
  if (!ok) failures++;
}
const near = (a: number, b: number, tol: number) => Math.abs(a - b) <= tol;

// 1. Figure 3 reference table from the PRD (Curry 3PM/game vs league 24+ ft usage %, 2009-10..2015-16).
const curry = [2.1, 2.0, 2.1, 3.5, 3.3, 3.6, 5.1];
const league = [22.2, 22.2, 22.6, 24.3, 25.9, 26.8, 28.5];
const fit = ols(curry, league);
check('reference r² near 0.90', near(fit.r2, 0.9, 0.03), `r²=${fit.r2.toFixed(4)} r=${fit.r.toFixed(4)}`);
check('reference n = 7', fit.n === 7);
check('reference df = 5', fit.df === 5);
check('reference p is small (< 0.01)', fit.p < 0.01, `p=${fit.p.toExponential(3)}`);
check('pearson matches ols.r', near(pearson(curry, league), fit.r, 1e-12));

// 2. Exact line: y = 2x + 1 → r² = 1, p = 0 (t infinite).
const xs = [1, 2, 3, 4, 5];
const exact = ols(xs, xs.map((x) => 2 * x + 1));
check('exact line slope 2', near(exact.slope, 2, 1e-12));
check('exact line intercept 1', near(exact.intercept, 1, 1e-12));
check('exact line r² = 1', near(exact.r2, 1, 1e-12));

// 3. Student t CDF against tabulated values.
check('tCdf(0, 5) = 0.5', near(tCdf(0, 5), 0.5, 1e-12));
check('tCdf(2.015, 5) ≈ 0.95', near(tCdf(2.015, 5), 0.95, 1e-3), tCdf(2.015, 5).toFixed(5));
check('tCdf(2.571, 5) ≈ 0.975', near(tCdf(2.571, 5), 0.975, 1e-3), tCdf(2.571, 5).toFixed(5));
check('tCdf(-2.571, 5) ≈ 0.025', near(tCdf(-2.571, 5), 0.025, 1e-3));
check('tCdf(1.96, 1e6) ≈ 0.975 (normal limit)', near(tCdf(1.96, 1e6), 0.975, 1e-3), tCdf(1.96, 1e6).toFixed(5));
check('ibeta(1,1,x) = x', near(ibeta(1, 1, 0.3), 0.3, 1e-12));

// 4. Two-sided p from a known t: t = 4.032, df = 5 → p ≈ 0.01.
const p = 2 * (1 - tCdf(4.032, 5));
check('p(t=4.032, df=5) ≈ 0.010', near(p, 0.01, 5e-4), p.toFixed(5));

// 5. Degenerate inputs do not throw.
check('n=1 gives NaN r', Number.isNaN(ols([1], [2]).r));
check('zero variance gives NaN r', Number.isNaN(pearson([1, 1, 1], [1, 2, 3])));

if (failures) throw new Error(`${failures} stats check(s) failed`);
console.log('\nall checks passed');
