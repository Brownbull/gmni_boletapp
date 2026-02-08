#!/bin/bash
# _ecc/setup.sh - Run after BMAD install to restore ECC integration
# Usage: bash _ecc/setup.sh
#
# This script copies ECC integration files to .claude/ where Claude Code discovers them.
# Source of truth is always _ecc/ - never edit .claude/ copies directly.
# After any `npx bmad-method install`, run: bash _ecc/setup.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "=== ECC Setup: Restoring integration points ==="
echo "Source: $SCRIPT_DIR"
echo "Target: $PROJECT_DIR/.claude/"
echo ""

# 1. Copy ECC commands to .claude/commands/
echo "[1/5] Copying ECC commands..."
mkdir -p "$PROJECT_DIR/.claude/commands"
cp "$SCRIPT_DIR/commands/"*.md "$PROJECT_DIR/.claude/commands/"
echo "  -> $(ls "$SCRIPT_DIR/commands/"*.md | wc -l) command files copied"

# 2. Create .claude/rules/ and copy rules
echo "[2/5] Copying ECC rules..."
mkdir -p "$PROJECT_DIR/.claude/rules"
cp "$SCRIPT_DIR/rules/"*.md "$PROJECT_DIR/.claude/rules/"
echo "  -> $(ls "$SCRIPT_DIR/rules/"*.md | wc -l) rule files copied"

# 3. Copy settings.json (hooks config) - preserves existing settings.local.json
echo "[3/5] Copying settings.json (hook configuration)..."
cp "$SCRIPT_DIR/config/settings.json" "$PROJECT_DIR/.claude/settings.json"
echo "  -> Hook paths point to $SCRIPT_DIR/hooks/"

# 4. Copy TEA customization to BMAD config (bridging ECC→BMAD)
echo "[4/5] Copying TEA customization to BMAD..."
if [ -d "$PROJECT_DIR/_bmad/_config" ]; then
  mkdir -p "$PROJECT_DIR/_bmad/_config/agents"
  cp "$SCRIPT_DIR/config/bmm-tea.customize.yaml" "$PROJECT_DIR/_bmad/_config/agents/"
  echo "  -> bmm-tea.customize.yaml copied to _bmad/_config/agents/"
else
  echo "  -> SKIP: _bmad/_config/ not found (install BMAD first)"
fi

# 5. Copy learning config
echo "[5/5] Copying learning config..."
if [ -d "$PROJECT_DIR/_bmad/bmm" ]; then
  mkdir -p "$PROJECT_DIR/_bmad/bmm/config"
  cp "$SCRIPT_DIR/config/learning-config.yaml" "$PROJECT_DIR/_bmad/bmm/config/"
  echo "  -> learning-config.yaml copied to _bmad/bmm/config/"
else
  echo "  -> SKIP: _bmad/bmm/ not found (install BMAD first)"
fi

echo ""
echo "=== ECC Setup Complete ==="
echo ""
echo "Restored:"
echo "  - $(ls "$SCRIPT_DIR/commands/"*.md | wc -l) slash commands (.claude/commands/)"
echo "  - $(ls "$SCRIPT_DIR/rules/"*.md | wc -l) rule files (.claude/rules/)"
echo "  - settings.json with hook configuration (.claude/settings.json)"
echo "  - TEA customization (_bmad/_config/agents/)"
echo "  - Learning config (_bmad/bmm/config/)"
echo ""
echo "NOTE: After BMAD reinstall, always run: bash _ecc/setup.sh"
echo "NOTE: To edit rules/hooks/commands, edit files in _ecc/ then re-run this script."
