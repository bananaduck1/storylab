#!/usr/bin/env bash
# Regression tests for rubric calibration: mode-aware scoring, no-lazy-critique, sanity checks.
# Usage: bash scripts/regression-test.sh [BASE_URL]
# Requires: curl, node (for JSON validation)
set -euo pipefail

BASE="${1:-http://localhost:3000}"
ENDPOINT="${BASE}/api/test-analysis"
PROMPT="Analyze this college essay."
PASS=0
FAIL=0
TOTAL=0

red()   { printf "\033[31m%s\033[0m\n" "$1"; }
green() { printf "\033[32m%s\033[0m\n" "$1"; }
bold()  { printf "\033[1m%s\033[0m\n" "$1"; }

assert() {
  TOTAL=$((TOTAL + 1))
  local desc="$1"
  local ok="$2"
  if [ "$ok" = "true" ]; then
    PASS=$((PASS + 1))
    green "  ✓ $desc"
  else
    FAIL=$((FAIL + 1))
    red   "  ✗ $desc"
  fi
}

run_fixture() {
  local label="$1"
  local file="$2"
  bold ""
  bold "━━━ $label ━━━"

  local status
  status=$(curl -s -o /tmp/regression-resp.json -w "%{http_code}" \
    -F "prompt=$PROMPT" \
    -F "file=@$file" \
    "$ENDPOINT")

  echo "  HTTP $status"

  # 1. HTTP 200
  assert "Returns HTTP 200" "$([ "$status" = "200" ] && echo true || echo false)"

  if [ "$status" != "200" ]; then
    echo "  Response:"
    head -c 500 /tmp/regression-resp.json
    echo ""
    return
  fi

  # 2. Valid JSON with required top-level keys
  local valid_schema
  valid_schema=$(node -e "
    const d = require('/tmp/regression-resp.json');
    const ok = d.schema_version === '1.0.0'
      && d.analysis && d.analysis.rubric_scores && d.analysis.rubric_scores.length === 8
      && d.student_output && d.student_output.headline
      && d.meta;
    console.log(ok ? 'true' : 'false');
  " 2>/dev/null || echo "false")
  assert "Valid schema structure" "$valid_schema"

  # 3. No lazy 'generic' in low-score notes/why_it_matters without anchor
  local generic_check
  generic_check=$(node -e "
    const d = require('/tmp/regression-resp.json');
    const scores = d.analysis.rubric_scores;
    let violations = 0;
    for (const rs of scores) {
      if (rs.score <= 3) {
        // Check notes
        if (/\bgeneric\b/i.test(rs.notes)) {
          // 'generic' is only allowed if the note also names what specific anchor is missing
          if (!/specific|anchor|particular|concrete|this essay/i.test(rs.notes)) {
            violations++;
          }
        }
        // Check evidence why_it_matters
        for (const ev of rs.evidence_spans || []) {
          if (/\bgeneric\b/i.test(ev.why_it_matters)) {
            if (!/specific|anchor|particular|concrete|this essay/i.test(ev.why_it_matters)) {
              violations++;
            }
          }
        }
      }
    }
    console.log(violations === 0 ? 'true' : 'false');
  " 2>/dev/null || echo "false")
  assert "No lazy 'generic' in low-score feedback" "$generic_check"

  # 4. Cross-rubric sanity: R002 not <=2 when R003,R004,R005 all >=4 (unless contradiction cited)
  local sanity_check
  sanity_check=$(node -e "
    const d = require('/tmp/regression-resp.json');
    const scores = {};
    for (const rs of d.analysis.rubric_scores) scores[rs.rubric_id] = rs;
    const r002 = scores['R002'], r003 = scores['R003'], r004 = scores['R004'], r005 = scores['R005'];
    if (r003.score >= 4 && r004.score >= 4 && r005.score >= 4 && r002.score <= 2) {
      // Violation unless R002 has evidence citing a contradiction
      console.log(r002.evidence_spans && r002.evidence_spans.length > 0 ? 'true' : 'false');
    } else {
      console.log('true');
    }
  " 2>/dev/null || echo "false")
  assert "Cross-rubric sanity (R002 vs R003/R004/R005)" "$sanity_check"

  # 5. Low-score notes specify what is missing (not just 'needs deeper/more')
  local specificity_check
  specificity_check=$(node -e "
    const d = require('/tmp/regression-resp.json');
    let violations = 0;
    for (const rs of d.analysis.rubric_scores) {
      if (rs.score <= 2) {
        // Notes must not be ONLY vague phrases
        const vague = /^(the essay )?(needs?|lacks?|could benefit from) (more |deeper |greater )?(depth|reflection|detail|specificity|exploration)\.?$/i;
        if (vague.test(rs.notes.trim())) {
          violations++;
        }
      }
    }
    console.log(violations === 0 ? 'true' : 'false');
  " 2>/dev/null || echo "false")
  assert "Low-score notes specify concrete missing elements" "$specificity_check"
}

bold "Rubric Calibration Regression Tests"
bold "Endpoint: $ENDPOINT"

run_fixture "Belief-driven + embodied" "fixtures/belief-driven-embodied.txt"
run_fixture "Narrative-conflict" "fixtures/narrative-conflict.txt"
run_fixture "Social-observation" "fixtures/social-observation.txt"

bold ""
bold "━━━ Summary ━━━"
echo "  $PASS/$TOTAL passed"
if [ "$FAIL" -gt 0 ]; then
  red "  $FAIL failed"
  exit 1
else
  green "  All passed"
fi
