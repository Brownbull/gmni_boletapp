# Proposal: V6 UX Consistency Value — "Does this screen feel like home?"

**Status:** DRAFT
**Origin:** Epic 18 adversarial review (2026-03-12)
**Prerequisite:** Option B active (UI pattern manifest + code review reviewer + planner context)
**Recommended timing:** After story 18-4 (first UI story) is reviewed

---

## Context

During Epic 18 adversarial review (2026-03-12), we identified that BoletApp has experienced
UX drift when building new screens. The root cause: no KDBP value enforces visual/interaction
consistency. Values V1-V5 cover data quality, privacy, detection, and friction — but not
"does this screen belong in this app?"

## What Was Done (Option B — Active Now)

1. Created `_kdbp/knowledge/ui-patterns.md` — compact manifest of all existing UI components,
   theming rules, accessibility requirements, and a checklist for UI stories
2. Added UI consistency reviewer (Task 5) to `kdbp-code-review` step-03 — fires when .tsx
   files in UI paths are touched, runs in parallel with existing reviewers
3. Wired `ui-patterns.md` into `kdbp-dev-story` step-04 planner context — planner must
   list existing components to reuse and justify new ones

## What This Proposal Adds

### 1. New Value: V6 "Does this screen feel like home?"

**Proposed value definition (draft — needs kdbp-evolve-behavior refinement):**

```markdown
## V6: Interface Coherence

### THE INTENT
Every screen must feel like it belongs in the same app. New features inherit the existing
visual language — they don't invent their own. When a user navigates to a new screen,
there should be zero cognitive cost for "learning" the interface.

### THE ANALOGY
A house where every room was designed by the same architect. You don't need a map to find
the light switch — it's always in the same place, at the same height, with the same feel.
A screen that introduces its own dialog style is like a room where the light switch is on
the ceiling.

### ANALOGY LIMITS
Not every screen is identical — a statement upload view is different from a transaction editor.
Consistency means shared primitives and patterns, not identical layouts.

### CONSTRAINT BOX
IS:     Reuse existing components, theming, interaction patterns for all new screens
IS NOT: Visual uniformity (different screens serve different purposes)
RISK:   Over-constraining innovation (some features genuinely need new patterns)

### ONE-LINE HANDLE
"Does this screen feel like home?"

### ALIGNMENT TESTS
1. Does this screen reuse existing shared components (ConfirmationDialog, TransactionCard, Toast)?
2. Are all colors from CSS variables (no hardcoded hex)?
3. Would a user recognize this as the same app without reading the header?

### EVALUATION ALTITUDE
Story level — check on every story that creates or modifies UI components.
```

### 2. Workflow Integration Points (4 touchpoints)

| Workflow | Step | Integration |
|----------|------|-------------|
| `kdbp-create-story` | step-06 (parallel review) | Stories touching UI must include "UI Reference" section listing existing components to reuse |
| `kdbp-dev-story` | step-04 (planner) | **Already done** (Option B) — planner receives ui-patterns.md |
| `kdbp-code-review` | step-03 (parallel spawn) | **Already done** (Option B) — UI consistency reviewer agent |
| `kdbp-alignment-check` | step-03 (value tests) | Add V6 alignment test: "Does this UI change follow the pattern manifest?" |

### 3. BEHAVIOR.md Update

Add V6 to the Value Manifest:
```
| V6 | "Does this screen feel like home?" | Story |
```

### 4. DEPENDENCY-MAP.md Update

Link V6 to:
- `kdbp-dev-story` step-04 (planner UI context)
- `kdbp-code-review` step-03 (UI reviewer agent)
- `kdbp-create-story` step-06 (UI reference section)
- `kdbp-alignment-check` step-03 (V6 alignment test)

## How to Execute

1. Run `/kdbp-evolve-behavior` — use the V6 draft above as input
2. The workflow will challenge the value definition, refine it, and integrate it
3. After behavior evolution: update the 2 remaining workflow touchpoints (create-story, alignment-check)
4. Estimated session time: ~45 minutes

## Open Questions

1. Should V6 be strictly BLOCK-level (no new primitives ever) or WARN-level (new primitives need justification)?
2. Should V6 apply retroactively to existing screens, or only to new development?
3. Does V6 need a "pattern evolution" escape hatch for genuinely new interaction types?
4. Should the UI pattern manifest be auto-updated when new components are added, or manually maintained?
