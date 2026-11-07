# Media review log

Every shipped file is checked against the asset-review checklist: no identifiable faces or real players,
no team or league logos, wordmarks or jersey numbers, no team color pairings, no text or digits baked into
the image. Anything borderline is regenerated, not cropped.

## Set v2 (design pass 2, 7 Nov 2026)

Generated with GPT Image 2.6 (4K, xhigh) via Higgsfield in a flat screen-print illustration style.
Palette: navy, ball orange and cream for arena scenes; chalk, steel blue and orange for the graphics-desk scenes.
Sources in `site/media-src/v2/` (PNG, 3840 px, not deployed); shipped renditions are WebP at 2400, 1600 and 800 px in `public/media/v2/`.

| File | Scene | Faces | Logos / numbers | Text | Colors | Result | Reviewer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| hero-wide | Cold open, Act 2 beat 2, social image | Stylized silhouettes, non-identifiable generic figures | Plain uniforms, none | None | Navy, orange, cream | Pass | Claude, 2026-11-07 |
| hero-tall | Phone hero (reserved) | Stylized silhouettes, non-identifiable | None | None | Navy, orange, cream | Pass | Claude |
| plate-paper | Act 1 plate, cold-open final beat | n/a | None | Grey blocks, no letters | Chalk, steel, grey, orange pencil | Pass | Claude |
| plate-arena | Act 2 plate, Act 2 beat 1 | None | Scoreboard blurred, no digits | None | Navy, orange, cream | Pass | Claude |
| plate-shotchart | Act 3 plate | n/a | None | None | Chalk, steel, orange | Pass | Claude |
| g-block | Act 2 beat 3 | Stylized silhouettes, non-identifiable generic figures | Plain uniforms, none | None | Navy, orange, cream | Pass | Claude |
| g-confetti | Act 2 beat 4 | None | None | None | Navy, orange, cream | Pass | Claude |
| g-lights | Act 2 beat 5, backlash background | None | None | None | Navy, orange, cream | Pass | Claude |
| split | Report card plate | n/a | None | None | Chalk, grey, steel, orange | Pass | Claude |
| dawn | Act 2 beat 6, epilogue | None | None | None | Chalk, steel, orange | Pass | Claude |
| cover | Cover art (replaces the 2016 portrait) | Back of head only | Plain jersey, none | None | Chalk, steel, orange | Pass | Claude |
| grain | Texture tile (unused unless noted) | n/a | None | None | Grey | Pass | Claude |

Animated loops (Cinema Studio 3.0, image-to-video from the plates above, no audio) are logged in `public/media/v2/LOOPS.md` when added.

Set v1 (risograph, neo-brutalist pass) was retired on 7 Nov 2026 and removed from the deploy folder.

Human sign-off: pending (Sahil). Mark each row with your initials and date once reviewed.

Second wave (same style, 7 Nov 2026): `hero-wide-b` (shooter fully from behind; spare hero), `season-arcs` (lone shooter, dozens of dotted arcs; reserved for a future scene), `four-balls` (spare), `arc-icon` (single shot arc on a court, spare), `social` (social card source; cropped to `public/og.jpg` 1200×630), `desk` (graphics-desk still life, spare). All pass: no faces, logos, numbers or text. Note on `hero-wide` and `g-block`: the figures are generic illustrated silhouettes with stylized features, not likenesses of any player; `hero-wide-b` is the stricter alternative if a reviewer disagrees.
