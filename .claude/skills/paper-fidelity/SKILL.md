---
name: paper-fidelity
description: Rebuild one of the 2016 paper's figures (1-1, 1-2, 2, 3) as Then and Now views, and place its margin notes. Use when a figure's Then view drifts from the original or a note needs anchoring.
---

# paper-fidelity

Input: a figure id. Output: Then and Now behavior inside the figure's chart module, plus margin-note anchors in `site/src/story/copy.ts`.

## Then view
- Same season range as the paper (1998–2016 by end year), same axis range (1-1: 13–29; 1-2: 5.0–9.0; 2: the two strips; 3: seven points).
- Original flaws are reproduced and labeled, never silently fixed: Figure 2's 24+ legend as a SUM (753.9–1,310.6) in grey with "original scale, see note"; Figure 3's y on the SUM scale with "likely a Tableau SUM across team rows (about 46×)".
- The first margin note on a figure is credit (the half-point match), not a correction.

## Now view
- Corrected scale, extended through the latest season, 2016 marker, peak and latest labeled.

## Fidelity check
- Appendix B of the PRD is the only source for the paper's text; `site/src/paper/transcription.md` must never be edited.
- Side by side with the paper photos, no text drift. Then-view axes reproduce the original's numbers.
