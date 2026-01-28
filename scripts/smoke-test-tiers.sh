#!/usr/bin/env bash
# Smoke tests for tiered coaching output contracts.
# Requires: the dev server running on localhost:3000, and a fixture file.
set -euo pipefail

BASE="http://localhost:3000"
FIXTURE="fixtures/belief-driven-embodied.txt"
PASS=0
FAIL=0

pass() { echo "  ✓ $1"; PASS=$((PASS + 1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL + 1)); }

echo "═══ Tier smoke tests ═══"
echo ""

# ── Test 1: Free tier ──
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

HEADLINE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('student_output',{}).get('headline',''))" 2>/dev/null || echo "")
if echo "$HEADLINE" | grep -qi "^Your essay needs"; then
  fail "Headline starts with 'Your essay needs'"
else
  pass "Headline does NOT start with 'Your essay needs'"
fi

CONCEPT=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('student_output',{}).get('concept_taught',''))" 2>/dev/null || echo "")
if [ -n "$CONCEPT" ]; then
  pass "concept_taught is present"
else
  fail "concept_taught is empty"
fi

Q_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('student_output',{}).get('questions_for_student',[])))" 2>/dev/null || echo "0")
if [ "$Q_COUNT" = "0" ]; then
  pass "No follow-up questions (Free tier)"
else
  fail "Free tier returned $Q_COUNT questions (expected 0)"
fi

HAS_RR=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if 'reader_reaction' in d else 'no')" 2>/dev/null || echo "no")
if [ "$HAS_RR" = "yes" ]; then
  pass "reader_reaction present"
else
  fail "reader_reaction missing"
fi

echo ""

# ── Test 2: Plus tier ──
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

# Plus must have exactly 2 non-empty revision paths
python3 -c "
import sys, json
d = json.load(sys.stdin)
rp = d.get('student_output', {}).get('revision_paths', [])
count = len(rp)
non_empty = sum(1 for p in rp if p.get('description', '').strip())
if count == 2 and non_empty == 2:
    print('PASS')
else:
    print(f'FAIL count={count} non_empty={non_empty}')
" <<< "$BODY" | while read -r result; do
  if [ "$result" = "PASS" ]; then
    pass "Plus has 2 non-empty revision paths"
  else
    fail "Plus revision paths: $result (expected 2 non-empty)"
  fi
done

Q_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('student_output',{}).get('questions_for_student',[])))" 2>/dev/null || echo "0")
if [ "$Q_COUNT" -ge 1 ]; then
  pass "Plus has $Q_COUNT questions for student"
else
  fail "Plus has no questions (expected 1-2)"
fi

# Plus assignment should use experiment tone
INSTRUCTIONS=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('student_output',{}).get('one_assignment',{}).get('instructions',''))" 2>/dev/null || echo "")
if echo "$INSTRUCTIONS" | grep -qiE "let's try|as an experiment|i'm curious|curious what happens"; then
  pass "Plus assignment uses experiment framing"
else
  fail "Plus assignment missing experiment framing ('Let's try' / 'As an experiment' / 'I'm curious')"
fi

echo ""

# ── Test 3: Pro chat ──
echo "Test 3: Pro chat"
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

MODE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('mode',''))" 2>/dev/null || echo "")
if [ "$MODE" = "chat" ]; then
  pass "mode=chat"
else
  fail "mode='$MODE' (expected 'chat')"
fi

MSG=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('coach_message_markdown',''))" 2>/dev/null || echo "")
if [ -n "$MSG" ]; then
  pass "coach_message_markdown present"
else
  fail "coach_message_markdown empty"
fi

# Pro: first 200 chars must contain trust language
FIRST_200=$(echo "$MSG" | head -c 200)
if echo "$FIRST_200" | grep -qiE "I trust|I believe|I buy|I'm with you|trust you|believe you|draws me in|feel sincere|feels sincere|feels honest|feel honest"; then
  pass "Pro opens with trust language (first 200 chars)"
else
  fail "Pro missing trust language in first 200 chars: $(echo "$FIRST_200" | head -c 80)…"
fi

# Pro: first 60 chars start with first person
FIRST_60=$(echo "$MSG" | head -c 60)
if echo "$FIRST_60" | grep -qE "^I "; then
  pass "Pro opens with first person ('I …') in first 60 chars"
else
  fail "Pro does not open with 'I' in first 60 chars: $(echo "$FIRST_60" | head -c 40)…"
fi

# Pro: contains at least one question
HAS_Q=$(echo "$BODY" | python3 -c "
import sys,json
d=json.load(sys.stdin)
msg=d.get('coach_message_markdown','')
qs=d.get('questions',[])
has_q = '?' in msg or any('?' in q for q in qs)
print('yes' if has_q else 'no')
" 2>/dev/null || echo "no")
if [ "$HAS_Q" = "yes" ]; then
  pass "Pro contains at least one question"
else
  fail "Pro has no questions"
fi

# Pro: banned phrases
python3 -c "
import sys, json
d = json.load(sys.stdin)
msg = d.get('coach_message_markdown', '')
banned = [
    'Your essay needs', 'This essay lacks', 'surface level', 'list of events',
    'causal structure', 'psychological depth', 'show vs tell', 'show vs. tell',
    'turning point score', 'stakes and risk', 'narrative flow',
    'vulnerability and boundaries', 'tone and control',
]
found = [b for b in banned if b.lower() in msg.lower()]
if found:
    print('FAIL: ' + ', '.join(found))
else:
    print('PASS')
" <<< "$BODY" | while read -r result; do
  if [ "$result" = "PASS" ]; then
    pass "Pro avoids all banned/rubric phrases"
  else
    fail "Pro contains banned phrases — $result"
  fi
done

# Pro: internal_rubric exists
HAS_RUBRIC=$(echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print('yes' if 'internal_rubric' in d else 'no')" 2>/dev/null || echo "no")
if [ "$HAS_RUBRIC" = "yes" ]; then
  pass "internal_rubric present (hidden from UI)"
else
  fail "internal_rubric missing"
fi

echo ""

# ── Summary ──
echo "═══ Results: $PASS passed, $FAIL failed ═══"
if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
