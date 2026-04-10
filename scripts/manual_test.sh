#!/bin/bash
set -euo pipefail

BASE_URL="http://localhost:3000"
API_URL="http://localhost:3001"
AUTH_HEADER="Authorization: Bearer test-token-123"
PASS=0
FAIL=0

check() {
  local description="$1"
  local result="$2"
  if [ "$result" = "true" ]; then
    echo "  ✓ $description"
    PASS=$((PASS + 1))
  else
    echo "  ✗ $description"
    FAIL=$((FAIL + 1))
  fi
}

echo "═══════════════════════════════════════════════════════"
echo "  MANUAL TEST PLAN — KOTOBA"
echo "═══════════════════════════════════════════════════════"
echo ""

# ─── 0. Authentication ──────────────────────────────────
echo "0. Authentication"

LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"testpassword123"}' "$API_URL/api/v1/sessions")
LOGIN_STATUS=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys,json;print('ok' if 'auth_token' in json.load(sys.stdin) else 'fail')" 2>/dev/null)
check "Login returns auth token" "$([ "$LOGIN_STATUS" = "ok" ] && echo true || echo false)"

SIGNUP_EMAIL="manual_test_$(date +%s)@example.com"
SIGNUP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d "{\"display_name\":\"New\",\"email\":\"$SIGNUP_EMAIL\",\"password\":\"password123\"}" "$API_URL/api/v1/sessions/signup")
check "Signup creates new learner" "$([ "$SIGNUP_STATUS" = "201" ] && echo true || echo false)"

BAD_LOGIN=$(curl -s -o /dev/null -w "%{http_code}" -X POST -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"wrong"}' "$API_URL/api/v1/sessions")
check "Bad login returns 401" "$([ "$BAD_LOGIN" = "401" ] && echo true || echo false)"

NO_AUTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/v1/progress")
check "Unauthenticated request returns 401" "$([ "$NO_AUTH" = "401" ] && echo true || echo false)"

echo ""

# ─── 1. Backend Health ──────────────────────────────────
echo "1. Backend Health"

HEALTH=$(curl -s -H "$AUTH_HEADER" -o /dev/null -w "%{http_code}" "$API_URL/api/v1/curriculum?language_code=ja")
check "Curriculum endpoint responds 200" "$([ "$HEALTH" = "200" ] && echo true || echo false)"

FIRST_LESSON_ID=$(curl -s -H "$AUTH_HEADER" "$API_URL/api/v1/curriculum?language_code=ja" | python3 -c "import sys,json;levels=json.load(sys.stdin);print(levels[0]['curriculum_units'][0]['lessons'][0]['id'])" 2>/dev/null)
LESSONS=$(curl -s -H "$AUTH_HEADER" -o /dev/null -w "%{http_code}" "$API_URL/api/v1/lessons/$FIRST_LESSON_ID")
check "Lessons endpoint responds 200" "$([ "$LESSONS" = "200" ] && echo true || echo false)"

PROGRESS=$(curl -s -H "$AUTH_HEADER" -o /dev/null -w "%{http_code}" "$API_URL/api/v1/progress")
check "Progress endpoint responds 200" "$([ "$PROGRESS" = "200" ] && echo true || echo false)"

REVIEWS=$(curl -s -H "$AUTH_HEADER" -o /dev/null -w "%{http_code}" "$API_URL/api/v1/reviews")
check "Reviews endpoint responds 200" "$([ "$REVIEWS" = "200" ] && echo true || echo false)"

CONTENT_PACK=$(curl -s -H "$AUTH_HEADER" -o /dev/null -w "%{http_code}" "$API_URL/api/v1/content_packs/latest?language_code=ja")
check "Content packs endpoint responds 200" "$([ "$CONTENT_PACK" = "200" ] && echo true || echo false)"

JLPT=$(curl -s -H "$AUTH_HEADER" -o /dev/null -w "%{http_code}" "$API_URL/api/v1/progress/jlpt_comparison?language_code=ja")
check "JLPT comparison endpoint responds 200" "$([ "$JLPT" = "200" ] && echo true || echo false)"

# ─── 2. Frontend Pages ──────────────────────────────────
echo ""
echo "2. Frontend Pages"

DASH=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/dashboard")
check "Dashboard page loads" "$([ "$DASH" = "200" ] && echo true || echo false)"

LOGIN_PAGE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/login")
check "Login page loads" "$([ "$LOGIN_PAGE" = "200" ] && echo true || echo false)"

SIGNUP_PAGE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/signup")
check "Signup page loads" "$([ "$SIGNUP_PAGE" = "200" ] && echo true || echo false)"

REVIEW_PAGE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/review")
check "Review page loads" "$([ "$REVIEW_PAGE" = "200" ] && echo true || echo false)"

PLACEMENT_PAGE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/placement")
check "Placement page loads" "$([ "$PLACEMENT_PAGE" = "200" ] && echo true || echo false)"

