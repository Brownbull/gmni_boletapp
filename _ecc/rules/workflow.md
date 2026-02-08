# BMAD + ECC Workflow System

## Two Systems, Clear Boundaries

**BMAD** handles planning and design (phases 1-3):
- Phase 1 Analysis: `/create-product-brief`, `/research`
- Phase 2 Planning: `/create-ux-design`, `/prd`
- Phase 3 Solutioning: `/create-architecture`, `/create-epics-and-stories`, `/check-implementation-readiness`
- Also: `/brainstorming`, `/party-mode`, `/retrospective`

**ECC** handles all development execution (phase 4):
- Story creation: `/ecc-create-story` (Planner + Architect agents)
- Development: `/ecc-dev-story` (TDD Guide + Build Resolver + parallel reviewers)
- Code review: `/ecc-code-review` (4 parallel agents: code, security, architect, TDD)
- E2E testing: `/ecc-e2e` (pre-flight enforcement, multi-user detection, TEA quality scoring)
- Impact analysis: `/ecc-impact-analysis` (madge dependency graphs + sprint conflict detection)
- Deployment: `/deploy-story` (checklist-driven with verification)
- UX/UI: `/design-system-mockup-builder` (HTML mockups from design system)
- Refactoring: `/archie-refactor` via archie-refactor-orchestrator subagent
- Sprint management: `/sprint-planning`, `/sprint-status`, `/correct-course`

## ECC Agents

Spawned via Task tool with `subagent_type: everything-claude-code:<agent>`:

| Agent | Role |
|-------|------|
| `planner` | Implementation planning, risk assessment, task breakdown |
| `architect` | Technical design, pattern decisions, Dev Notes |
| `tdd-guide` | RED-GREEN-REFACTOR cycle, test-first development |
| `build-error-resolver` | Fix build/TS errors with minimal diffs |
| `code-reviewer` | Code quality, maintainability |
| `security-reviewer` | OWASP Top 10, vulnerability detection |

Parallel spawning: launch multiple agents in a single message when they're independent.
Sequential handoff: pass context documents between dependent agents.

**Proactive agent usage** (no user prompt needed):
- Complex features or multi-file changes -> spawn **planner** first
- After writing/modifying code -> spawn **code-reviewer** immediately
- Bug fix or new feature -> use **tdd-guide** (write tests first)
- Architectural decisions or new patterns -> spawn **architect**
- Auth, user input, API endpoints, sensitive data -> spawn **security-reviewer**

**Model selection for subagents:**
- Haiku: lightweight exploration, quick searches, simple tasks
- Sonnet: main development, orchestration, planning
- Opus: complex architecture, deep reasoning, security review

## ECC Hooks (Automatic - .claude/settings.json)

Pre-edit guards (before any Edit):
- `console.log` detection
- Explicit `: any` type usage
- File size limits: source >500 lines, unit test >300, integration >500, E2E >400

Post-edit checks (after any Edit):
- TypeScript type-check (`npx tsc --noEmit`, 30s timeout)
- `toHaveBeenCalled` without `toHaveBeenCalledWith` warning
- E2E missing cleanup pattern warning

## Story Lifecycle

```
create-story -> story-ready -> dev-story -> code-review -> story-done
```

- IMPORTANT: Developers mark stories "review" ONLY - never "done"
- Reviewers mark "done" after approval
- Every story AC includes: "Update Epic Evolution document"
- Sprint tracking: `docs/sprint-artifacts/sprint-status.yaml`

## Story Sizing (Opus 4.6)

Maximum per story: **8 tasks / 40 subtasks / 12 files**

If a story exceeds these limits during dev, split it. ECC dev-story runs mid-story sizing checks.

Use `dust` to analyze directory sizes before and during implementation for context budgeting:
- `dust src/features/<feature>/` - check feature module size before starting work
- `dust src/ -d 2` - overview of source tree size by top-level directories
- `dust tests/` - understand test directory scope

## Project Knowledge Loading

ECC workflows cache these at session start (Step 0):
- `_ecc/knowledge/code-review-patterns.md` (MUST CHECK patterns)
- `.claude/rules/testing.md`
- `docs/architecture/firestore-patterns.md`
- `docs/architecture/state-management.md` (if relevant)
- `docs/architecture/component-patterns.md` (if relevant)

## Workflow Configuration

BMAD workflows live in `_bmad/bmm/workflows/`, ECC workflows live in `_ecc/workflows/`. Both use:
- `instructions.xml` - pseudo-code DSL (not strict XML)
- `workflow.yaml` - config, agent types, sizing rules
- `checklist.md` - deployment stories only
