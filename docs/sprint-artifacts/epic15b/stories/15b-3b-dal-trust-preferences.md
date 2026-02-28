# Story 15b-3b: DAL: Migrate Trust + Preferences Hooks to Repositories

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 3 - Infrastructure
**Points:** 2
**Priority:** MEDIUM
**Status:** done

## Overview

Trust migration is already complete -- zero consumers import directly from `merchantTrustService` outside the repository. Preferences migration of the main data-access hook (`useUserPreferences.ts`) is also complete (uses `usePreferencesRepository()`). However, 10 non-repository files still import **types and constants** from `userPreferencesService.ts`, creating a DAL layer violation where UI components reach into the service layer for shared types (`SupportedCurrency`, `UserPreferences`, `ForeignLocationDisplayFormat`, `SupportedFontFamily`) and runtime constants (`SUPPORTED_CURRENCIES`, `CURRENCY_INFO`). This story extracts those types and constants to proper shared locations and redirects all 10 consumer imports.

## Functional Acceptance Criteria

- [x] **AC1:** Trust service -- confirmed zero non-repository consumers (no work needed)
- [x] **AC2:** All `userPreferencesService` type imports redirected to `src/types/preferences.ts` (12 files)
- [x] **AC3:** All `userPreferencesService` constant imports (`SUPPORTED_CURRENCIES`, `CURRENCY_INFO`) redirected to a shared module (2 files)
- [x] **AC4:** No direct `userPreferencesService` imports in non-repository files after migration
- [x] **AC5:** `npm run test:quick` passes with 0 failures (296 files, 7114 tests)

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [x] **AC-ARCH-LOC-1:** New types file at `src/types/preferences.ts` containing `SupportedCurrency`, `SupportedFontFamily`, `ForeignLocationDisplayFormat`, `UserPreferences`
- [x] **AC-ARCH-LOC-2:** `SUPPORTED_CURRENCIES` and `CURRENCY_INFO` constants moved to `src/utils/currency.ts` (existing file, natural home for currency data)
- [x] **AC-ARCH-LOC-3:** `src/services/userPreferencesService.ts` re-imports types from `src/types/preferences.ts` and constants from `src/utils/currency.ts` (service becomes consumer, not source)
- [x] **AC-ARCH-LOC-4:** `src/repositories/preferencesRepository.ts` imports types from `src/types/preferences.ts`

### Pattern Requirements

- [x] **AC-ARCH-PATTERN-1:** Consumer imports use `@/types/preferences` for types and `@/utils/currency` for constants
- [x] **AC-ARCH-PATTERN-2:** All bare `import { SupportedCurrency }` statements converted to `import type { SupportedCurrency }` where only types are imported (App.tsx, EditView.tsx, EditViewScanSection.tsx)
- [x] **AC-ARCH-PATTERN-3:** `src/types/settings.ts` existing `Currency` type alias retained for backward compat -- do NOT merge with `SupportedCurrency` in this story
- [x] **AC-ARCH-PATTERN-4:** `userPreferencesService.ts` re-exports all types and constants it previously defined, for backward compat with tests and functions

### Anti-Pattern Requirements (Must NOT Happen)

- [x] **AC-ARCH-NO-1:** No new business logic added during extraction -- pure type/constant relocation
- [x] **AC-ARCH-NO-2:** No changes to `userPreferencesService.ts` runtime behavior -- only import sources change
- [x] **AC-ARCH-NO-3:** No function signature changes in any consumer
- [x] **AC-ARCH-NO-4:** No consolidation of `Currency` (settings.ts) and `SupportedCurrency` (preferences.ts) in this story -- that is a separate cleanup

## File Specification

### New Files

