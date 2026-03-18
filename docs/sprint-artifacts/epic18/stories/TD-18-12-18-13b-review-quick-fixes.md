# Tech Debt Story TD-18-12: 18-13b Code Review Quick Fixes

Status: ready-for-dev

> **Source:** ECC Code Review (2026-03-17) on story TD-18-11 (bundled 18-13b changes)
> **Priority:** LOW | **Estimated Effort:** 1 point
> **Stage:** MVP

## Story
As a **developer**, I want **cleanup of minor code quality issues identified during TD-18-11 review of 18-13b bundled changes**, so that **the pending scan infrastructure follows project conventions consistently**.

## Acceptance Criteria
- AC-1: `useScanInitiation.ts:395` — Replace `useScanStore.getState()` in useCallback with hook-level store access (consistent with rest of file)
- AC-2: `useScanInitiation.ts:140` — Remove dead `processScan` prop from `ScanInitiationProps` interface (or make optional with deprecation comment)
- AC-3: `initialState.ts:29-33` — Remove `ScanPendingState` local interface, derive type from `ScanPendingSlice` in types.ts (SSoT)
- AC-4: `usePendingScan.test.ts:17` — Remove dead `mockGetDoc` variable (never asserted)
- AC-5: `useScanInitiation.ts:330` — Update stale comment "auto-trigger processScan" to reflect async pipeline

## Tasks
- [ ] 1.1: Fix getState() usage in useScanInitiation handleFileSelect callback
- [ ] 1.2: Remove or deprecate processScan prop from ScanInitiationProps
- [ ] 1.3: Derive ScanPendingState from ScanPendingSlice in initialState.ts
- [ ] 1.4: Remove dead mockGetDoc in usePendingScan test
- [ ] 1.5: Update stale comment in useScanInitiation

## Dev Notes
- Source story: [TD-18-11](./TD-18-11-gemini-model-timeout-fix.md)
- Review findings: #6, #7, #9, #10, #11
- Files affected: `src/features/scan/hooks/useScanInitiation.ts`, `src/features/scan/store/slices/initialState.ts`, `tests/unit/features/scan/hooks/usePendingScan.test.ts`
- All fixes are 1-5 lines each — trivial scope
