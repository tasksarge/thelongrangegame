# Ambient loops, set v3 (7 Nov 2026)

Image-to-video with Cinema Studio 3.0 (`cinematic_studio_3_0`), start_image = the winning plate's job ID from
REVIEW.md, 8 s, 1080p, 21:9, genre drama, no audio. Each prompt kept the collage or Vox style exactly and moved one
thing, with "locked camera, no zoom, no pan, no new elements, no text" appended.

Source clips (1080p MP4 from Higgsfield) are in `site/media-src/v3/loops/<plate>-src.mp4`. Shipped files are H.264
(libx264, preset slow, yuv420p, faststart, no audio) at 1600 x 686 (crf 24) and 960 x 412 (crf 25), 24 fps, 8.04 s.

Review: frames at 0.2 s, 4 s and 7.6 s were extracted and checked for style drift, added text or faces, and warping of
the halftone cutout.

| Plate | Job ID | Motion asked for | Start / middle / end check | Result | Note |
| --- | --- | --- | --- | --- | --- |
| cover | 7b85199c-ea21-427e-ab92-b026b8bc3f6f | Torus rotates, sparkles twinkle, hand and ball still | Collage identical in all three frames, no text, hand undistorted | Pass | Torus motion is subtle in stills; reads as a slow turn in playback. |
| decade | 24d354e0-f1cc-41d0-a4b6-3c2760a279c5 | Dotted arcs travel toward the hoop, sphere spins | Travelling dashed trails appear from the left and reach the hoop by the end; hoop and backboard unchanged | Pass | Trails render heavier than the thin static arcs but stay electric blue and dotted. |
| epilogue | d7c4384d-b819-4fa3-8963-3716a1f4a037 | Arc draws from lower left to the ball, ball turns | Arc absent at start, fully drawn by the middle; ball seams rotate; grid and frame still | Pass | |
| report | c9e05d50-22a8-408b-9c82-98f70ec21d7e | Sphere rotates, check and X fade alternately | Bust pixel-stable, check and X vary in weight across frames | Pass | Most restrained clip; motion is ambient rather than demonstrative. |
| paper | b389932e-1e18-4b62-a614-1126db96830d | Pencil hand writes, cylinder rotates | Hand and pencil shift slightly between frames, page stays blank, no marks appear | Pass | |
| game7 | 6fc2e2b3-0ba0-4db4-a3a6-6a29a85923e0 | Arrows draw in from the edges, then the yellow circle | Start shows only arrowheads at the edges, middle shows arrows arrived and half the circle, end shows the full circle | Pass | |
| night | 1785b97f-7185-4cf7-ac5e-8acde68f0c18 | Arrow draws along the arc, then circle and highlighter | Start is empty ground with the arrow tail at lower left, middle has the arc landed, end adds circle and highlighter | Pass | |
| backlash | 790d506b-2052-4987-a0dc-6d528dc9dacc | X strokes draw left to right, then the two rings | Start shows six clean discs, middle four crossed, end adds both rings and the arrow | Pass | |

No clip needed regeneration.

## Credits

Balance 1033.74 before the eight submissions, 53.24 after: 980.50 credits, about 122.5 per 8-second 1080p clip
(other agents share the workspace, so treat this as an upper bound). The account now holds 53.24 credits, which is not
enough for another 1080p clip; top up before any regeneration or the hero-tall / portrait loops.

Human sign-off: pending (Sahil).
