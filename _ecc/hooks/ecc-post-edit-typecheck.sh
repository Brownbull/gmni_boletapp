#!/bin/bash
# ECC PostToolUse Auto Type-Check — runs tsc after .ts/.tsx edits.
#
# From ECC-LEARNING-CYCLE-IMPROVEMENTS.md Section 2.
# Only runs for TypeScript files. Shows first 20 lines of errors.
# Runs async to avoid blocking the workflow.

# Read stdin JSON, extract file_path
FILE_PATH=$(python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('tool_input', {}).get('file_path', ''))
except:
    print('')
")

# Only type-check TypeScript files
if [[ "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
    cd "${CLAUDE_PROJECT_DIR:-.}" 2>/dev/null || true
    OUTPUT=$(npx tsc --noEmit 2>&1 | head -20)
    if [ $? -ne 0 ] && [ -n "$OUTPUT" ]; then
        echo "$OUTPUT" >&2
        exit 1  # Non-blocking warning
    fi
fi

exit 0
