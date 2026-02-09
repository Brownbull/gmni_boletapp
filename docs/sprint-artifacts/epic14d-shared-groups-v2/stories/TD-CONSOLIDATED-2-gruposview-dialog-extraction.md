# TD-CONSOLIDATED-2: GruposView Dialog Extraction

Status: done

> **Tier:** 1 - Code Bloat Prevention (MUST DO)
> **Consolidated from:** TD-14d-3
> **Priority:** HIGH
> **Estimated Effort:** 2-3 hours
> **Risk:** LOW (straightforward extraction, no logic changes)
> **Dependencies:** TD-CONSOLIDATED-1

## Story

As a **developer**,
I want **the dialog rendering in GruposView.tsx extracted to GruposViewDialogs.tsx**,
So that **GruposView.tsx stays under the 400-line guideline and is easier to maintain**.

## Problem Statement

`GruposView.tsx` is currently ~921 lines, exceeding the 400-line guideline. Lines 654-782 contain dialog rendering JSX for 6+ dialogs that can be cleanly extracted.

## Acceptance Criteria

- [x] Extract dialog rendering to `GruposViewDialogs.tsx`
- [x] GruposView.tsx reduced to under 400 lines (390 lines)
- [x] All existing tests pass (8122 passed, 307 test files)
- [x] No visual or behavioral changes

## Cross-References

- **Original story:** [TD-14d-3](TD-ARCHIVED/TD-14d-3-gruposview-dialog-extraction.md)
- **Blocked by:** TD-CONSOLIDATED-1 (groupService modularization)
- **Source:** ECC Code Review #4 (2026-02-03) on story 14d-v2-1-7e
- **ECC Review 14d-v2-1-13+14 (2026-02-07):** GruposView.tsx now 1082 lines (exceeds 800 max). Parallel accept code paths (dialog-based vs auto-accept) share duplicate opt-in wiring — extract to shared handler during dialog extraction

## Senior Developer Review (ECC)

- **Review date:** 2026-02-08
- **Classification:** SIMPLE
- **ECC agents used:** code-reviewer, tdd-guide
- **Outcome:** APPROVED (8.5/10)
- **Quick fixes applied:** 3 (#3 handleEditSave error test, #4 dead props removal, #6 skipped - negligible)
- **Action items deferred:** 4 (2 to TD-CONSOLIDATED-19, 2 already in TD-CONSOLIDATED-8)

### Tech Debt Stories Created

| TD Story | Description | Priority |
|----------|-------------|----------|
| [TD-CONSOLIDATED-19](./TD-CONSOLIDATED-19-handler-error-coverage.md) | Re-thrown errors + handleToggleTransactionSharing test coverage | MEDIUM |

Note: Findings #5 (test file size) and #7 (duplicated mocks) already scoped in [TD-CONSOLIDATED-8](./TD-CONSOLIDATED-8-test-infrastructure-cleanup.md).
