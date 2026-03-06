# Tech Debt Story TD-16-2: Scan Store Deep Hardening

Status: done

> **Source:** ECC Code Review (2026-03-06) on story TD-16-1
> **Priority:** LOW | **Estimated Effort:** 3 pts

## Story
As a **developer**, I want **restoreState to validate value types at runtime, guard logging to support pluggable sinks, and internal type utilities to be auto-derived**, so that **corrupted persistence data is caught before application, telemetry can be added without code changes, and adding new slice state cannot silently break the compile-time check**.

## Acceptance Criteria
- AC-1: `restoreState` validates `phase` against allowed enum values and `images` via `Array.isArray` before applying
- AC-2: `logGuardViolation` accepts an optional sink callback (defaults to console.warn), enabling future telemetry injection
- AC-3: `resolveDialog` uses a generic or discriminated union for the result parameter instead of `unknown`
- AC-4: `_StateKeys` in `initialState.ts` auto-derives from `keyof ScanFullStore` mapped type instead of manual extraction

## Tasks / Subtasks
### Task 1: restoreState value-type validation (2 subtasks)
- [x] 1.1: Add runtime checks for critical fields (phase enum, images Array.isArray, creditStatus enum)
- [x] 1.2: Add tests for each invalid value type (number phase, string images, etc.)

### Task 2: Pluggable guard logging sink (2 subtasks)
- [x] 2.1: Add optional sink parameter to `logGuardViolation` (default: console.warn)
- [x] 2.2: Add test verifying custom sink receives events

### Task 3: Dialog result typing (1 subtask)
- [x] 3.1: Replace `result: unknown` with discriminated union per ScanDialogType

### Task 4: Auto-derive _StateKeys (1 subtask)
- [x] 4.1: Replace manual `_StateKeys` extraction with `keyof ScanFullStore` mapped type

## Dev Notes
- Source story: [TD-16-1](./TD-16-1-scan-store-quality.md)
- Review findings: #2, #3, #5, #8
- Files affected: `scanCoreSlice.ts`, `guardLog.ts`, `types.ts`, `scanDialogSlice.ts`, `initialState.ts`

## Review Deferred Items (2026-03-06)
| # | Finding | Priority | Action |
|---|---------|----------|--------|
| 2 | `_result` unused in resolveDialog — intentional scaffolding | LOW | Fold into 16-2 (overlay merge wires up result consumption) |
| 3 | VALID_PHASES/VALID_CREDIT_STATUSES manually listed vs auto-derived | LOW | Fold into 16-2 (overlay merge touches restoreState) |
| 4 | Hardcoded Spanish string in restoreState (pre-existing, 3 files) | LOW | Fold into 16-4 (move-scan-types i18n pass) |
