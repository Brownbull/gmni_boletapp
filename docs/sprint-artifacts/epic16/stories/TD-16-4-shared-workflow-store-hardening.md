# Tech Debt Story TD-16-4: Shared Workflow Store Hardening

Status: done

> **Source:** KDBP Code Review (2026-03-07) on story 16-6
> **Priority:** LOW | **Estimated Effort:** 3 pts

## Story
As a **developer**, I want **the shared workflow store's dual-state mirroring audited, integration-tested, and test infrastructure cleaned up**, so that **the store is robust against drift and test coupling is minimized**.

## Acceptance Criteria
- AC-1: Integration test verifying scan→shared store→batch-review data flow (story 16-6 AC 6.3)
- AC-2: Dual phase/mode/activeDialog mirroring documented with invariant comments explaining which store is source of truth
- AC-3: resetAllStores() replaced with store registry pattern or documented as intentional
- AC-4: workflowActions facade evaluated — either justify or remove in favor of direct getState() calls

## Tasks / Subtasks
- [x] 1. Write integration test: scan start → addImage → processStart → batchComplete → verify batch-review reads correct data from shared store
- [x] 2. Add invariant comments to scanCoreSlice.ts documenting mirror writes (phase, mode, activeDialog) and that scan store is the single writer
- [x] 3. Evaluate resetAllStores() pattern — consider store registry or document as intentional test coupling
- [x] 4. Evaluate workflowActions facade — measure if it prevents tree-shaking or adds maintenance burden

## Dev Notes
- Source story: [16-6](./16-6-extract-shared-workflow-store.md)
- Review findings: #4, #6, #11, #12
- Files affected: `src/shared/stores/useScanWorkflowStore.ts`, `src/features/scan/store/slices/scanCoreSlice.ts`, `src/features/scan/store/__tests__/helpers.ts`, `tests/integration/`
- The dual state (phase in both stores) is deliberate: scan owns decisions, shared store transports data. But if a mirror call is missed, consumers read stale phase.
- AC-3 decision: resetAllStores() documented as intentional — store registry adds indirection for minimal gain in test-only 2-store reset
- AC-4 decision: workflowActions facade REMOVED — zero production consumers, duplicated 13 methods, blocked tree-shaking. Tests migrated to getState() pattern.
- Integration test: `tests/integration/scan-workflow-store.test.ts` — 37 tests, full lifecycle coverage

## Senior Developer Review (KDBP)
- **Date:** 2026-03-07
- **Classification:** SIMPLE
- **Agents:** code-reviewer, tdd-guide
- **Score:** 8.75/10 — APPROVE
- **Quick fixes applied:** 2 (mode ownership clarification in shared store header, trailing blank line in processStart)
- **TD stories created:** 0
- **Action items:** 0
<!-- CITED: none -->
