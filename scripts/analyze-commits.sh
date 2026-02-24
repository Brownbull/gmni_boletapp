#!/usr/bin/env bash
# analyze-commits.sh — Layer 2 commit archaeology detection script
#
# Usage: bash analyze-commits.sh <repo-path> [output-dir]
#
# Produces:
#   churn-map.md       — top 20 most-touched files
#   blast-radius.md    — commits touching >20 files
#   revert-log.md      — revert/rollback/removal commits
#   monthly-velocity.md — commit count by month
#
# Run this on any git repo. Output feeds Layer 2 pattern classification.
# See: docs/layer2/00-methodology.md

set -e

REPO="${1:?Usage: analyze-commits.sh <repo-path> [output-dir]}"
OUTPUT_DIR="${2:-./layer2-analysis}"

if [ ! -d "$REPO/.git" ]; then
  echo "ERROR: $REPO is not a git repository"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

echo "Analyzing $REPO → $OUTPUT_DIR"
echo ""

# ── 1. Churn Map ──────────────────────────────────────────────────────────────
#
# Non-code tracking files (sprint-status, workflow costs, etc.) are expected
# to have high churn — the app code has no dependency on them. They indicate
# process overhead (L2-006), not code instability (L2-004).
# They are separated into a second table so both signals remain visible.

# Patterns for process/tracking files (no code dependency):
PROCESS_PATTERNS="_bmad-output/|sprint-status|docs/sprint-artifacts|docs/behavioral-health|docs/test-health"

echo "## File Churn Map" > "$OUTPUT_DIR/churn-map.md"
echo "" >> "$OUTPUT_DIR/churn-map.md"
echo "### Code Files (gravity well candidates)" >> "$OUTPUT_DIR/churn-map.md"
echo "Files appearing >20 times are gravity wells — only counts if application code depends on them." >> "$OUTPUT_DIR/churn-map.md"
echo "" >> "$OUTPUT_DIR/churn-map.md"
echo "| Touches | File |" >> "$OUTPUT_DIR/churn-map.md"
echo "|---------|------|" >> "$OUTPUT_DIR/churn-map.md"

git -C "$REPO" log \
  --name-only \
  --pretty=format: \
  | grep -v '^$' \
  | grep -vE "$PROCESS_PATTERNS" \
  | sort \
  | uniq -c \
  | sort -rn \
  | head -20 \
  | awk '{ printf "| %s | %s |\n", $1, $2 }' \
  >> "$OUTPUT_DIR/churn-map.md"

echo "" >> "$OUTPUT_DIR/churn-map.md"
echo "### Process/Tracking Files (L2-006 overhead signal)" >> "$OUTPUT_DIR/churn-map.md"
echo "Sprint tracking, workflow costs, monitoring output — high churn is expected." >> "$OUTPUT_DIR/churn-map.md"
echo "Flag if count exceeds 2x average story count (process consuming disproportionate commits)." >> "$OUTPUT_DIR/churn-map.md"
echo "" >> "$OUTPUT_DIR/churn-map.md"
echo "| Touches | File |" >> "$OUTPUT_DIR/churn-map.md"
echo "|---------|------|" >> "$OUTPUT_DIR/churn-map.md"

git -C "$REPO" log \
  --name-only \
  --pretty=format: \
  | grep -v '^$' \
  | grep -E "$PROCESS_PATTERNS" \
  | sort \
  | uniq -c \
  | sort -rn \
  | head -10 \
  | awk '{ printf "| %s | %s |\n", $1, $2 }' \
  >> "$OUTPUT_DIR/churn-map.md"

echo "Generated: churn-map.md"

# ── 2. Blast Radius (commits touching >20 files) ─────────────────────────────

echo "## Blast-Radius Commits (>20 files)" > "$OUTPUT_DIR/blast-radius.md"
echo "" >> "$OUTPUT_DIR/blast-radius.md"
echo "Commits with large scope. >20 files = compressed debt. >50 files = architectural event." >> "$OUTPUT_DIR/blast-radius.md"
echo "" >> "$OUTPUT_DIR/blast-radius.md"
echo "| Files Changed | Hash | Date | Message |" >> "$OUTPUT_DIR/blast-radius.md"
echo "|--------------|------|------|---------|" >> "$OUTPUT_DIR/blast-radius.md"

git -C "$REPO" log \
  --format="%H %ai %s" \
  | while read -r hash date time tz message; do
      count=$(git -C "$REPO" diff-tree --no-commit-id -r --name-only "$hash" 2>/dev/null | wc -l)
      if [ "$count" -gt 20 ]; then
        short_hash="${hash:0:8}"
        short_date="${date}"
        echo "| $count | $short_hash | $short_date | ${message:0:60} |"
      fi
    done \
  | sort -rn \
  >> "$OUTPUT_DIR/blast-radius.md"

