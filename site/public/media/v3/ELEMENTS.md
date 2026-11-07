# Cutouts, wireframes, glyphs and GIF loops, set v3 (7 Nov 2026)

GPT Image 2.6 via Higgsfield. Cutouts and wireframes: quality xhigh, 2K, transparent background, three variants each, best kept; WebP 1200 px with real alpha here, PNG 2048 sources in `site/media-src/v3/elements/` (unpicked variants in `elements/alt/`). Glyphs: SVG output, all fills and strokes rewritten to `currentColor`, width/height stripped, viewBox kept, validated with no text, scripts or external hrefs. GIFs: 16 frames (model cap), flat background.

| File(s) | Kind | Faces | Text / logos | Result |
| --- | --- | --- | --- | --- |
| hand-pointing-right, hand-pointing-left, hand-palming-ball, hands-clapping, referee-arm-raised | halftone cutout | none (hands/arm only) | none | Pass |
| basketball, hoop-net-below, hoop-net-side, stopwatch, clipboard-pages, pencil, whistle, newspaper-folded, trophy | halftone cutout | n/a | none (newspaper has grey bars, no letters) | Pass |
| sneaker-side | halftone cutout | n/a | v0 resembled a branded shoe and was rejected; shipped file is a generic canvas high-top, no logo | Pass |
| marble-bust-profile | halftone cutout | classical sculpture, allowed | none | Pass |
| torus, sphere-grid, cylinder, cone, grid-plane, half-court-wire, three-point-arc, basketball-wire, scoreboard-wire | electric-blue wireframe | n/a | none | Pass |
| glyphs/: sparkle-4, star-8, plus, ring, dotted-circle, arrow-rough-straight, arrow-rough-curved, scribble-circle, scribble-ellipse-double, highlighter-stroke, underline-squiggle, checkerboard-strip, dot-field-fade, ticket-frame | SVG glyph, currentColor | n/a | none | Pass (plus and ring: one variant; checkerboard and dot-field: two, a third blocked by the model's filter) |
| gif/: torus-rotate, halftone-ball-spin, arrow-draw-dark, sphere-grid-rotate | GIF micro-loop | n/a | none | Pass (torus v0 tumbled, replaced) |

In use on the page: hand-pointing-right (cover hint), stopwatch (Game 7). The rest are available for further composition. Halftone cutouts compress poorly (150–580 KB each); stack several only at 800 px.

Human sign-off: pending (Sahil).
