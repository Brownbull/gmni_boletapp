# Plan A: Code Review Workflow Strengthening

**Status:** IMPLEMENTED
**Date:** 2026-04-01
**Motivation:** Post-mortem of Epic 18 scan pipeline — 7 emergency fixes after "done" stories, 5/7 were integration bugs invisible to unit-test-focused review
**Roast Applied:** 9 gaps fixed from adversarial review (2026-04-01)

## Problem Statement

The KDBP code review workflow has 5 specialized agents (code, security, architect, TDD, UI) but a systemic blind spot: **it verifies parts, not the whole**. The TDD agent checks unit test coverage and AC compliance. Nobody checks whether the pieces actually integrate.

Evidence:
- 794 scan tests, 0 integration tests for the async delivery chain
- 18-13a reviewed at 7.9/10, 18-13b at 6.8/10 — both APPROVE
- 11 days between "done" and "first real-world test"
- Step 08 detects E2E gaps but only "recommends" — never blocks

## Changes Overview

| # | File | Change | Purpose |
|---|------|--------|---------|
| 1 | `.claude/rules/testing.md` | Add integration test tier definition | Define what integration tests ARE and WHEN they're required |
| 2 | `_kdbp/.../step-03-parallel-spawn.md` | Add integration seam check to TDD agent prompt | TDD agent checks for cross-boundary test coverage |
| 3 | `_kdbp/.../step-05-triage.md` | Add integration gap as QUICK-classifiable finding | Integration gaps surface in triage, not just completion |
| 4 | `_kdbp/.../step-08-completion.md` | Promote E2E/integration gap from "recommend" to gate | Block completion when integration gap unresolved in triage |
| 5 | `_kdbp/knowledge/code-review-patterns.md` | Add Pattern 9: Integration Seam Coverage | Codify the integration testing pattern |
| 6 | `_ecc/.../step-02-parallel-spawn.md` | Mirror TDD agent change (simplified) | ECC baseline also catches integration gaps |
| 7 | `_ecc/.../step-07-completion.md` | Mirror E2E gate (simplified) | ECC baseline also blocks on E2E gaps |
| 8 | `_kdbp/.../step-09-completion.md` | Add integration seam check to dev-story completion | Dev-story path also catches integration gaps |
| 9 | `_ecc/.../step-08-completion.md` | Mirror dev-story integration check (simplified) | ECC dev-story path also catches integration gaps |

## Detailed Changes

### Change 1: testing.md — Add Integration Test Definition

**File:** `.claude/rules/testing.md`
**Where:** After line 6 (after Test Tiers section), insert new section before Coverage Thresholds

```markdown
## Integration Test Requirements
- Integration tests verify handoffs BETWEEN components (not components in isolation)
- Required when a story crosses 2+ boundaries: client↔server, hook↔store, event↔handler, CF↔Firestore listener
- Must exercise at least one REAL handoff — not mocked on both sides
- Minimum: one integration test per async pipeline (upload→queue→process→listener→UI)
- Use Firestore emulator or staging fixtures (see Plan B) for real listener tests
- Integration tests live in `tests/integration/` and count toward `test:story` tier
```

**Rationale:** Currently testing.md says `test:story` = "unit + integration" but never defines what integration means. This gives the TDD agent something to check against.

### Change 2: step-03-parallel-spawn.md — TDD Agent Integration Check

**File:** `_kdbp/workflows/kdbp-code-review/steps/step-03-parallel-spawn.md`
**Where:** Lines 184-202 (Task 4: TDD Guide prompt), add integration seam check to the review instructions

Current TDD agent prompt (line 190):
```
**Review:** AC coverage, edge cases, error scenarios, assertion quality, mock appropriateness, naming
```

Replace with:
```
**Review:** AC coverage, edge cases, error scenarios, assertion quality, mock appropriateness, naming

**Known Async Pipelines (check if story touches any component):**
{{pipeline_context}}
<!-- pipeline_context is populated from architecture docs: list of pipelines and their components.
     Example: "scan pipeline: queueScanFromImages → processReceiptScan → onSnapshot in usePendingScan"
     If a story touches ANY component in a pipeline, the OTHER components must also be tested. -->

**Integration Seam Check (MANDATORY for stories touching async pipelines or cross-boundary handoffs):**
Integration seams are: Cloud Function ↔ Firestore listener, Firestore write ↔ client onSnapshot,
event emitter ↔ event handler (mitt bus), upload ↔ queue ↔ process ↔ deliver.
NOTE: store→component and hook→store are NOT integration seams — those are unit test territory.
For each seam: does at least ONE test exercise the handoff with real data flow (emulator or staging)?
If ALL seams are mocked on both sides: flag as "Integration Gap" (severity: HIGH, certainty: HIGH).
Example gap: "usePendingScan mocks onSnapshot; processReceiptScan mocks Firestore write — nobody tests
that writing the doc actually triggers the listener."

**Output line (MANDATORY — always include, even if N/A):**
Integration Gaps: [handoff] [missing coverage] [files] — or NONE
<!-- INTEGRATION_SEAM_CHECK: [PASS|FAIL|N/A] handoffs=[N] tested=[N] -->
```