echo "Generated: blast-radius.md"

# ── 3. Revert / Rollback / Removal Log ───────────────────────────────────────

echo "## Revert and Rollback Commits" > "$OUTPUT_DIR/revert-log.md"
echo "" >> "$OUTPUT_DIR/revert-log.md"
echo "Commits with revert/rollback/remove/undo in message. Each is a potential wrong-path signal." >> "$OUTPUT_DIR/revert-log.md"
echo "" >> "$OUTPUT_DIR/revert-log.md"
echo "| Date | Hash | Message |" >> "$OUTPUT_DIR/revert-log.md"
echo "|------|------|---------|" >> "$OUTPUT_DIR/revert-log.md"

git -C "$REPO" log \
  --format="%ai %h %s" \
  --all \
  | grep -iE "(revert|rollback|remove|undo|rewrite|abandon)" \
  | awk '{ printf "| %s | %s | %s |\n", $1, $4, substr($0, index($0,$5)) }' \
  >> "$OUTPUT_DIR/revert-log.md"

echo "Generated: revert-log.md"

# ── 4. Monthly Velocity ───────────────────────────────────────────────────────

echo "## Monthly Commit Velocity" > "$OUTPUT_DIR/monthly-velocity.md"
echo "" >> "$OUTPUT_DIR/monthly-velocity.md"
echo "Commits per month. Spikes indicate refactoring pressure or thrashing." >> "$OUTPUT_DIR/monthly-velocity.md"
echo "Normal feature velocity: steady growth. Spike = compression debt being paid." >> "$OUTPUT_DIR/monthly-velocity.md"
echo "" >> "$OUTPUT_DIR/monthly-velocity.md"
echo "| Month | Commits |" >> "$OUTPUT_DIR/monthly-velocity.md"
echo "|-------|---------|" >> "$OUTPUT_DIR/monthly-velocity.md"

git -C "$REPO" log \
  --format="%ai" \
  | awk '{ print substr($1, 1, 7) }' \
  | sort \
  | uniq -c \
  | awk '{ printf "| %s | %s |\n", $2, $1 }' \
  >> "$OUTPUT_DIR/monthly-velocity.md"

echo "Generated: monthly-velocity.md"

# ── 5. Dependency Direction Check (requires madge) ───────────────────────────

echo "## Dependency Direction (Circular Imports)" > "$OUTPUT_DIR/dependency-direction.md"
echo "" >> "$OUTPUT_DIR/dependency-direction.md"
echo "Detects Dependency Direction Drift (Tier B pattern #3)." >> "$OUTPUT_DIR/dependency-direction.md"
echo "Circular imports = clean-architecture dependency rules violated." >> "$OUTPUT_DIR/dependency-direction.md"
echo "Install madge: npm install -g madge" >> "$OUTPUT_DIR/dependency-direction.md"
echo "" >> "$OUTPUT_DIR/dependency-direction.md"

SRC_DIR="$REPO/src"
if command -v madge &> /dev/null && [ -d "$SRC_DIR" ]; then
  echo "### Circular dependencies" >> "$OUTPUT_DIR/dependency-direction.md"
  madge --circular "$SRC_DIR" >> "$OUTPUT_DIR/dependency-direction.md" 2>&1 || true
  echo "" >> "$OUTPUT_DIR/dependency-direction.md"
  echo "### Top-level dependency graph (text)" >> "$OUTPUT_DIR/dependency-direction.md"
  madge "$SRC_DIR" --no-color 2>/dev/null \
    | head -30 >> "$OUTPUT_DIR/dependency-direction.md" || true
  echo "Generated: dependency-direction.md"
else
  echo "madge not installed or src/ not found — skipping." \
    >> "$OUTPUT_DIR/dependency-direction.md"
  echo "Skipped: dependency-direction.md (install: npm install -g madge)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────

TOTAL_COMMITS=$(git -C "$REPO" log --oneline | wc -l)
echo ""
echo "─────────────────────────────────────────────────────"
echo "Analysis complete. $TOTAL_COMMITS total commits analyzed."
echo "Output: $OUTPUT_DIR/"
echo ""
echo "Next steps (from docs/layer2/00-methodology.md):"
echo "  1. Check churn-map.md — code files >20 touches = gravity well; process files = L2-006 signal"
echo "  2. Check blast-radius.md — any commit >50 files is a compression-debt event"
echo "  3. Check revert-log.md — any revert is a potential wrong-path spiral"
echo "  4. Classify each finding against the taxonomy in docs/layer2/00-code-patterns.md"
echo "─────────────────────────────────────────────────────"
