#!/usr/bin/env bash
# behavioral-health-snapshot.sh — FF-C Behavioral Health Monitor
#
# Captures 3 behavioral signals after each epic completes.
# Run once per epic to build a time-series health record.
#
# Usage: bash behavioral-health-snapshot.sh <repo-path> <epic-label> [health-dir]
#   epic-label:  short label matching sprint-status.yaml, e.g. "epic-01"
#   health-dir:  default: docs/behavioral-health/ inside the repo
#
# Exit: 0=healthy, 1=1 warning, 2=2+ warnings (alert — generate correction story)
#
# Three signals (FF-C-behavioral-monitoring.md):
#   C1: Churn baseline — top-20 file churn snapshot + gravity well detection
#   C2: LOC trajectory — source line count delta (>15% = Accretion signal)
#   C3: Fix-to-feat ratio — fix: vs feat: commits in last 30 days (>1.2 = instability)
#
# Output files (in health-dir):
#   churn-snapshot-<epic>.md        — cumulative churn map at this snapshot
#   loc-trajectory.csv              — LOC over time (one row per epic)
#   health-metrics.csv              — fix:feat ratio over time
#   compound-reports/<epic>.md      — summary report for this snapshot

set -e

REPO="${1:?Usage: behavioral-health-snapshot.sh <repo-path> <epic-label> [health-dir]}"
EPIC="${2:?Usage: behavioral-health-snapshot.sh <repo-path> <epic-label> [health-dir]}"
HEALTH_DIR="${3:-$REPO/docs/behavioral-health}"
TODAY=$(date +%Y-%m-%d)
WARNINGS=0

[ -d "$REPO/.git" ] || { echo "ERROR: $REPO is not a git repository"; exit 1; }

mkdir -p "$HEALTH_DIR/compound-reports"
REPORT="$HEALTH_DIR/compound-reports/$EPIC.md"
printf "# Behavioral Health: %s (%s)\n\n" "$EPIC" "$TODAY" > "$REPORT"

# ── C1: Churn Baseline ────────────────────────────────────────────────────────
# Snapshot cumulative churn map. Flag if any top-3 file exceeds 30 touches.
# Manual comparison between snapshots reveals gravity-well formation (L2-004).

PREV_SNAPSHOT=$(ls "$HEALTH_DIR"/churn-snapshot-*.md 2>/dev/null | sort | tail -1 || true)
SNAPSHOT="$HEALTH_DIR/churn-snapshot-$EPIC.md"

printf "## C1: Churn Snapshot\n\n| Touches | File |\n|---------|------|\n" > "$SNAPSHOT"
git -C "$REPO" log --name-only --pretty=format: -- src/ \
  | grep -v '^$' | sort | uniq -c | sort -rn | head -20 \
  | awk '{ printf "| %s | %s |\n", $1, $2 }' >> "$SNAPSHOT"

printf "## C1: Churn Baseline\n" >> "$REPORT"
if [ -n "$PREV_SNAPSHOT" ] && [ "$PREV_SNAPSHOT" != "$SNAPSHOT" ]; then
  printf "Previous: %s\n" "$(basename "$PREV_SNAPSHOT")" >> "$REPORT"
  TOP_COUNT=$(grep -E "^\| [0-9]+" "$SNAPSHOT" | head -1 | awk -F'|' '{print $2}' | tr -d ' ')
  TOP_NAME=$(grep -E "^\| [0-9]+" "$SNAPSHOT" | head -1 | awk -F'|' '{print $3}' | tr -d ' ')
  if [ -n "$TOP_COUNT" ] && [ "$TOP_COUNT" -gt 30 ]; then
    printf "⚠️  GRAVITY WELL: %s at %s touches. Compare to prior snapshot for growth rate.\n" \
      "$TOP_NAME" "$TOP_COUNT" >> "$REPORT"
    printf "L2-004 (Churn File Indicator) may be forming.\n" >> "$REPORT"
    WARNINGS=$((WARNINGS + 1))
  else
    printf "✓ Top file: %s touches. No gravity well threshold exceeded.\n" "${TOP_COUNT:-0}" >> "$REPORT"
  fi
else
  printf "✓ First snapshot — baseline established. No previous to compare.\n" >> "$REPORT"
fi
printf "\n" >> "$REPORT"

# ── C2: LOC Trajectory ───────────────────────────────────────────────────────
# >15% LOC growth vs prior snapshot without matching feat count = Accretion signal.

printf "## C2: LOC Trajectory\n" >> "$REPORT"
LOC_CSV="$HEALTH_DIR/loc-trajectory.csv"
[ -f "$LOC_CSV" ] || printf "date,epic,loc\n" > "$LOC_CSV"

