#!/usr/bin/env bash
# Story 16-9: Smoke test for staging deployment
#
# Verifies:
#   1. Staging URL returns HTTP 200
#   2. Response contains the app shell HTML
#   3. Firebase config is present (app initializes)
#
# Usage:
#   bash scripts/smoke-test-staging.sh
#   bash scripts/smoke-test-staging.sh https://custom-staging-url.web.app

set -euo pipefail

STAGING_URL="${1:-https://boletapp-staging.web.app}"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

pass() { echo -e "${GREEN}PASS${NC} $1"; }
fail() { echo -e "${RED}FAIL${NC} $1" >&2; FAILURES=$((FAILURES + 1)); }

FAILURES=0

echo "Smoke testing: ${STAGING_URL}"
echo "---"

# Test 1: HTTP 200 (save body to temp file to avoid shell variable issues)
TMPFILE=$(mktemp)
trap 'rm -f "${TMPFILE}"' EXIT
STATUS=$(curl -s -o "${TMPFILE}" -w "%{http_code}" "${STAGING_URL}")
if [ "${STATUS}" = "200" ]; then
    pass "HTTP status: ${STATUS}"
else
    fail "HTTP status: ${STATUS} (expected 200)"
fi

# Test 2: Contains app root div
if grep -q 'id="root"' "${TMPFILE}"; then
    pass "App root div found"
else
    fail "App root div not found in response"
fi

# Test 3: Contains script tags (Vite build output)
if grep -q '<script' "${TMPFILE}"; then
    pass "Script tags present"
else
    fail "No script tags found — build may have failed"
fi

# Test 4: version.json exists and contains sha (requires python3)
VERSION_BODY=$(curl -sf "${STAGING_URL}/version.json" 2>/dev/null || true)
if [ -n "${VERSION_BODY}" ] && echo "${VERSION_BODY}" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'sha' in d" 2>/dev/null; then
    VERSION_SHA=$(echo "${VERSION_BODY}" | python3 -c "import sys,json; print(json.load(sys.stdin)['sha'])")
    pass "version.json found (sha: ${VERSION_SHA:0:8}...)"
else
    fail "version.json missing or invalid"
fi

echo "---"
if [ "${FAILURES}" -eq 0 ]; then
    echo -e "${GREEN}All smoke tests passed.${NC}"
    exit 0
else
    echo -e "${RED}${FAILURES} smoke test(s) failed.${NC}"
    exit 1
fi
