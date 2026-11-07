/** Pure statistics helpers for Figure 3: OLS, Pearson r, Student t CDF. No DOM, no d3. */

export interface OlsResult {
  slope: number;
  intercept: number;
  r: number;
  r2: number;
  n: number;
  /** Two-sided p-value for H0: slope = 0 (t-test with n-2 degrees of freedom). */
  p: number;
  t: number;
  df: number;
  /** Standard error of the slope. */
  se: number;
}

export const mean = (a: number[]): number => a.reduce((s, v) => s + v, 0) / a.length;

/** Pearson product-moment correlation. NaN when fewer than 2 points or zero variance. */
export function pearson(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return NaN;
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return NaN;
  return sxy / Math.sqrt(sxx * syy);
}

/** Ordinary least squares y = slope·x + intercept, with r, r², and the slope t-test p-value. */
export function ols(xs: number[], ys: number[]): OlsResult {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) {
    return { slope: NaN, intercept: NaN, r: NaN, r2: NaN, n, p: NaN, t: NaN, df: Math.max(n - 2, 0), se: NaN };
  }
  const mx = mean(xs.slice(0, n));
  const my = mean(ys.slice(0, n));
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  const slope = sxx === 0 ? NaN : sxy / sxx;
  const intercept = my - slope * mx;
  const r = sxx === 0 || syy === 0 ? NaN : sxy / Math.sqrt(sxx * syy);
  const r2 = r * r;
  const df = n - 2;
  let sse = 0;
  for (let i = 0; i < n; i++) {
    const e = ys[i] - (slope * xs[i] + intercept);
    sse += e * e;
  }
  const se = df > 0 && sxx > 0 ? Math.sqrt(sse / df / sxx) : NaN;
  const t = se > 0 ? slope / se : NaN;
  const p = df > 0 && Number.isFinite(t) ? 2 * (1 - tCdf(Math.abs(t), df)) : NaN;
  return { slope, intercept, r, r2, n, p, t, df, se };
}

/** Lanczos approximation of ln Γ(x). */
export function lgamma(x: number): number {
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  x -= 1;
  let a = c[0];
  const t = x + g + 0.5;
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

/** Continued fraction for the incomplete beta function (Numerical Recipes betacf). */
function betacf(a: number, b: number, x: number): number {
  const MAXIT = 200;
  const EPS = 3e-14;
  const FPMIN = 1e-300;
  const qab = a + b;
  const qap = a + 1;
  const qam = a - 1;
  let c = 1;
  let d = 1 - (qab * x) / qap;
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((qam + m2) * (a + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    h *= d * c;
    aa = (-(a + m) * (qab + m) * x) / ((a + m2) * (qap + m2));
    d = 1 + aa * d;
    if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c;
    if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}

/** Regularized incomplete beta I_x(a, b). */
export function ibeta(a: number, b: number, x: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return (bt * betacf(a, b, x)) / a;
  return 1 - (bt * betacf(b, a, 1 - x)) / b;
}

/** Student t cumulative distribution: P(T ≤ t) with df degrees of freedom. */
export function tCdf(t: number, df: number): number {
  if (!Number.isFinite(t)) return t > 0 ? 1 : 0;
  if (df <= 0) return NaN;
  const x = df / (df + t * t);
  const tail = 0.5 * ibeta(df / 2, 0.5, x);
  return t >= 0 ? 1 - tail : tail;
}

/** Two-sided p-value for a t statistic. */
export const tTestP = (t: number, df: number): number => 2 * (1 - tCdf(Math.abs(t), df));
