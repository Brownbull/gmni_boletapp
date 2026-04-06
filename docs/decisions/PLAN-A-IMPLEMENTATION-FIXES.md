# Plan A: Implementation Fixes Log

**Date:** 2026-04-01
**Source Plan:** `docs/decisions/PLAN-A-CODE-REVIEW-STRENGTHENING.md`
**Context:** Two rounds of adversarial review — first against the plan (pre-implementation), second against the implementation itself.

## Round 1: Pre-Implementation Roast (9 fixes)

Roasted from 5 attack angles against the draft plan before any code was written.

### M1 — Backend pipelines bypass the UI-only gate

**What was wrong:** The E2E blocking gate required `has_ui_changes AND ui_missing_e2e AND is_critical_path`. But the Epic 18 bugs that motivated this plan were Cloud Function and Firestore listener failures — no `.tsx` files changed. The gate wouldn't have caught the exact incident it was designed to prevent.

**Fix:** Added an integration gap check that fires independently of `has_ui_changes`. It greps the TDD agent's structured output tag (`INTEGRATION_SEAM_CHECK: FAIL`) and blocks regardless of whether UI files changed.

**Files:** `_kdbp/.../step-08-completion.md`, `_ecc/.../step-07-completion.md`

---

### M2 — TDD agent can't see both sides of a seam

**What was wrong:** The TDD agent receives only `{{files_to_review}}` — the files changed in the story. If a story modifies `processReceiptScan` (CF) but not `usePendingScan` (client listener), the agent literally cannot see the other side of the handoff to check if it's tested.

**Fix:** Added `{{pipeline_context}}` variable that lists all known async pipelines and their components. The TDD agent can now check: "does this story touch a component in a known pipeline? If yes, are the OTHER components tested?" This gives architectural context to a test-focused agent.

**Files:** `_kdbp/.../step-03-parallel-spawn.md`, `_ecc/.../step-02-parallel-spawn.md`, plus 4 knowledge-loading steps

---

### M3 — Manual smoke test escape makes the gate toothless

**What was wrong:** The proposed blocking gate had an escape: "or run manual smoke test and paste evidence here." For a solo dev, this means typing "tested manually, works" and moving on. The gate is blocking in name but self-certifying in practice.

**Fix:** Removed the manual smoke test escape entirely. Only exits: (a) write the integration/E2E test, or (b) create a TD story.

**Files:** `docs/decisions/PLAN-A-CODE-REVIEW-STRENGTHENING.md` (plan doc)

---

### M4 — False positive storm from over-broad boundary list

**What was wrong:** The boundary list included "store action → component re-render" and "hook → store." These are standard React data flow, not integration seams. Every non-trivial story would trigger the check, desensitizing the developer.

**Fix:** Restricted the boundary list to actual integration seams: CF↔Firestore, Firestore↔client listener, event emitter↔handler (mitt), upload↔queue↔process. Explicitly excluded store→component and hook→store with a NOTE marking them as unit test territory.

**Files:** `_kdbp/.../step-03-parallel-spawn.md`, `_ecc/.../step-02-parallel-spawn.md`, `.claude/rules/testing.md`, both `code-review-patterns.md`

---

### M5 — "Shared mock" option defeats the purpose of integration testing

**What was wrong:** Pattern P10's required test pattern offered "Firestore emulator, staging fixtures, or at minimum a shared mock." A shared mock tests contract adherence against a manually maintained object, not against real behavior. The Epic 18 `price` vs `totalPrice` bug was exactly this class of failure.

**Fix:** Removed "shared mock" as an acceptable approach. Integration tests must use emulator or staging fixtures — that's the whole point.

**Files:** Both `code-review-patterns.md`, `docs/decisions/PLAN-A-CODE-REVIEW-STRENGTHENING.md`

---

### M6 — Pattern numbering inconsistency

**What was wrong:** Plan called the new pattern "P10" but existing patterns are numbered 1–8 with no P prefix and no P9. Would break heading format consistency and any grep tooling.