SRC_DIR="$REPO/src"
if [ -d "$SRC_DIR" ]; then
  CURRENT_LOC=$(find "$SRC_DIR" \( -name '*.ts' -o -name '*.tsx' \) -print0 \
    | xargs -0 wc -l 2>/dev/null | tail -1 | awk '{print $1}')
  CURRENT_LOC=${CURRENT_LOC:-0}

  PREV_LOC=$(tail -1 "$LOC_CSV" 2>/dev/null | cut -d',' -f3 | grep -E '^[0-9]+$' || echo "")
  printf "%s,%s,%s\n" "$TODAY" "$EPIC" "$CURRENT_LOC" >> "$LOC_CSV"

  if [ -n "$PREV_LOC" ] && [ "$PREV_LOC" -gt 0 ] && [ "$CURRENT_LOC" -gt 0 ]; then
    PCT=$(awk "BEGIN { printf \"%d\", ($CURRENT_LOC - $PREV_LOC) * 100 / $PREV_LOC }")
    if [ "$PCT" -gt 15 ]; then
      printf "⚠️  LOC GROWTH: +%d%% (%d → %d lines). Accretion Without Compression?\n" \
        "$PCT" "$PREV_LOC" "$CURRENT_LOC" >> "$REPORT"
      printf "L2-002: If no compression story was in this epic, accretion is forming.\n" >> "$REPORT"
      WARNINGS=$((WARNINGS + 1))
    else
      printf "✓ LOC: %d lines (+%d%% vs prior snapshot).\n" "$CURRENT_LOC" "$PCT" >> "$REPORT"
    fi
  else
    printf "✓ LOC: %d lines (first recording).\n" "$CURRENT_LOC" >> "$REPORT"
  fi
else
  printf "src/ not found — LOC check skipped.\n" >> "$REPORT"
fi
printf "\n" >> "$REPORT"

# ── C3: Fix-to-Feat Ratio ────────────────────────────────────────────────────
# fix:feat > 1.2 for 2 consecutive snapshots = chronic instability (L2-003 precursor).

printf "## C3: Fix-to-Feat Ratio (last 30 days)\n" >> "$REPORT"
METRICS_CSV="$HEALTH_DIR/health-metrics.csv"
[ -f "$METRICS_CSV" ] || printf "date,epic,fix_count,feat_count,ratio\n" > "$METRICS_CSV"

FIX_COUNT=$(git -C "$REPO" log --oneline --since="30 days ago" | grep -ciE "\bfix\b" || true)
FEAT_COUNT=$(git -C "$REPO" log --oneline --since="30 days ago" | grep -ciE "\bfeat\b" || true)
FIX_COUNT=${FIX_COUNT:-0}
FEAT_COUNT=${FEAT_COUNT:-0}

PREV_RATIO=$(tail -1 "$METRICS_CSV" 2>/dev/null | cut -d',' -f5 | grep -E '^[0-9]' || echo "0")

if [ "$FEAT_COUNT" -gt 0 ]; then
  RATIO=$(awk "BEGIN { printf \"%.2f\", $FIX_COUNT / $FEAT_COUNT }")
  printf "%s,%s,%s,%s,%s\n" "$TODAY" "$EPIC" "$FIX_COUNT" "$FEAT_COUNT" "$RATIO" >> "$METRICS_CSV"

  BOTH_HIGH=$(awk "BEGIN { print ($RATIO > 1.2 && \"$PREV_RATIO\" > 1.2) ? 1 : 0 }")
  CURR_HIGH=$(awk "BEGIN { print ($RATIO > 1.2) ? 1 : 0 }")

  if [ "$BOTH_HIGH" -eq 1 ]; then
    printf "🚨 CHRONIC INSTABILITY: fix:feat %s (prev %s) — 2 consecutive epics >1.2.\n" \
      "$RATIO" "$PREV_RATIO" >> "$REPORT"
    printf "Precursor to Context Thrashing (L2-003). Task scope may be too large.\n" >> "$REPORT"
    WARNINGS=$((WARNINGS + 1))
  elif [ "$CURR_HIGH" -eq 1 ]; then
    printf "⚠️  FIX-HEAVY: ratio %s (%d fix / %d feat). Monitor next epic.\n" \
      "$RATIO" "$FIX_COUNT" "$FEAT_COUNT" >> "$REPORT"
    WARNINGS=$((WARNINGS + 1))
  else
    printf "✓ Fix:feat ratio %s (%d fix / %d feat).\n" "$RATIO" "$FIX_COUNT" "$FEAT_COUNT" >> "$REPORT"
  fi
else
  printf "%s,%s,%s,0,N/A\n" "$TODAY" "$EPIC" "$FIX_COUNT" >> "$METRICS_CSV"
  printf "No feat commits in last 30 days — ratio not computed.\n" >> "$REPORT"
fi
printf "\n" >> "$REPORT"

# ── Summary ───────────────────────────────────────────────────────────────────

printf '\n---\n**%d/3 signals triggered**\n' "$WARNINGS" >> "$REPORT"
[ "$WARNINGS" -ge 1 ] && printf "See: %s/compound-reports/%s.md\n" "$HEALTH_DIR" "$EPIC" >> "$REPORT"

echo ""
echo "──────────────────────────────────────────────────────"
printf "Behavioral health: %s — %d/3 signals\n" "$EPIC" "$WARNINGS"
[ "$WARNINGS" -ge 1 ] && echo "" && cat "$REPORT"
echo "Output: $HEALTH_DIR/"
echo "──────────────────────────────────────────────────────"

[ "$WARNINGS" -ge 2 ] && exit 2
[ "$WARNINGS" -ge 1 ] && exit 1
exit 0
