Cozempic Setup (2026-02-19)
What: cozempic v0.7.0 — CLI tool that prunes Claude Code session JSONL files to prevent context window bloat and auto-compaction. 73% of a typical session is progress tick noise; gentle pruning reclaims ~72% of file size and ~35% of tokens.

Installation: uv tool install cozempic (global binary, zero Python dependencies).

Hooks in .claude/settings.json (both boletapp and archie):

SessionStart → cozempic guard --daemon -rx gentle --threshold 50 --no-reload
PreCompact → cozempic treat current -rx gentle --execute
Stop → cozempic checkpoint current
Toggle: bash _ecc/tools/cozempic-toggle.sh [enable|disable|status] — safely adds/removes only the 3 cozempic hooks without touching ECC hooks (PreToolUse/PostToolUse).

Config choices: gentle tier only (3 strategies, minimal risk), 50MB threshold, no auto-reload. Agent Teams features not used (ECC uses Task tool subagents, not Agent Teams).

Key commands: cozempic diagnose current, cozempic treat current -rx gentle (dry-run), cozempic formulary (list strategies).