| File | Exact Path | Purpose | Est. Lines |
|------|------------|---------|------------|
| Preferences types | `src/types/preferences.ts` | Canonical home for `SupportedCurrency`, `SupportedFontFamily`, `ForeignLocationDisplayFormat`, `UserPreferences` | ~50 |

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| Currency utils | `src/utils/currency.ts` | Add `SUPPORTED_CURRENCIES` and `CURRENCY_INFO` constants (moved from service) |
| Preferences service | `src/services/userPreferencesService.ts` | Re-export types from `@/types/preferences`; re-export constants from `@/utils/currency`; remove local definitions |
| Preferences repository | `src/repositories/preferencesRepository.ts` | Import `UserPreferences` from `@/types/preferences` instead of service |
| useUserPreferences.ts | `src/hooks/useUserPreferences.ts` | Import types from `@/types/preferences` instead of service |
| TransactionCard.tsx | `src/components/transactions/TransactionCard.tsx` | Import type from `@/types/preferences` |
| useSettingsViewData.ts | `src/features/settings/views/SettingsView/useSettingsViewData.ts` | Import types from `@/types/preferences` |
| EscaneoView.tsx | `src/features/settings/components/subviews/EscaneoView.tsx` | Types from `@/types/preferences`, constants from `@/utils/currency` |
| AdvancedScanOptions.tsx | `src/features/transaction-editor/components/AdvancedScanOptions.tsx` | Type from `@/types/preferences`, constant from `@/utils/currency` |
| useTransactionHandlers.ts | `src/hooks/app/useTransactionHandlers.ts` | Import type from `@/types/preferences` |
| useScanHandlers.ts | `src/features/scan/hooks/useScanHandlers.ts` | Import type from `@/types/preferences` |
| useScanInitiation.ts | `src/features/scan/hooks/useScanInitiation.ts` | Import type from `@/types/preferences` |
| ScanFeature.tsx | `src/features/scan/ScanFeature.tsx` | Import type from `@/types/preferences` |
| App.tsx | `src/App.tsx` | Import `type { SupportedCurrency }` from `@/types/preferences` (add `type` keyword) |
| EditView.tsx | `src/features/transaction-editor/views/EditView.tsx` | Import `type { SupportedCurrency }` from `@/types/preferences` (add `type` keyword) |

### Unchanged Files

| File | Exact Path | Reason |
|------|------------|--------|
| Trust repository | `src/repositories/trustRepository.ts` | Already sole consumer of `merchantTrustService` -- no changes needed |
| Merchant trust service | `src/services/merchantTrustService.ts` | No external consumers outside repository |
| useTrustedMerchants.ts | `src/hooks/useTrustedMerchants.ts` | Already uses `useTrustRepository()` -- fully migrated |
| Repository hooks | `src/repositories/hooks.ts` | Already provides `usePreferencesRepository()` -- no changes |

## Tasks / Subtasks

### Task 1: Establish baseline and confirm trust status

- [x] 1.1 Run `npm run test:quick` and record total pass count — 296 files, 7114 tests
- [x] 1.2 Trust: 0 non-repo consumers (fully migrated)
- [x] 1.3 Preferences: 12 non-repo consumers (not 10 — 2 additional from 15b-2l decomposition: scanHandlerTypes.ts, EditViewScanSection.tsx)

### Task 2: Create src/types/preferences.ts and relocate constants

- [x] 2.1 Created `src/types/preferences.ts` with `SupportedCurrency`, `SupportedFontFamily`, `ForeignLocationDisplayFormat`, `UserPreferences`
- [x] 2.2 Moved `SUPPORTED_CURRENCIES` and `CURRENCY_INFO` to `src/utils/currency.ts`
- [x] 2.3 Updated `userPreferencesService.ts`: re-exports types from `@/types/preferences`, constants from `@/utils/currency`
- [x] 2.4 Updated `preferencesRepository.ts`: imports `UserPreferences` from `@/types/preferences`
- [x] 2.5 `npx tsc --noEmit` — clean

### Task 3: Migrate type-only consumers (7 files — 6 original + scanHandlerTypes.ts)

- [x] 3.1 `TransactionCard.tsx` — `import type { ForeignLocationDisplayFormat }` from `@/types/preferences`
- [x] 3.2 `useSettingsViewData.ts` — `import type { SupportedCurrency, ForeignLocationDisplayFormat }` from `@/types/preferences`
- [x] 3.3 `useTransactionHandlers.ts` — `import type { UserPreferences }` from `@/types/preferences`
- [x] 3.4 `scanHandlerTypes.ts` — `import type { UserPreferences }` from `@/types/preferences` (replaces useScanHandlers.ts per 15b-2l)
- [x] 3.5 `useScanInitiation.ts` — `import type { SupportedCurrency }` from `@/types/preferences`
- [x] 3.6 `ScanFeature.tsx` — `import type { SupportedCurrency }` from `@/types/preferences`
- [x] 3.7 `npx tsc --noEmit` — clean

### Task 4: Migrate runtime + type consumers (5 files — 4 original + EditViewScanSection.tsx)

- [x] 4.1 `EscaneoView.tsx` — types from `@/types/preferences`, `SUPPORTED_CURRENCIES` from `@/utils/currency`
- [x] 4.2 `AdvancedScanOptions.tsx` — type from `@/types/preferences`, `SUPPORTED_CURRENCIES` from `@/utils/currency`
- [x] 4.3 `App.tsx` — `import type { SupportedCurrency }` from `@/types/preferences`
- [x] 4.4 `EditView.tsx` — `import type { SupportedCurrency }` from `@/types/preferences`
- [x] 4.4b `EditViewScanSection.tsx` — `import type { SupportedCurrency }` from `@/types/preferences` (added per 15b-2l)
- [x] 4.5 `npx tsc --noEmit` — clean

