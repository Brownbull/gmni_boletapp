# ECC (Everything Claude Code) - Architecture & Setup

## What is ECC?

ECC is a custom development execution layer built on top of BMAD. While BMAD handles planning (phases 1-3), ECC handles all phase 4 implementation with:

- **5 specialized agents** spawned via Task tool (code-reviewer, security-reviewer, architect, tdd-guide, build-error-resolver)
- **Parallel agent execution** for code review (4 agents simultaneously)
- **Adaptive review classification** (TRIVIAL/SIMPLE/STANDARD/COMPLEX)
- **Weighted quality scoring** (Code 40%, Security 30%, Architect 20%, TDD 10%)
- **TEA 5-dimension test quality** (Determinism, Isolation, Maintainability, Coverage, Performance)
- **Automated hooks** (pre-edit guard, post-edit warnings, TypeScript typecheck)
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
- `_ecc/workflows/` - 6 workflow definitions
- `_ecc/hooks/` - 3 hook scripts
- `_ecc/knowledge/` - code-review-patterns.md
- `_ecc/rules/` - testing.md, security.md, workflow.md
- `_ecc/config/` - settings.json, TEA customize, learning config
- `_ecc/commands/` - 6 command stubs

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
│   ├── deploy-story.md
│   ├── story-sizing.md
│   └── design-system-mockup-builder.md
├── workflows/
│   ├── ecc-dev-story/               # TDD-first dev with agent orchestration
│   ├── ecc-code-review/             # 4-agent parallel review
│   ├── ecc-create-story/            # Story creation with epic context
│   ├── deploy-story/                # 2-branch PR deployment
│   ├── story-sizing/                # Opus 4.6 sizing analysis
│   └── design-system-mockup-builder/# HTML mockup generation
├── hooks/
│   ├── ecc-pre-edit-guard.py        # Catches console.log, :any, file size
│   ├── ecc-post-edit-warn.py        # toHaveBeenCalled warnings
│   └── ecc-post-edit-typecheck.sh   # tsc --noEmit after edits
├── knowledge/
│   └── code-review-patterns.md      # MUST CHECK security patterns
├── rules/                           # → .claude/rules/
│   ├── testing.md
│   ├── security.md
│   └── workflow.md
└── config/
    ├── settings.json                # → .claude/settings.json (hook config)
    ├── bmm-tea.customize.yaml       # → _bmad/_config/agents/
    └── learning-config.yaml         # → _bmad/bmm/config/
```

## Cross-References

ECC workflows reference these BMAD-managed paths (expected to exist after install):
- `_bmad/core/tasks/workflow.xml` - BMAD core workflow loader
- `_bmad/bmm/config.yaml` - project configuration (user_name, language, paths)
- `_bmad/tea/testarch/knowledge/playwright-cli.md` - TEA browser automation reference
- `_bmad/tea/testarch/knowledge/test-quality.md` - TEA quality scoring reference

ECC workflows reference these project paths (not managed by either system):
- `docs/architecture/TESTING-GUIDELINES.md`
- `docs/architecture/firestore-patterns.md`
- `docs/architecture/state-management.md`
- `docs/architecture/component-patterns.md`
- `docs/sprint-artifacts/sprint-status.yaml`
- `tests/e2e/E2E-TEST-CONVENTIONS.md`

## Editing ECC Files

**Always edit files in `_ecc/`, never in `.claude/`.**

After editing, re-run setup to push changes:
```bash
bash _ecc/setup.sh
```

For workflow changes (instructions.xml, workflow.yaml), no setup needed - commands already point to `_ecc/workflows/`.

## Created: 2026-02-07
