#!/bin/bash
# ECC PostToolUse hook: notify when project memory files are modified.
#
# Fires on Write|Edit. Checks if the file_path is inside this project's
# Claude auto-memory directory. If so, returns a systemMessage so Claude
# tells the user what changed.
#
# Exit 0 = normal (no notification or JSON notification).

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

# Nothing to check
[ -z "$FILE_PATH" ] && exit 0

MEMORY_DIR="$HOME/.claude/projects/-home-khujta-projects-bmad-boletapp/memory"

case "$FILE_PATH" in
  "$MEMORY_DIR"/*)
    FILENAME=$(basename "$FILE_PATH")
    echo "{\"systemMessage\":\"Project memory modified: ${FILENAME} — tell the user what you changed and why.\"}"
    ;;
esac

exit 0
