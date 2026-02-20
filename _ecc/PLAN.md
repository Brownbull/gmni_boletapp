# ECC (Everything Claude Code) - Architecture & Setup

## What is ECC?

ECC is a custom development execution layer built on top of BMAD. While BMAD handles planning (phases 1-3), ECC handles all phase 4 implementation with:

- **5 specialized agents** spawned via Task tool (code-reviewer, security-reviewer, architect, tdd-guide, build-error-resolver)
- **Parallel agent execution** for code review (4 agents simultaneously)
- **Adaptive review classification** (TRIVIAL/SIMPLE/STANDARD/COMPLEX)
- **Weighted quality scoring** (Code 40%, Security 30%, Architect 20%, TDD 10%)
- **Automated hooks** (pre-edit guard, post-edit warnings, TypeScript typecheck, session budget, write guard)
- **Architecture enforcement** after each task
- **Branch guards** preventing commits to protected branches

## Separation from BMAD

```
_bmad/          ← BMAD-owned. Overwritten by `npx bmad-method install`
_ecc/           ← ECC-owned. BMAD never touches this.
.claude/        ← Integration layer. Rebuilt by `bash _ecc/setup.sh`
CLAUDE.md       ← Project-owned. Both BMAD and ECC reference it.
```

### What BMAD Manages
- `_bmad/` - all modules (core, bmm, bmb, cis, tea)
- `.claude/commands/bmad-*.md` - regenerated from manifests on install

### What ECC Manages (source of truth in `_ecc/`)
- `_ecc/workflows/` - 8 active workflow definitions
- `_ecc/hooks/` - 8 hook scripts
- `_ecc/knowledge/` - code-review-patterns.md, hardening-patterns.md
- `_ecc/rules/` - testing.md, security.md, workflow.md
- `_ecc/config/` - settings.json, learning config
- `_ecc/commands/` - 8 command stubs
- `_ecc/plans/` - archived design documents (reference only)
- `_ecc/tools/` - cozempic-toggle.sh

### After BMAD Reinstall

```bash
# BMAD overwrites _bmad/ and .claude/commands/bmad-*.md
npx bmad-method install

# Restore ECC integration points to .claude/
bash _ecc/setup.sh
```

## File Layout

```
_ecc/
├── PLAN.md                          # This file
├── setup.sh                         # Post-install integration script
├── commands/                        # → .claude/commands/ecc-*.md
│   ├── ecc-dev-story.md
│   ├── ecc-code-review.md
│   ├── ecc-create-story.md
│   ├── ecc-create-epics-and-stories.md
│   ├── ecc-e2e.md
│   ├── ecc-impact-analysis.md
│   ├── deploy-story.md
│   └── story-sizing.md
├── workflows/                       # Active workflows (in project-modules.yaml)
│   ├── ecc-dev-story/               # TDD-first dev with agent orchestration
│   ├── ecc-code-review/             # 4-agent parallel review
│   ├── ecc-create-story/            # Story creation with epic context
│   ├── ecc-create-epics-and-stories/# Epic + story generation from PRD
│   ├── ecc-e2e/                     # Standalone E2E testing workflow
│   ├── ecc-impact-analysis/         # Dependency graph cross-cutting analysis
│   ├── deploy-story/                # 2-branch PR deployment
│   └── story-sizing/                # Opus 4.6 sizing analysis
├── hooks/
│   ├── ecc-pre-edit-guard.py        # BLOCK at 800 lines, warn at 500, catches :any/console.log
│   ├── ecc-pre-write-guard.py       # ADR gate for new src/ files
│   ├── ecc-post-edit-warn.py        # toHaveBeenCalled warnings
│   ├── ecc-post-edit-typecheck.sh   # tsc --noEmit after edits
│   ├── ecc-post-memory-notify.sh    # MEMORY.md edit notification
│   ├── ecc-session-budget.py        # Compaction counter (warn at 3)
│   ├── ecc-session-start.sh         # Session log entry
│   └── ecc-session-stop.sh          # Cost CSV append
├── knowledge/
│   ├── code-review-patterns.md      # MUST CHECK security patterns
│   └── hardening-patterns.md        # Performance + security hardening
├── rules/                           # → .claude/rules/
│   ├── testing.md
│   ├── security.md
│   └── workflow.md
├── config/
│   ├── settings.json                # ECC source of truth → .claude/settings.json
│   └── learning-config.yaml         # ECC continuous learning config
├── plans/                           # Archived design docs (reference only, not active)
│   ├── ecc-e2e.md                   # E2E workflow design rationale + multi-user decision trees
│   └── ecc-impact-analysis.md       # Impact analysis design + madge usage patterns
│   # NOTE: plans/ and knowledge/ are exempt from the 200-line guideline.
│   #       The 200-line rule applies to _ecc/workflows/ and _ecc/hooks/ only.
└── tools/
    ├── cozempic-toggle.sh           # Optional: enable/disable cozempic session pruning
    └── readme.md                    # Cozempic integration notes
```

## Cross-References

ECC workflows reference these BMAD-managed paths (expected to exist after install):
- `_bmad/core/tasks/workflow.xml` - BMAD core workflow loader
- `_bmad/bmm/config.yaml` - project configuration (user_name, language, paths)

ECC workflows reference these project paths (not managed by either system):
- `docs/architecture/TESTING-GUIDELINES.md`
- `docs/architecture/firestore-patterns.md`
- `docs/architecture/state-management.md`
- `docs/architecture/component-patterns.md`
- `docs/sprint-artifacts/sprint-status.yaml`
- `tests/e2e/E2E-TEST-CONVENTIONS.md`

## Editing ECC Files

**Always edit files in `_ecc/`, never in `.claude/`.**

After editing hooks or rules, re-run setup to push changes:
```bash
bash _ecc/setup.sh
```

For workflow changes (step files, workflow.yaml), no setup needed — commands already point to `_ecc/workflows/`.

## Optional: Cozempic Integration

Cozempic prunes Claude session JSONL files before compaction (~35% token reduction).
Toggle on/off without touching ECC hooks:

```bash
bash _ecc/tools/cozempic-toggle.sh enable   # Append cozempic to SessionStart/PreCompact/Stop
bash _ecc/tools/cozempic-toggle.sh disable  # Remove cozempic entries (ECC hooks preserved)
bash _ecc/tools/cozempic-toggle.sh status   # Check current state
```

## Created: 2026-02-07
## Updated: 2026-02-20 (Session 6 — Path B migration complete)