**Rationale:** The TDD agent already reads all test files. This gives it a specific check: "are both sides of a handoff mocked independently?" If yes, flag it. The `{{pipeline_context}}` variable provides architectural context so the agent can detect seams even when only one side is in the changed file list. The structured output line ensures triage can parse the finding and step-08 can verify compliance.

### Change 3: step-05-triage.md — Integration Gap Classification

**File:** `_kdbp/workflows/kdbp-code-review/steps/step-05-triage.md`
**Where:** Lines 18-30 (effort classification), add integration gap to QUICK or COMPLEX based on scope

After the QUICK classification examples (line 23), add:
```
    - Missing integration test for a single handoff (1 test file, <50 lines) → QUICK
```

After the COMPLEX classification examples (line 29), add:
```
    - Missing integration test infrastructure (emulator setup, fixture system, new test patterns) → COMPLEX/MVP
    - Multiple untested integration seams across a pipeline → COMPLEX/MVP
```

**Rationale:** Integration gaps should be classified like any other finding — they enter triage and get routed to fix/defer/backlog based on effort and stage. A single missing test is QUICK. A missing test infrastructure is COMPLEX/MVP (not PROD/SCALE — it breaks features).

### Change 4: step-08-completion.md — E2E Gate Enforcement

**File:** `_kdbp/workflows/kdbp-code-review/steps/step-08-completion.md`
**Where:** Lines 19-28 (E2E Coverage Check) and line 98 (Next Steps recommend)

Current (line 76, informational):
```
{{#if has_ui_changes and ui_missing_e2e}}**E2E Gap:** {{uncovered_testids}}{{#if is_critical_path}} — CRITICAL PATH{{/if}}{{/if}}
```

Current (line 98, just a recommendation):
```
{{#if has_ui_changes and ui_missing_e2e and is_critical_path}}- **Recommend:** Run E2E tests — E2E gap on critical path{{/if}}
```

Replace line 98 with enforcement:
```
{{#if has_ui_changes and ui_missing_e2e and is_critical_path}}- **BLOCKING:** E2E gap on critical path ({{critical_path_reason}}). Create TD story for E2E coverage before deploy.{{/if}}
```

Note: No manual smoke test escape — the only exits are: (a) write the test, or (b) create a TD story.

Add after the E2E check block (after line 28), a new integration gap check:
```
  <!-- Integration Seam Gap Check (fires regardless of has_ui_changes — backend-only pipelines need this too) -->
  <action>Grep TDD agent output for "<!-- INTEGRATION_SEAM_CHECK:" tag</action>
  <action>Set {{has_integration_gap}} = true if tag shows FAIL</action>
  <action>Set {{integration_seam_check}} = full tag value (for reporting)</action>
  <check if="{{has_integration_gap}} and integration gaps were not fixed or deferred in triage">
    <output>**BLOCKING: INTEGRATION GAP** — Story has untested handoffs between components. This is the #1 source of post-deploy bugs (see Epic 18 post-mortem). Create TD story for integration test coverage before marking done.</output>
    <action>Set {{new_status}} = "in-progress" (do NOT mark done)</action>
  </check>
```

**Rationale:** "Recommend" didn't work — 18-13 was recommended E2E coverage and nobody acted on it. "BLOCKING" means the review can't mark the story done without either (a) fixing the gap or (b) creating a TD story for it. The integration gap check fires independently of `has_ui_changes` because the Epic 18 bugs were backend CF↔Firestore seam failures that would have bypassed a UI-only gate. The structured tag from the TDD agent (`INTEGRATION_SEAM_CHECK`) makes the check parseable rather than relying on prose scanning.

### Change 5: code-review-patterns.md — Pattern 9

**File:** `_kdbp/knowledge/code-review-patterns.md`
**Where:** After the last pattern (currently 8: SSoT at ~line 215), add new pattern

```markdown
### 9. Integration Seam Coverage

**Severity:** HIGH | **Frequency:** Every async pipeline, event bus, or cross-boundary feature

**Trigger:** Story introduces or modifies a chain where data flows across integration seams:
- Cloud Function → Firestore → Client listener
- Event emitter → Event handler (mitt bus)
- Upload → Queue → Process → Deliver

NOTE: store→component and hook→store are NOT integration seams — those are standard React data flow covered by unit tests.

**Check:** For each seam crossing, verify at least ONE test exercises the handoff with data flowing through (not mocked on both sides). Tests MUST use Firestore emulator or staging fixtures — shared mocks do not count as integration coverage (they test contract adherence against a manually maintained object, not real behavior).

**Anti-pattern (The Mocking Trap):**
```typescript
// Test A: mocks Firestore, tests CF writes correct data
mockFirestore.set.mockResolvedValue(undefined)
expect(mockFirestore.set).toHaveBeenCalledWith({ status: 'completed', ... })

