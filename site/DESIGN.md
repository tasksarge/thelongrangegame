# The Long Range Game, Revisited — design system (pass 3, 2026-11-07, revised to the user's references)

## Register
Retro-futurist editorial collage, the register of the neo-brutalist poster references and Vox's hand-drawn explainer art:
- Pale pink-beige paper with a fine speckle, electric blue as the single chromatic ink, black for type and cutouts.
- Halftone-dithered monochrome photo cutouts (a hand pointing, a hand palming a basketball, a hoop and net, a sneaker, a classical marble bust, a stopwatch, a clipboard) placed as collage elements with sparkle glyphs ✦ and small stars around them.
- Electric-blue wireframe 3D geometry (torus, sphere grid, cylinder, cone, gridded plane, a basketball drawn as a wireframe sphere, a three-point arc as a glowing blue curve) overlapping the cutouts.
- Dotted grids and dashed guide lines as background structure; small dense text blocks set in mono beside big condensed headlines.
- Dark chapters (Game 7, the night before, backlash) flip to Vox's olive-black ground with yellow speckle and hand-drawn white arrows pointing at the thing that matters; yellow discs hold key numbers.
- Motion explains: arrows draw, halftone cutouts slide in, wireframes rotate slowly, numbers count. Nothing bounces.

## Palette (tokens in src/styles/tokens.css)
| token | hex | role |
| --- | --- | --- |
| --paper | #EFE6E1 | light ground (pink-beige) |
| --paper-2 | #E4D9D3 | secondary light surface |
| --ink | #121212 | type, cutouts, outlines |
| --blue | #2B3BFF | electric blue: data ink, wireframes, the 2026 voice |
| --blue-2 | #1C27C9 | pressed / shadow blue |
| --olive | #23271A | dark ground (Vox) |
| --olive-2 | #2F3421 | dark surface |
| --sun | #F2DE4A | yellow: callouts, key-number discs, highlight |
| --chalk | #F5F1EC | text on dark |
| --steel | #2F5D8A | the 2016 paper's own heading color, used only inside the verbatim pages |
| --mist | #C9C1BC | rules on light |

## Type
- Display: Big Shoulders Display 800–900, letter-spacing -0.02em, line-height 0.88, often all-caps for 1–3 word titles (the poster register).
- UI: Archivo 500–700.
- Dense small text: mono (Space Mono via Google Fonts if available, else system mono), 12–13px, in short justified-looking blocks.
- Paper (2016 voice): Source Serif 4 inside the verbatim pages only.

## Shapes & texture
- Corner radius 0 on frames (poster), 999px on pills. Thin 1.5px ink frames around cutout panels are welcome (the reference's inner border).
- Speckle: one SVG feTurbulence overlay at ~12% on light, yellow-tinted at ~18% on dark.
- Dotted grid: radial-gradient 1px ink dots every 14px at ~35% opacity, in panels not full-bleed.
- Halftone fills in charts: SVG pattern of dots scaled by value instead of solid fills.
- No drop shadows. Depth from overlap, halftone, and a 3px offset duplicate in --blue behind black type on posters (sparingly).

## Motion (Emil Kowalski's rules)
- Curves: cubic-bezier(0.23,1,0.32,1) in/out; cubic-bezier(0.77,0,0.175,1) on-screen moves. Never ease-in.
- Chapter change 260ms slide+fade; beat change 200ms crossfade of what changed.
- Explanatory: arrows draw with stroke-dashoffset (600–900ms), wireframes rotate at 20s per turn, counters count.
- transform / opacity / clip-path / stroke-dashoffset only; press scale(.97) 160ms; reduced motion jumps to end states.

## Higgsfield prompt style strings
CUTOUT (append): "Monochrome halftone dithered photo cutout, high-contrast black ink dots on a transparent background, newspaper screen-print texture, isolated object with clean silhouette, retro-futurist collage element, no color, no text, no logos, no watermarks."
WIREFRAME (append): "Electric blue (#2B3BFF) 3D wireframe line drawing on a transparent background, thin even lines, retro-futurist vector look, no fill, no gradients, no text, no logos."
POSTER PLATE (append): "Retro-futurist neo-brutalist editorial poster collage: pale pink-beige paper (#EFE6E1) with fine speckle, electric blue (#2B3BFF) wireframe 3D shapes, black halftone-dithered photo cutouts, small sparkle and star glyphs, dotted grid and dashed guide lines, generous negative space on the stated side, no text, no letters, no numbers, no logos, no watermarks."
VOX PLATE (append): "Hand-drawn editorial illustration in the style of a Vox explainer: dark olive-black ground (#23271A) with yellow speckle texture and a faint dashed grid, white hand-drawn arrows with rough ink texture pointing toward a yellow disc (#F2DE4A), simple shapes, printmaking feel, no text, no letters, no numbers, no logos, no watermarks."

## Hard asset rules (unchanged)
No identifiable faces or real players (statue busts are fine; human faces are not); no team or league logos, wordmarks or jersey numbers; no team color pairings; no text or digits baked into media. Every shipped file logged in public/media/REVIEW.md.

## Structure: 7 chapters, tap or arrow through them
0 Cover · 1 Game 7, 0:53 · 2 The paper (5 pages, open, scroll within) · 3 The night before (6 beats) · 4 Ten years later (4 charts, beats) · 5 Report card · 6 Was 2024-25 the peak? (+ method, footer)
Hash routes #c0…#c6 (beat as #c3-2). Chapter bar on top, prev/next arrows, keyboard ←/→, swipe on touch.

## Research notes (Google image search, 2026-11-07, six queries around the two references)
Recurring motifs worth using, in priority order:
1. Halftone photo cutouts with a clean silhouette: hand pointing, hand palming a ball, hoop and net photographed from below (a signature image in every basketball-poster result), classical bust. Always monochrome ink, never tinted.
2. Electric-blue wireframe solids (torus, cylinder, sphere grid) and blue checkerboard / grid panels; one hot accent at most per composition.
3. Dot fields: halftone dots that fade from dense to sparse across a panel, used as texture behind a cutout.
4. Thin 1.5px inner frame panels with a tiny mono caption in a corner (the "label" look), and small ✦ sparkles and 4-point stars scattered sparingly (3 to 5 per composition, never a field of them).
5. Vox: yellow highlighter strokes behind the key phrase, a rough hand-drawn circle around the key number, white or yellow rough arrows pointing at it, dark grainy paper, paper-cutout photos on the dark ground, line charts annotated by hand.
6. Y2K chrome gradients, neon glows and 3D bevels appear in the results and are OUT: everything stays flat ink, blue, yellow, paper.

Translate to the site: headlines get a yellow highlighter sweep (an SVG rough rect behind the words, drawn on enter); the key number of each chapter sits in a yellow disc or a rough circle; charts get hand-drawn annotation arrows; cutouts sit in thin-framed panels with mono captions like "FIG. 1-1 · 1998–2016"; a checkerboard strip marks chapter transitions; dot fields fade behind cutouts.
