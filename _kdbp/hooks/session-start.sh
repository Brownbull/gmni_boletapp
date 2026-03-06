#!/bin/bash
# SessionStart hook — Initialize session tracking + start cozempic guard.
#
# 1. Record session start timestamp (for duration tracking)
# 2. Initialize compaction counter to 0
# 3. Start cozempic guard daemon
#
# Exit 0 always.

PPID_VAL=$$  # In hook context, use current PID as session key fallback
# Claude's PPID is the session — use that for counter files
SESSION_KEY=$(ps -o ppid= -p $$ 2>/dev/null | tr -d ' ')
[ -z "$SESSION_KEY" ] && SESSION_KEY=$$

# 1. Record session start time
echo "$(date +%s)" > "/tmp/claude-session-start-${SESSION_KEY}"

# 2. Initialize compaction counter
echo "0" > "/tmp/claude-session-compactions-${SESSION_KEY}"

# 3. Start cozempic guard — REMOVED from here.
# Cozempic is already launched by the SessionStart hook in settings.json.
# Running it twice caused duplicate daemon processes.

# 4. Soft check: remind if agnix not installed (informational only)
if ! command -v agnix &>/dev/null; then
    echo "[INFO] agnix not installed — agent config linting disabled. Install: npm install -g agnix"
fi

exit 0
