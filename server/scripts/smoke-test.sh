#!/bin/bash
# ============================================================
# 搞定800词 · 接口冒烟测试
# 用法: bash scripts/smoke-test.sh [BASE_URL]
# 默认 BASE_URL=http://localhost:3000
# ============================================================

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0

check() {
  local label="$1"
  local method="$2"
  local url="$3"
  local data="$4"
  local expect="${5:-0}"

  echo -n "  [$label] $method $url ... "

  if [ -z "$data" ]; then
    resp=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$url" 2>/dev/null)
  else
    resp=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$url" \
      -H "Content-Type: application/json" -d "$data" 2>/dev/null)
  fi

  http_code=$(echo "$resp" | tail -1)
  body=$(echo "$resp" | sed '$d')
  api_code=$(echo "$body" | python3 -c "import json,sys; print(json.load(sys.stdin).get('code','?'))" 2>/dev/null || echo "?")

  if [ "$http_code" = "200" ] && [ "$api_code" = "$expect" ]; then
    echo "✅ PASS"
    PASS=$((PASS + 1))
  else
    echo "❌ FAIL (HTTP=$http_code, code=$api_code)"
    echo "     Response: ${body:0:120}"
    FAIL=$((FAIL + 1))
  fi
}

echo "=========================================="
echo " 搞定800词 · 接口冒烟测试"
echo " BASE_URL = $BASE_URL"
echo "=========================================="

# 1. Health
check "health"     GET  "/api/health"                              ""       "0"

# 2. Dev login
TOKEN=""
TOKEN=$(curl -s -X POST "$BASE_URL/api/auth/dev-login" \
  -H "Content-Type: application/json" \
  -d '{"nickname":"SmokeTest"}' 2>/dev/null | \
  python3 -c "import json,sys; print(json.load(sys.stdin).get('data',{}).get('token',''))" 2>/dev/null)

if [ -n "$TOKEN" ]; then
  echo "  [dev-login] POST /api/auth/dev-login ... ✅ PASS (token=${TOKEN:0:20}...)"
  PASS=$((PASS + 1))
else
  echo "  [dev-login] POST /api/auth/dev-login ... ❌ FAIL"
  FAIL=$((FAIL + 1))
fi

# 3. Categories
check "categories" GET  "/api/vocabs/categories"   ""       "0"

# 4. Today check-in
check "check-in"   GET  "/api/check-in/today"  ""  "0" \
  && echo "     (需认证，此项预期 HTTP=401; 属于正常)"

# 5. Wrong answers
check "wrong-ans"  GET  "/api/wrong-answers"   ""  "0" \
  && echo "     (需认证，此项预期 HTTP=401; 属于正常)"

echo ""
echo "=========================================="
echo " 结果: $PASS 通过 / $((PASS + FAIL)) 总计"
echo "=========================================="
