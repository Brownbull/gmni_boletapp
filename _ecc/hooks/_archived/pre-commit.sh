#!/bin/bash
# pre-commit hook — Branch guard + secrets scan + test:quick + clean-state
# D-001: block direct commits to main/develop
# D-NEW-01: gitleaks secrets scan (graceful skip if not installed)
# D-NEW-02: test:quick gate before commit
# D-NEW-03: unstaged files warning (warn only)

# --- Branch guard ---
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
for pb in main develop master; do
  if [ "$BRANCH" = "$pb" ]; then
    echo "[HOOK] Direct commit to '$BRANCH' blocked."
    echo "  All development must happen on a feature branch."
    echo "  Start one: git checkout -b feat/your-story-name"
    exit 1
  fi
done

# --- Secrets scan (gitleaks) ---
if command -v gitleaks >/dev/null 2>&1; then
  if ! gitleaks git --staged 2>/dev/null; then
    echo "[HOOK] SECRETS DETECTED. Commit blocked." >&2
    echo "  Run: gitleaks git --staged  for details" >&2
    exit 1
  fi
else
  echo "[HOOK] gitleaks not installed — secrets scan skipped."
  echo "  Install: brew install gitleaks"
fi

# --- test:quick gate ---
PROJ="${CLAUDE_PROJECT_DIR:-.}"
if [ -f "$PROJ/package.json" ] && grep -q '"test:quick"' "$PROJ/package.json" 2>/dev/null; then
  cd "$PROJ" || exit 0
  npm run test:quick 2>&1 | tail -5
  if [ "${PIPESTATUS[0]}" -ne 0 ]; then
    echo "[HOOK] test:quick failed. Fix tests before commit." >&2
    exit 1
  fi
fi

# --- Clean state warning (warn only, not block) ---
unstaged=$(git diff --name-only 2>/dev/null | wc -l | tr -d ' ')
if [ "$unstaged" -gt "0" ]; then
  echo "[HOOK] WARNING: $unstaged unstaged file(s) not in this commit:"
  git diff --name-only | sed 's/^/  /' >&2
  echo "  Stage with 'git add' or stash with 'git stash'." >&2
fi

exit 0