// Test B: mocks onSnapshot, tests hook calls callback
mockOnSnapshot.mockImplementation((_, callback) => callback({ data: () => mockData }))
expect(onCompleted).toHaveBeenCalledWith(mockData)

// PROBLEM: Neither test verifies that CF's write format matches hook's read format
// Neither test verifies the listener actually subscribes at the right time
```

**Required test pattern:**
```typescript
// Integration test: data flows from writer to reader
// MUST use Firestore emulator or staging fixtures — shared mocks do NOT qualify
const realDoc = { status: 'completed', result: { merchant: 'Test', ... } }
// Writer side: verify this is what gets written
// Reader side: verify this exact shape triggers the callback
// REQUIRED: verify timing — listener is subscribed BEFORE write happens
// (timing was the ROOT CAUSE of Epic 18 — listener not mounted when write arrived)
```

**Real incident:** Epic 18 Story 18-13: 794 unit tests passed, 5 of 7 post-deploy bugs were integration seam failures. useScanEventSubscription never mounted, processStart never called, price field not remapped between two CFs.
```

### Change 6 & 7: ECC Baseline Mirrors

Mirror the same changes in simplified form to the ECC workflow:
- `_ecc/workflows/ecc-code-review/steps/step-02-parallel-spawn.md` — Add integration seam check to TDD agent (lines 93-117)
- `_ecc/workflows/ecc-code-review/steps/step-07-completion.md` — Add E2E gate enforcement
- `_ecc/knowledge/code-review-patterns.md` — Add P10 pattern (same content)

These are straight copies of the KDBP changes, adapted to ECC's simpler structure.

### Change 8: kdbp-dev-story completion — Integration Check

**File:** `_kdbp/workflows/kdbp-dev-story/steps/step-09-completion.md`
**Where:** After the E2E coverage check block

Add the same integration seam gap check from Change 4:
```
  <!-- Integration Seam Gap Check (mirrors code-review step-08) -->
  <action>If story touched any known async pipeline component (from {{pipeline_context}}):
    Check if integration tests exist for the touched seams</action>
  <action>Set {{has_integration_gap}} = true/false</action>
  <check if="{{has_integration_gap}}">
    <output>**INTEGRATION GAP:** Story touches async pipeline but no integration test covers the seam. Run `/kdbp-code-review` before deploying, or create TD story for integration coverage.</output>
  </check>
```

**Rationale:** A developer who ships via dev-story → deploy-story without running code-review would bypass the integration gate entirely. This ensures the dev-story path also surfaces integration gaps.

### Change 9: ECC dev-story mirror

**File:** `_ecc/workflows/ecc-dev-story/steps/step-08-completion.md`

Mirror Change 8 in simplified form for the ECC baseline.

## What This Does NOT Change

- **No new agents.** The TDD agent already has the context to check integration seams — it just needs the instruction and pipeline context.
- **No new CI jobs.** Integration tests run in existing `test:story` tier.
- **No new hooks.** The enforcement is in the workflow steps, not in `.claude/settings.json`.
- **No process overhead for simple stories.** The integration seam check only triggers when a story touches a known async pipeline component — a simple component rename or UI-only change won't trigger it.
- **New variable required:** `{{pipeline_context}}` must be populated before step-03 with the list of known async pipelines from architecture docs.

## Estimated Effort

- 9 file edits (7 original + 2 dev-story paths), all under 30 lines of additions each
- No code changes, only workflow/knowledge/rules files
- One new variable (`{{pipeline_context}}`) needs population logic in step-01 or step-02
- Can be done in a single session (~45 min)

## Verification

After implementing, verify by running a mock review on a story that has an integration gap:
1. Pick a story with async pipeline code (e.g., any scan story)
2. Run `/kdbp-code-review` on it
3. Verify TDD agent flags integration gaps
4. Verify Step 08 shows the gate (not just a recommendation)

## Risk

- **False positives:** Mitigated by restricting integration seams to actual cross-system boundaries (CF↔Firestore, emitter↔handler, upload↔queue↔process). Store→component and hook→store excluded — those are unit test territory.
- **Over-blocking:** Integration gap gate fires only when TDD agent flags FAIL AND the gap wasn't resolved in triage. E2E gate fires only on `is_critical_path AND ui_missing_e2e`. Simple stories won't trigger either.
- **TDD agent visibility:** Agent may not see both sides of a seam if only one side is in changed files. Mitigated by `{{pipeline_context}}` variable that lists known pipelines so the agent can check "does this story touch a pipeline component?"
- **Adoption verification:** Structured output tag (`INTEGRATION_SEAM_CHECK`) enables grep-based compliance monitoring. Without it, no way to know if the check is actually running.
