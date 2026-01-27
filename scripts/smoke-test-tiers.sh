#!/usr/bin/env bash
# Smoke tests for tiered coaching output contracts.
# Requires: the dev server running on localhost:3000, and a sample.txt fixture.
set -euo pipefail

BASE="http://localhost:3000"
FIXTURE="fixtures/belief-driven-embodied.txt"
PASS=0
FAIL=0

pass() { echo "  ✓ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL + 1)); }

echo "═══ Tier smoke tests ═══"
echo ""

# ── Test 1: Free tier returns report with reader-reaction-style headline ──
echo "Test 1: Free tier report"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/test-analysis" \
  -F "file=@$FIXTURE" -F "tier=free")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  pass "HTTP 200"
else
  fail "HTTP $HTTP_CODE (expected 200)"
fi

# Check headline does NOT start with "Your essay needs"
HEADLINE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('student_output',{}).get('headline',''))" 2>/dev/null || echo "")
if echo "$HEADLINE" | grep -qi "^Your essay needs"; then
  fail "Headline starts with 'Your essay needs' — should be reader-reaction style"
else
  pass "Headline does NOT start with 'Your essay needs'"
fi

# Check concept_taught exists
CONCEPT=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('student_output',{}).get('concept_taught',''))" 2>/dev/null || echo "")
if [ -n "$CONCEPT" ]; then
  pass "concept_taught is present"
else
  fail "concept_taught is empty"
fi

# Check questions_for_student is empty (Free tier)
Q_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('student_output',{}).get('questions_for_student',[])))" 2>/dev/null || echo "0")
if [ "$Q_COUNT" = "0" ]; then
  pass "No follow-up questions (Free tier)"
else
  fail "Free tier returned $Q_COUNT questions (expected 0)"
fi

# Check reader_reaction exists
HAS_RR=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if 'reader_reaction' in d else 'no')" 2>/dev/null || echo "no")
if [ "$HAS_RR" = "yes" ]; then
  pass "reader_reaction present in output"
else
  fail "reader_reaction missing from output"
fi

echo ""

# ── Test 2: Plus tier returns report with revision paths ──
echo "Test 2: Plus tier report"
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/test-analysis" \
  -F "file=@$FIXTURE" -F "tier=plus")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  pass "HTTP 200"
else
  fail "HTTP $HTTP_CODE (expected 200)"
fi

# Check revision_paths has 2 items
RP_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('student_output',{}).get('revision_paths',[])))" 2>/dev/null || echo "0")
if [ "$RP_COUNT" = "2" ]; then
  pass "Plus has 2 revision paths"
else
  fail "Plus has $RP_COUNT revision paths (expected 2)"
fi

# Check questions exist
Q_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('student_output',{}).get('questions_for_student',[])))" 2>/dev/null || echo "0")
if [ "$Q_COUNT" -ge 1 ]; then
  pass "Plus has $Q_COUNT questions for student"
else
  fail "Plus has no questions (expected 1-2)"
fi

echo ""

# ── Test 3: Pro chat returns mode=chat with coaching message ──
echo "Test 3: Pro chat"
ESSAY_TEXT=$(cat "$FIXTURE")
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/pro-chat" \
  -H "Content-Type: application/json" \
  -d "{\"essay_text\": $(python3 -c "import json; print(json.dumps(open('$FIXTURE').read()))"), \"user_message\": \"Please coach me on this essay.\"}")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  pass "HTTP 200"
else
  fail "HTTP $HTTP_CODE (expected 200)"
fi

# Check mode=chat
MODE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('mode',''))" 2>/dev/null || echo "")
if [ "$MODE" = "chat" ]; then
  pass "mode=chat"
else
  fail "mode='$MODE' (expected 'chat')"
fi

# Check coach_message_markdown exists and contains a question mark
MSG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('coach_message_markdown',''))" 2>/dev/null || echo "")
if [ -n "$MSG" ]; then
  pass "coach_message_markdown is present"
else
  fail "coach_message_markdown is empty"
fi

# Check for question mark in message or questions array
HAS_Q=$(echo "$BODY" | python3 -c "
import sys,json
d=json.load(sys.stdin)
msg=d.get('coach_message_markdown','')
qs=d.get('questions',[])
has_q = '?' in msg or any('?' in q for q in qs)
print('yes' if has_q else 'no')
" 2>/dev/null || echo "no")
if [ "$HAS_Q" = "yes" ]; then
  pass "Pro response contains at least one question"
else
  fail "Pro response has no questions"
fi

# Check first 120 chars do NOT contain "Your essay needs"
FIRST_120=$(echo "$MSG" | head -c 120)
if echo "$FIRST_120" | grep -qi "Your essay needs"; then
  fail "Pro opens with 'Your essay needs' — should be reader-reaction"
else
  pass "Pro does NOT open with 'Your essay needs'"
fi

# Check internal_rubric exists (hidden from UI but in JSON)
HAS_RUBRIC=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if 'internal_rubric' in d else 'no')" 2>/dev/null || echo "no")
if [ "$HAS_RUBRIC" = "yes" ]; then
  pass "internal_rubric present (hidden from UI)"
else
  fail "internal_rubric missing from Pro response"
fi

echo ""

# ── Summary ──
echo "═══ Results: $PASS passed, $FAIL failed ═══"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