SETTINGS_PAGE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/settings")
check "Settings page loads" "$([ "$SETTINGS_PAGE" = "200" ] && echo true || echo false)"

PROGRESS_PAGE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/progress")
check "Progress page loads" "$([ "$PROGRESS_PAGE" = "200" ] && echo true || echo false)"

WRITING_PAGE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/writing/1")
check "Writing page loads" "$([ "$WRITING_PAGE" = "200" ] && echo true || echo false)"

SPEAKING_PAGE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/speaking/1")
check "Speaking page loads" "$([ "$SPEAKING_PAGE" = "200" ] && echo true || echo false)"

# ─── 3. PWA ──────────────────────────────────
echo ""
echo "3. PWA"

MANIFEST=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/manifest.json")
check "PWA manifest accessible" "$([ "$MANIFEST" = "200" ] && echo true || echo false)"

MANIFEST_NAME=$(curl -s "$BASE_URL/manifest.json" | python3 -c "import sys,json;print(json.load(sys.stdin).get('name',''))" 2>/dev/null)
check "PWA manifest has correct name" "$([ "$MANIFEST_NAME" = "Kotoba — Learn Japanese" ] && echo true || echo false)"

# ─── 4. New API Endpoints ──────────────────────────────────
echo ""
echo "4. New API Endpoints"

REVIEW_STATS=$(curl -s -H "$AUTH_HEADER" -o /dev/null -w "%{http_code}" "$API_URL/api/v1/reviews/stats")
check "Review stats endpoint responds 200" "$([ "$REVIEW_STATS" = "200" ] && echo true || echo false)"

REVIEW_FILTERED=$(curl -s -H "$AUTH_HEADER" -o /dev/null -w "%{http_code}" "$API_URL/api/v1/reviews?card_type=kanji&time_budget=5")
check "Review filtered endpoint responds 200" "$([ "$REVIEW_FILTERED" = "200" ] && echo true || echo false)"

WRITING_HISTORY=$(curl -s -H "$AUTH_HEADER" -o /dev/null -w "%{http_code}" "$API_URL/api/v1/writing/history")
check "Writing history endpoint responds 200" "$([ "$WRITING_HISTORY" = "200" ] && echo true || echo false)"

LIBRARY=$(curl -s -H "$AUTH_HEADER" -o /dev/null -w "%{http_code}" "$API_URL/api/v1/library?language_code=ja")
check "Library endpoint responds 200" "$([ "$LIBRARY" = "200" ] && echo true || echo false)"

LIBRARY_RECOMMENDED=$(curl -s -H "$AUTH_HEADER" -o /dev/null -w "%{http_code}" "$API_URL/api/v1/library?language_code=ja&recommended=true")
check "Library recommended endpoint responds 200" "$([ "$LIBRARY_RECOMMENDED" = "200" ] && echo true || echo false)"

READING_STATS=$(curl -s -H "$AUTH_HEADER" -o /dev/null -w "%{http_code}" "$API_URL/api/v1/library/reading_stats")
check "Reading stats endpoint responds 200" "$([ "$READING_STATS" = "200" ] && echo true || echo false)"

# ─── 5. Data Integrity ──────────────────────────────────
echo ""
echo "5. Data Integrity"

CURRICULUM_DATA=$(curl -s -H "$AUTH_HEADER" "$API_URL/api/v1/curriculum?language_code=ja")
LEVEL_COUNT=$(echo "$CURRICULUM_DATA" | python3 -c "import sys,json;print(len(json.load(sys.stdin)))" 2>/dev/null)
check "At least 4 curriculum levels seeded" "$([ "$LEVEL_COUNT" -ge 4 ] 2>/dev/null && echo true || echo false)"

REVIEW_DATA=$(curl -s -H "$AUTH_HEADER" "$API_URL/api/v1/reviews")
check "Due SRS cards returned" "$(echo "$REVIEW_DATA" | python3 -c "import sys,json;d=json.load(sys.stdin);print(str(len(d)>0).lower())" 2>/dev/null)"

STATS_DATA=$(curl -s -H "$AUTH_HEADER" "$API_URL/api/v1/reviews/stats")
check "Stats include burned count" "$(echo "$STATS_DATA" | python3 -c "import sys,json;d=json.load(sys.stdin);print(str('burned' in d).lower())" 2>/dev/null)"

JLPT_DATA=$(curl -s -H "$AUTH_HEADER" "$API_URL/api/v1/progress/jlpt_comparison?language_code=ja")
TOTAL=$(echo "$JLPT_DATA" | python3 -c "import sys,json;print(json.load(sys.stdin).get('total_levels',0))" 2>/dev/null)
check "JLPT mapper reports 12 total levels" "$([ "$TOTAL" = "12" ] && echo true || echo false)"

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  RESULTS: $PASS passed, $FAIL failed"
echo "═══════════════════════════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