### Task 5: Migrate useUserPreferences hook

- [x] 5.1 `useUserPreferences.ts` — type imports from `@/types/preferences`
- [x] 5.2 `npx tsc --noEmit` — clean

### Task 6: Final verification

- [x] 6.1 0 non-repo/non-service import statements from `userPreferencesService`
- [x] 6.2 4 test files still import from service — backward compat re-exports work
- [x] 6.3 `npm run test:quick` — 296 files, 7114 tests (same as baseline)

## Dev Notes

### Trust Status (No Work Required)

Trust migration was completed in Epic 15 Phase 6c. Current state:
- `src/repositories/trustRepository.ts` -- sole consumer of `merchantTrustService` (legitimate)
- `src/hooks/useTrustedMerchants.ts` -- uses `useTrustRepository()` from `@/repositories`
- Zero other files import from `merchantTrustService`

### Migration Pattern -- Type-Only Files

```typescript
// Before:
import type { ForeignLocationDisplayFormat } from '../../services/userPreferencesService';

// After:
import type { ForeignLocationDisplayFormat } from '@/types/preferences';
```

### Migration Pattern -- Runtime Constant Files

```typescript
// Before (EscaneoView.tsx):
import { SupportedCurrency, SUPPORTED_CURRENCIES, ForeignLocationDisplayFormat } from '@/services/userPreferencesService';

// After:
import type { SupportedCurrency, ForeignLocationDisplayFormat } from '@/types/preferences';
import { SUPPORTED_CURRENCIES } from '@/utils/currency';
```

### Service File Becomes Consumer

```typescript
// After (userPreferencesService.ts):
// Re-export for backward compatibility
export type { SupportedCurrency, SupportedFontFamily, ForeignLocationDisplayFormat, UserPreferences } from '@/types/preferences';
export { SUPPORTED_CURRENCIES, CURRENCY_INFO } from '@/utils/currency';
// Import for local use
import type { SupportedCurrency, UserPreferences } from '@/types/preferences';
```

### Critical Pitfalls

1. **Re-exports are essential.** Tests import from `userPreferencesService`. The service MUST re-export everything to avoid breaking test files. Verify: `grep -rn "userPreferencesService" tests/ functions/`

2. **`import type` vs `import`:** `SupportedCurrency` is a type alias. Files that use bare `import { SupportedCurrency }` (no `type` keyword) should switch to `import type`. This eliminates the runtime import of the service module.

3. **`src/types/settings.ts` already has `Currency = 'CLP' | 'USD' | 'EUR'`** identical to `SupportedCurrency`. Do NOT merge them in this story -- that is a separate deduplication task.

4. **`CURRENCY_INFO` imports:** Currently only used inside `userPreferencesService.ts` itself. Move it to `currency.ts` anyway since it belongs with currency data, but verify no consumer depends on importing it from the service path.

5. **`DEFAULT_PREFERENCES` stays in service:** It uses `DEFAULT_CURRENCY` and creates a `UserPreferences` object -- service-level concern, not moved.

## ECC Analysis Summary

- **Risk Level:** LOW (pure type/constant relocation + import path changes)
- **Complexity:** Low -- 10 consumers, 1 new file, 1 modified shared file; no runtime behavior changes
- **Sizing:** 6 tasks / 22 subtasks / 14 files (1 new + 13 modified -- within limits: max 6 tasks, max 25 subtasks, max 10 files modified)
- **Agents consulted:** Architect
- **Dependencies:** None -- trust is done, preferences hook already on repository

## Senior Developer Review (ECC)

| Field | Value |
|-------|-------|
| Date | 2026-02-28 |
| Classification | COMPLEX (by file count; actual risk LOW) |
| Agents | code-reviewer, security-reviewer, architect, tdd-guide |
| Score | 9.75/10 |
| Outcome | APPROVE |
| Quick fixes | 0 |
| TD stories | 0 |
| Findings | 1 LOW (test file import paths — safe via re-exports, cosmetic) |

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft (stub with estimated counts) |
| 2026-02-23 | Full rewrite. Trust confirmed 100% migrated (0 consumers). Preferences confirmed 10 consumers, all type/constant imports only (data-access already on repository). Story refocused from DAL hook migration to type/constant extraction from service layer. Precise file spec with exact paths and import lines. |
| 2026-02-27 | ECC re-creation validation: Added `scanHandlerTypes.ts` and `EditViewScanSection.tsx` as consumers (from 15b-2l decomposition). Consumers 10→13, files 14→16. Status: ready-for-dev. |
