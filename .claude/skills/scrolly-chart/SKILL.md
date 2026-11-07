---
name: scrolly-chart
description: Build or change a D3 chart module for the story (site/src/charts). Use for any new chart, chart fix, or chart-rule review.
---

# scrolly-chart

Input: a JSON series from `data/` and a short spec (measure, range, marker, labels). Output: a module exporting `create<Name>(container, opts): ChartHandle` per `site/src/charts/types.ts`.

## Rules this skill enforces
1. The finding is the title, with its number. The topic goes in the subtitle.
2. One accent (`var(--accent)`) on the series the title is about; everything else grey. The 2016 marker is a grey dashed line, labeled.
3. Values only on story points: first, 2016, peak, latest.
4. Y axes start where the original did in Then view, at zero or a labeled floor in Now view. Never a truncated axis without a visible break.
5. A source line under every chart: file, pull date, URL, and a Data button that lists the exact rows plotted.
6. Every control works from the keyboard. `alt()` returns one sentence carrying the key numbers.
7. Colors and fonts come from tokens only (`site/src/styles/tokens.css`); charts must read on cream and on black.
8. Figure 3 never renders without R² and n on screen.

## Checklist before done
- `npx tsc --noEmit` and `npm run build` pass in `site/`.
- Looked at it on `/charts-dev.html` at phone width and desktop width.
