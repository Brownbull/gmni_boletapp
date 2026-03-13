# Adversarial Patterns — Structural Blind Spots

> **Value:** Structural Humility — "Build the immune system, not the hospital."
> **Source:** 85+ findings across 8 adversarial reviews (2026-02 to 2026-03) + P13 from Epic 18 replanning incident
> **Used by:** code-review (step-03), dev-story (step-08), create-story (step-05), evolve-behavior (step-05)

---

## Quick Reference

| ID | Pattern | Freq | Tier | Handle | Enforcement |
|----|---------|------|------|--------|-------------|
| P1 | Missing Infrastructure | 11% | 1 | "Built the house, forgot the plumbing" | `pre-write-guard.py` |
| P2 | Wrong Ordering | 4% | 2 | "Poured concrete before the rebar" | step-08 verdict + step-09 tag |
| P3 | Enforcement Gap | 6% | 3 | "Guard dog that sleeps through break-ins" | Design principle only |
| P4 | Self-Inconsistency | 5% | 2 | "Left hand contradicts right hand" | step-04 gate (framework files only) |
| P5 | No Scaling Strategy | 7% | 2 | "Planted the tree, forgot the pot has a bottom" | step-05 gate + step-03 epic |
| P6 | Orphaned References | 7% | 1 | "Road signs pointing to demolished buildings" | `post-session-refs.py` |
| P7 | No Validation Before Action | 5% | 2 | "Prescribed medicine without checking the patient" | step-08 checklist |
| P8 | Missing Lifecycle | 5% | 2 | "Birth certificate but no death certificate" | step-05 gate |
| P9 | Incomplete Specification | 7% | 2 | "Blueprint says 'door here' but not what size" | step-05 gate |
| P10 | Domain Mismatch | 5% | 3 | "Hired a plumber to fix the wiring" | Design principle only |
| P11 | Invisible Cost | 6% | 3 | "Free samples that cost $50 in shipping" | Already covered: `session-budget.py` |
| P12 | Survival/Portability | 5% | 3 | "Works in MY kitchen but breaks in yours" | Design principle only |
| P13 | Replanning Story Drop | NEW | 2 | "Rewrote the menu but forgot a dish was already ordered" | step-06 E2E check + cross-ref guard |

---

## Enforcement Tiers

- **Tier 1 — Hook-enforceable (99% catch rate):** Deterministic, file-level signals. Runs automatically.
- **Tier 2 — Workflow-step-enforceable (60-80%):** LLM reasoning at story/design gates. Fires within workflow steps.
- **Tier 3 — Design principle only (30-50%):** Cannot be reliably automated. Awareness is the only defense.

**Core rule:** "If it's not a hook, it's a suggestion. Suggestions get ignored."
Tier 3 patterns are honestly labeled as such. They require human vigilance or periodic adversarial review.

---

## Tier 1 Patterns (Hooked)

### P1 — Missing Infrastructure (11%)
**What:** New directories or features created without required companion files (barrel exports, bookend steps, trajectory files).
**Detection:** `pre-write-guard.py` checks against `infrastructure-manifest.md` on every new file creation.
**Evidence:** FSD features without `index.ts`, workflow dirs without `step-00`, behaviors without `evolution/`.

### P6 — Orphaned References (7%)
**What:** Path references in markdown/yaml/json that point to files that no longer exist (moved, renamed, deleted).
**Detection:** `post-session-refs.py` scans `git diff` for path references, verifies targets exist on disk.
**Evidence:** Protocol paths pointing to `docs/research/` after move to `_kdbp/core/`, broken skill references.

---

## Tier 2 Patterns (Workflow Gates)

### P9 — Incomplete Specification (7%)
**What:** Entity formats declared but not fully specified (e.g., "stores user data" without field definitions).
**Gate:** `create-story/step-05` Design Quality Gate. Rating: COMPLETE | HAS_GAPS.

### P5 — No Scaling Strategy (7%)
**What:** Persistent entities created without declared growth bounds (max items, TTL, archival strategy).
**Gate:** `create-story/step-05` + `create-epics/step-03`. Rating: BOUNDED | UNBOUNDED.

