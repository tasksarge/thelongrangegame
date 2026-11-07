# The Long Range Game, Revisited (2016 → 2026)

A scroll-driven web story that reopens a college data-visualization paper dated June 20, 2016, the morning after the Warriors lost Game 7, and scores its argument against ten more seasons of NBA.com data.

- `pipeline/` — Python pulls of NBA.com shot-location buckets, league per-game totals and Curry's lines → `data/*.json`, validated against the paper's own figures.
- `data/` — committed JSON the site reads. Nothing on the page calls an API at runtime.
- `site/` — Vite + TypeScript + D3. Seven tap-through chapters (`src/chapters/engine.ts`), code-drawn motion graphics (`src/gfx/`), live charts (`src/charts/`), and a retro-futurist collage art direction documented in `site/DESIGN.md`. Deploys to Cloudflare Workers (static assets).
- `.claude/skills/` — the five skills that enforce the pipeline, chart, fidelity, copy and asset rules.

## Rebuild in two commands

```
make data        # pull + validate (needs Python 3.11; runs locally, stats.nba.com blocks most cloud runners)
make build       # build the site into site/dist
```

Then `make deploy` (needs `npx wrangler login` once) or push to `main` with a `CLOUDFLARE_API_TOKEN` secret set.

## Media rules
No faces, no logos, no text in generated media. Every file is logged in `site/public/media/REVIEW.md`.