**Fix:** Numbered it `### 9.` to follow existing convention.

**Files:** Both `code-review-patterns.md`, `docs/decisions/PLAN-A-CODE-REVIEW-STRENGTHENING.md`

---

### M7 — No structured output for triage to parse

**What was wrong:** The TDD agent's output format had no field for "Integration Gap" as a typed finding. Triage (step-05) classifies findings by effort, but without a parseable output line, integration gaps would get lost in prose.

**Fix:** Added mandatory structured output lines to TDD agent prompt:
- `Integration Gaps: [handoff] [missing coverage] [files] — or NONE`
- `<!-- INTEGRATION_SEAM_CHECK: [PASS|FAIL|N/A] handoffs=[N] tested=[N] -->`

Step-08 greps for the tag. Harvestable for trend analysis.

**Files:** `_kdbp/.../step-03-parallel-spawn.md`, `_ecc/.../step-02-parallel-spawn.md`

---

### E1 — No adoption verification mechanism

**What was wrong:** No way to measure whether the integration check is actually running. Six months later, you can't answer "is this working?" without reading every review transcript.

**Fix:** The `INTEGRATION_SEAM_CHECK` structured tag (from M7) serves double duty — step-08 uses it for gating, and it's greppable across sprint artifacts for compliance monitoring.

**Files:** Same as M7

---

### E2 — Dev-story path bypasses the gate entirely

**What was wrong:** A developer who ships via `/kdbp-dev-story` → `/deploy-story` without running `/kdbp-code-review` would never hit the integration gate. The plan only modified code-review workflows.

**Fix:** Added integration gap checks to both dev-story completion steps (KDBP step-09, ECC step-08). These surface a warning when the story touches pipeline files without integration test coverage.

**Files:** `_kdbp/.../step-09-completion.md`, `_ecc/.../step-08-completion.md`

---

## Round 2: Post-Implementation Roast (6 fixes)

Adversarial review of the actual implementation, checking KDBP/ECC mirror consistency, logic correctness, and SSoT compliance.

### M1 — ECC triage step missed entirely

**What was wrong:** KDBP step-05 (triage) got the integration gap QUICK/COMPLEX classification examples, but ECC step-04 (triage) was never updated. Integration gaps flagged by the ECC TDD agent would reach triage with no classification guidance.

**Fix:** Added the same two classification lines to `_ecc/.../step-04-triage.md`:
- QUICK: "Missing integration test for a single handoff (1 test file, <50 lines)"
- COMPLEX: "Missing integration test infrastructure" and "Multiple untested integration seams"

**Files:** `_ecc/workflows/ecc-code-review/steps/step-04-triage.md`

---

### M2 — Gate re-blocks gaps already resolved in triage

**What was wrong:** Step-08 checks for `INTEGRATION_SEAM_CHECK: FAIL` but has no way to know if triage already handled it. If triage deferred the gap to a TD story (correct behavior), step-08 would still fire BLOCKING — a false block on a properly handled story.

**Fix:** Added a resolution check: step-08 now searches `{{fixed_items}}` and `{{td_items}}` for findings tagged "Integration Gap." If found in either list, `{{integration_gap_resolved}}` is set true and the gate doesn't fire.

**Files:** `_kdbp/.../step-08-completion.md`, `_ecc/.../step-07-completion.md`

---

### M3 — STANDARD classification skips the TDD agent

**What was wrong:** STANDARD classification sets `review_agents = ["code-reviewer", "security-reviewer"]` — no TDD guide. Stories classified STANDARD (4-6 files, security-sensitive) that touch async pipelines would never get the integration seam check because it lives exclusively in the TDD agent prompt.

**Fix:** Added a pipeline file detection + tdd-guide force-include rule to both KDBP step-02 and ECC step-01 classification sections. When `{{file_paths}}` match pipeline patterns (`functions/**`, `src/hooks/use*Scan*`, etc.), tdd-guide is force-added to `{{review_agents}}`.