### P8 — Missing Lifecycle (5%)
**What:** Entities with creation mechanism but no retirement/cleanup/archival mechanism.
**Gate:** `create-story/step-05` Design Quality Gate. Rating: HAS_LIFECYCLE | MISSING.

### P4 — Self-Inconsistency (5%)
**What:** Changes to framework files (CLAUDE.md, hooks, workflows) that contradict existing rules.
**Gate:** `dev-story/step-04` — fires ONLY when implementation plan touches `_kdbp/`, `CLAUDE.md`, `.claude/`, `_ecc/`.
**Scope:** Compares planned changes against current rules. Not a general consistency checker.

### P2 — Wrong Ordering (4%)
**What:** Operations performed out of sequence (e.g., writing before confirming, mutating before validating).
**Gate:** `dev-story/step-08` code-reviewer emits P2 verdict. `step-09` copies as audit tag.
**Harvestable:** `grep -r "ORDERING:" docs/sprint-artifacts/`

### P7 — No Validation Before Action (5%)
**What:** Assumptions acted on without verification (e.g., file exists? user has permission? value is non-null?).
**Gate:** `dev-story/step-08` code-reviewer checklist item.

### P13 — Replanning Story Drop (NEW)
**What:** When an epic's story list is revised (architecture review, value alignment, scope change), stories from the original plan get dropped without explicit acknowledgment. The revision creates new stories but doesn't cross-reference the original list to verify nothing was lost.
**Gate:** `create-epics/step-06` E2E Coverage check (#9) catches the most common drop (E2E stories).
**Cross-ref guard:** When revising an epic's story list, diff the new list against `_kdbp-output/epics.md` (the original plan). For each original story NOT in the new list, explicitly state: absorbed into X, replaced by Y, or intentionally dropped because Z.
**Evidence:** Epic 18 V3→V4 revision dropped the E2E story (18-6) — caught only when reviewing the final story set, not during the revision itself.

---

## Tier 3 Patterns (Design Principles Only)

> These CANNOT be reliably hooked or automated. They require human judgment,
> periodic adversarial review (via `/kdbp-evolve-behavior`), or external testing.

### P3 — Enforcement Gap (6%)
**What:** Rules that exist in documentation but have no enforcement mechanism (hook, CI, or gate).
**Why unhookable:** Meta-pattern — "are the hooks working?" leads to infinite regress. The detection mechanism for P3 IS the periodic adversarial review process itself.
**Mitigation:** Every rule in CLAUDE.md states its enforcement mechanism. Rules without hooks are labeled as such.

### P10 — Domain Mismatch (5%)
**What:** Using the wrong tool/pattern/abstraction for the problem domain (e.g., relational thinking for graph data).
**Why unhookable:** Pure judgment call. The LLM making the mismatch cannot reliably detect it — that's WHY it's a mismatch.
**Mitigation:** Architecture review by a different agent (or human) than the one who designed it.

### P12 — Survival/Portability (5%)
**What:** Solutions that work in the current environment but break when moved (path assumptions, env-specific deps).
**Why unhookable:** Requires testing in the TARGET environment, not analysis in the source. `.gitkeep` checks (P1) cover the deterministic portion.
**Mitigation:** Template deployment testing across multiple projects. P1 infrastructure manifest catches the file-level subset.

### P11 — Invisible Cost (6%)
**What:** Operations that appear cheap but accumulate significant hidden cost (token waste, redundant CI, process overhead).
**Status:** Already covered by `session-budget.py` (compaction tracking) and `session-stop.sh` (cost logging). No additional mechanism needed.

---

## Usage

**For code reviewers:** Scan the quick-reference table. Tag findings with pattern IDs: `[P6] broken ref to...`
**For architects:** Check P9/P5/P8 at design time. Don't wait for code review to catch specification gaps.
**For evolve-behavior:** During The Roast (step-05), check each finding against this table — is it a known pattern?
**For retrospectives:** `grep -r "\[P[0-9]\+\]" docs/` to see which patterns recur most.
