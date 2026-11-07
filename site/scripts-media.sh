#!/usr/bin/env bash
# Build web renditions of the reviewed illustration plates (media-src/v2 → public/media/v2).
set -euo pipefail
cd "$(dirname "$0")"
SRC=media-src/v2
OUT=public/media/v2
mkdir -p "$OUT"
for f in "$SRC"/*.png; do
  name=$(basename "$f" .png)
  cwebp -quiet -q 84 -resize 2400 0 "$f" -o "$OUT/$name-2400.webp"
  cwebp -quiet -q 82 -resize 1600 0 "$f" -o "$OUT/$name-1600.webp"
  cwebp -quiet -q 80 -resize 800 0 "$f" -o "$OUT/$name-800.webp"
done
# grain tile: small and seamless
cwebp -quiet -q 60 -resize 512 0 "$SRC/grain.png" -o "$OUT/grain-512.webp"
du -ch "$OUT"/*.webp | tail -1
