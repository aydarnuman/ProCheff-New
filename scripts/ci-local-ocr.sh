#!/usr/bin/env bash
set -euo pipefail

# CI helper: convert PDF -> PNG pages with pdftoppm and OCR with tesseract CLI
# Usage: ./scripts/ci-local-ocr.sh /path/to/file.pdf

PDF_PATH="$1"
OUT_DIR="${2:-tmp/ocr}"
mkdir -p "$OUT_DIR"

echo "PDF_PATH=$PDF_PATH"
if [ ! -f "$PDF_PATH" ]; then
  echo "ERROR: PDF not found: $PDF_PATH" >&2
  exit 2
fi

OUT_PREFIX="$OUT_DIR/page"
echo "Converting PDF pages to PNG with pdftoppm (...)"
pdftoppm -png -r 300 "$PDF_PATH" "$OUT_PREFIX"

echo "Running tesseract on each produced PNG"
COMBINED="$OUT_DIR/combined.txt"
: > "$COMBINED"

shopt -s nullglob
for f in "$OUT_DIR"/page-*.png; do
  echo "OCRing $f..."
  # Use tesseract to write to stdout; use Turkish+English languages if available
  if tesseract "$f" stdout -l tur+eng > /dev/null 2>&1; then
    tesseract "$f" stdout -l tur+eng >> "$COMBINED" 2>> "$OUT_DIR/ocr.log" || true
  else
    # fallback to English only if Turkish not available
    tesseract "$f" stdout -l eng >> "$COMBINED" 2>> "$OUT_DIR/ocr.log" || true
  fi
  echo -e "\n\n" >> "$COMBINED"
done

if [ ! -s "$COMBINED" ]; then
  echo "No OCR output produced" >&2
  exit 3
fi

echo "Combined OCR size: $(wc -c < "$COMBINED") bytes"
echo "Sample output:" 
head -c 1200 "$COMBINED" || true

# compress page images for artifact upload (optional)
tar -czf "$OUT_DIR/pages.tar.gz" -C "$OUT_DIR" --wildcards 'page-*.png' || true

echo "DONE. Outputs in: $OUT_DIR"
exit 0
