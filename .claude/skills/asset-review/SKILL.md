---
name: asset-review
description: Write a Higgsfield prompt for a shot-list row, or review a delivered image/clip against the media rules and log it in site/public/media/REVIEW.md. Use for every generated asset before it is committed.
---

# asset-review

Input: a shot-list row, or a delivered file. Output: a finished prompt with the constraints line appended, or a pass/fail row in `site/public/media/REVIEW.md`.

## Style (pass 3, 2026-11-07; the current direction)
Retro-futurist editorial collage. Light chapters: pale pink-beige paper, electric-blue (#2B3BFF) wireframe 3D geometry, black halftone-dithered photo cutouts, 3–5 sparkle glyphs, dotted grid panels, thin inner frames with mono captions. Dark chapters (Vox register): olive-black ground with yellow speckle, hand-drawn white arrows, yellow highlighter strokes and rough circles, yellow discs for key numbers. No gradients, chrome, neon or bevels. Full brief and prompt style strings: `site/DESIGN.md`. Generated at 4K with GPT Image 2.6 (quality xhigh); SVG glyphs via its svg output; GIF micro-loops via its gif output. Halftone cutouts of marble busts are fine; human faces are not.

Constraints line to append to every prompt:
`No people with visible faces, no logos, no jersey numbers, no text, no numbers, no watermarks.`

## Checklist (all must pass)
- [ ] No identifiable face or real player (silhouettes, backs, hands, ball, court, light only)
- [ ] No team or league logo, wordmark, jersey number
- [ ] No team color pairing (no wine-and-gold, no blue-and-gold)
- [ ] No text, digits or clocks baked in (all text is live HTML)
- [ ] Format and size as specified; WebP renditions (2400/1600/800) built with `site/scripts-media.sh`; loops transcoded with ffmpeg to H.264 1600 and 960 wide, logged in `site/public/media/v2/LOOPS.md`
- [ ] Row added to REVIEW.md with reviewer and date

Anything borderline is regenerated, never cropped. The 2016 paper's portrait and player photos stay out of the repo.
