#!/bin/bash
# PostToolUse:Write|Edit — Notify when project memory files are modified.
# Returns systemMessage JSON so Claude tells the user what changed.
# Exit 0 always (notification only).

INPUT=$(cat 2>/dev/null || true)
FILE_PATH=$(echo "$INPUT" | python3 -c "import sys,json; print(json.load(sys.stdin).get('tool_input',{}).get('file_path',''))" 2>/dev/null)

[ -z "$FILE_PATH" ] && exit 0

# CUSTOMIZE: Set this to your project's memory directory
MEMORY_DIR="$HOME/.claude/projects/$(echo "$CLAUDE_PROJECT_DIR" | sed 's|/|-|g; s|^-||')/memory"

case "$FILE_PATH" in
  "$MEMORY_DIR"/*)
    FILENAME=$(basename "$FILE_PATH")
    echo "{\"systemMessage\":\"Project memory modified: ${FILENAME} — tell the user what you changed and why.\"}"
    ;;
esac

exit 0
