#!/bin/bash
# SessionStart hook — Initialize session tracking + start cozempic guard.
#
# 1. Record session start timestamp (for duration tracking)
# 2. Initialize compaction counter to 0
# 3. Start cozempic guard daemon
#
# Exit 0 always.

SESSION_KEY=$(ps -o ppid= -p $$ 2>/dev/null | tr -d ' ')
[ -z "$SESSION_KEY" ] && SESSION_KEY=$$

# 1. Record session start time
echo "$(date +%s)" > "/tmp/claude-session-start-${SESSION_KEY}"

# 2. Initialize compaction counter
echo "0" > "/tmp/claude-session-compactions-${SESSION_KEY}"

# 3. Start cozempic guard (if available)
if command -v cozempic &>/dev/null; then
    cozempic guard --daemon --cwd "${CLAUDE_PROJECT_DIR:-.}" -rx gentle --threshold 50 --no-reload 2>/dev/null &
fi

exit 0
