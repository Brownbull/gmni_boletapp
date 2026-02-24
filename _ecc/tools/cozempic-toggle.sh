#!/usr/bin/env bash
# Toggle cozempic hooks in .claude/settings.json
# Usage: bash _ecc/tools/cozempic-toggle.sh [enable|disable|status]
#
# Appends/removes cozempic entries from SessionStart, PreCompact, Stop.
# ECC hooks in those events are preserved — only cozempic entries are touched.

set -euo pipefail

SETTINGS="${CLAUDE_PROJECT_DIR:-.}/.claude/settings.json"

if [[ ! -f "$SETTINGS" ]]; then
  echo "ERROR: $SETTINGS not found. Run from project root or set CLAUDE_PROJECT_DIR."
  exit 1
fi

# Check if any hook entry contains 'cozempic' in its command string
has_cozempic() {
  python3 -c "
import json, sys
with open('$SETTINGS') as f:
    data = json.load(f)
for event_hooks in data.get('hooks', {}).values():
    for entry in event_hooks:
        for h in entry.get('hooks', []):
            if 'cozempic' in h.get('command', ''):
                sys.exit(0)
sys.exit(1)
"
}

show_status() {
  if has_cozempic; then
    echo "cozempic: ENABLED"
    echo ""
    python3 -c "
import json
with open('$SETTINGS') as f:
    data = json.load(f)
hooks = data.get('hooks', {})
for event in ['SessionStart', 'PreCompact', 'Stop']:
    if event in hooks:
        for entry in hooks[event]:
            for h in entry.get('hooks', []):
                cmd = h.get('command', '')
                if 'cozempic' in cmd:
                    print(f'  {event}: {cmd[:80]}')
"
  else
    echo "cozempic: DISABLED"
  fi
}

enable_cozempic() {
  if has_cozempic; then
    echo "cozempic hooks already enabled."
    show_status
    return 0
  fi

  python3 -c "
import json

with open('$SETTINGS') as f:
    data = json.load(f)

hooks = data.setdefault('hooks', {})

# SessionStart: append cozempic guard after ECC session-start
hooks.setdefault('SessionStart', []).append({
    'hooks': [{
        'type': 'command',
        'command': 'cozempic guard --daemon --cwd \"\$CLAUDE_PROJECT_DIR\" -rx gentle --threshold 50 --no-reload',
        'timeout': 5
    }]
})

# PreCompact: insert cozempic FIRST (prune before budget count)
hooks.setdefault('PreCompact', []).insert(0, {
    'hooks': [{
        'type': 'command',
        'command': 'cozempic treat current -rx gentle --execute',
        'timeout': 30
    }]
})

# Stop: append cozempic checkpoint after ECC cost CSV
hooks.setdefault('Stop', []).append({
    'hooks': [{
        'type': 'command',
        'command': 'cozempic checkpoint current 2>/dev/null || true',
        'timeout': 10
    }]
})

with open('$SETTINGS', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
"

  echo "cozempic: ENABLED"
  echo "  SessionStart -> guard daemon (gentle, 50MB threshold)"
  echo "  PreCompact   -> gentle treat FIRST (before ECC budget count)"
  echo "  Stop         -> checkpoint session state"
}

disable_cozempic() {
  if ! has_cozempic; then
    echo "cozempic hooks already disabled."
    return 0
  fi

  python3 -c "
import json

with open('$SETTINGS') as f:
    data = json.load(f)

hooks = data.get('hooks', {})
# Remove only entries whose hooks contain 'cozempic' in the command string
for key in ['SessionStart', 'PreCompact', 'Stop']:
    if key in hooks:
        hooks[key] = [
            entry for entry in hooks[key]
            if not any('cozempic' in h.get('command', '')
                      for h in entry.get('hooks', []))
        ]
        if not hooks[key]:
            del hooks[key]

with open('$SETTINGS', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
"

  echo "cozempic: DISABLED"
  echo "  ECC hooks (PreToolUse, PostToolUse, SessionStart, PreCompact, Stop) untouched"
}

case "${1:-status}" in
  enable)  enable_cozempic ;;
  disable) disable_cozempic ;;
  status)  show_status ;;
  *)
    echo "Usage: bash _ecc/tools/cozempic-toggle.sh [enable|disable|status]"
    exit 1
    ;;
esac