**Files:** `_kdbp/.../step-02-story-discovery.md`, `_ecc/.../step-01-story-discovery.md`

---

### M4 — Pipeline list defined in 4 places (SSoT violation)

**What was wrong:** `{{pipeline_context}}` was hardcoded identically in 4 knowledge-loading steps (KDBP code-review step-01, KDBP dev-story step-01, ECC code-review step-01, ECC dev-story step-01). When a new pipeline is added, all 4 files must be updated manually — exactly the SSoT violation Pattern 8 warns about.

**Fix:** Created a single `_kdbp/knowledge/pipeline-registry.md` with all pipeline definitions, file patterns, and component listings. All 4 knowledge steps now load it with a single `Load pipeline-registry.md → {{pipeline_context}}` action.

**Files:** New `_kdbp/knowledge/pipeline-registry.md`, 4 knowledge-loading steps simplified

---

### M5 — ECC TDD agent missing the concrete example

**What was wrong:** The KDBP TDD agent prompt includes a concrete example gap: "usePendingScan mocks onSnapshot; processReceiptScan mocks Firestore write — nobody tests that writing the doc actually triggers the listener." The ECC mirror omitted this. The example is what makes the instruction concrete enough for a sonnet agent to follow.

**Fix:** Added the same example gap line to the ECC TDD agent prompt.

**Files:** `_ecc/.../step-02-parallel-spawn.md`

---

### M6 — ECC Pattern 9 missing verification commands

**What was wrong:** KDBP's Pattern 9 includes a `**Verification:**` section with bash commands to check for integration tests and detect the mocking trap. ECC's mirror omitted this section.

**Fix:** Added the same verification bash commands to ECC's Pattern 9.

**Files:** `_ecc/knowledge/code-review-patterns.md`

---

## Complete File Change Summary

| File | Round | Fixes |
|------|-------|-------|
| `.claude/rules/testing.md` | R1 | M4 (boundary list), M5 (no shared mocks) |
| `_kdbp/knowledge/code-review-patterns.md` | R1 | M4, M5, M6 (Pattern 9) |
| `_kdbp/knowledge/pipeline-registry.md` | R2 | M4 (new SSoT file) |
| `_kdbp/.../step-01-knowledge.md` (code-review) | R1+R2 | M2 (pipeline_context), M4 (registry ref) |
| `_kdbp/.../step-01-knowledge.md` (dev-story) | R1+R2 | M2 (pipeline_context), M4 (registry ref) |
| `_kdbp/.../step-02-story-discovery.md` | R2 | M3 (tdd-guide force-include) |
| `_kdbp/.../step-03-parallel-spawn.md` | R1 | M2, M4, M7 (TDD agent prompt) |
| `_kdbp/.../step-05-triage.md` | R1 | Integration gap classification |
| `_kdbp/.../step-08-completion.md` (code-review) | R1+R2 | M1 (gate), M3 (no escape), M2 (resolution check) |
| `_kdbp/.../step-09-completion.md` (dev-story) | R1 | E2 (dev-story path) |
| `_ecc/knowledge/code-review-patterns.md` | R1+R2 | M4, M5, M6 (Pattern 9), M6 (verification) |
| `_ecc/.../step-01-story-discovery.md` | R1+R2 | M2, M4 (registry ref), M3 (force-include) |
| `_ecc/.../step-02-parallel-spawn.md` | R1+R2 | M2, M4, M7, M5 (example gap) |
| `_ecc/.../step-04-triage.md` | R2 | M1 (classification) |
| `_ecc/.../step-07-completion.md` | R1+R2 | M1, M3, M2 (resolution check) |
| `_ecc/.../step-08-completion.md` (dev-story) | R1 | E2 (dev-story path) |
| `docs/decisions/PLAN-A-...md` | R1 | All plan-level fixes |