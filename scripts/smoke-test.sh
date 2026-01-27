#!/usr/bin/env bash
# Smoke test for /api/test-analysis POST endpoint.
# Usage: bash scripts/smoke-test.sh [BASE_URL]
# Requires: curl
set -euo pipefail

BASE="${1:-http://localhost:3000}"
ENDPOINT="${BASE}/api/test-analysis"
PROMPT="Analyze this essay for clarity and narrative structure."

echo "=== Smoke test: $ENDPOINT ==="

for file in fixtures/sample.txt fixtures/sample.pdf fixtures/sample.docx; do
  ext="${file##*.}"
  echo ""
  echo "--- $ext ---"
  status=$(curl -s -o /tmp/smoke-resp.json -w "%{http_code}" \
    -F "prompt=$PROMPT" \
    -F "file=@$file" \
    "$ENDPOINT")
  echo "HTTP $status"
  head -c 200 /tmp/smoke-resp.json
  echo ""
done

echo ""
echo "=== Done ==="
