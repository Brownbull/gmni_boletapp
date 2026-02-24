#!/bin/bash
# Stop hook — Session cost report + cozempic checkpoint.
#
# 1. Calculate session duration
# 2. Read compaction count
# 3. Append session data to cost tracking CSV
# 4. Run cozempic checkpoint
#
# Exit 0 always.

SESSION_KEY=$(ps -o ppid= -p $$ 2>/dev/null | tr -d ' ')
[ -z "$SESSION_KEY" ] && SESSION_KEY=$$

COST_DIR="${CLAUDE_PROJECT_DIR:-.}/docs/cost-tracking"
COST_FILE="$COST_DIR/session-costs.csv"

# Ensure cost tracking directory exists
mkdir -p "$COST_DIR" 2>/dev/null

# Create CSV header if file doesn't exist
if [ ! -f "$COST_FILE" ]; then
    echo "date,session_id,duration_min,compaction_count,branch,notes" > "$COST_FILE"
fi

# Read session start time
START_FILE="/tmp/claude-session-start-${SESSION_KEY}"
if [ -f "$START_FILE" ]; then
    START_TIME=$(cat "$START_FILE")
    NOW=$(date +%s)
    DURATION=$(( (NOW - START_TIME) / 60 ))
else
    DURATION="unknown"
fi

# Read compaction count
COUNTER_FILE="/tmp/claude-session-compactions-${SESSION_KEY}"
if [ -f "$COUNTER_FILE" ]; then
    COMPACTIONS=$(cat "$COUNTER_FILE")
else
    COMPACTIONS="unknown"
fi

# Get current branch
BRANCH=$(cd "${CLAUDE_PROJECT_DIR:-.}" && git branch --show-current 2>/dev/null || echo "unknown")

# Append to CSV
DATE=$(date +%Y-%m-%d)
echo "${DATE},${SESSION_KEY},${DURATION},${COMPACTIONS},${BRANCH}," >> "$COST_FILE"

# Clean up temp files
rm -f "$START_FILE" "$COUNTER_FILE" 2>/dev/null

# Run cozempic checkpoint (if available)
if command -v cozempic &>/dev/null; then
    cozempic checkpoint current 2>/dev/null || true
fi

exit 0
