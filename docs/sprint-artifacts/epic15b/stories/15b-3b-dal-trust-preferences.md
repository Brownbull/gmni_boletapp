# Story 15b-3b: DAL: Migrate Trust + Preferences Hooks to Repositories

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 3 - Infrastructure
**Points:** 2
**Priority:** MEDIUM
**Status:** drafted

## Overview

Trust migration is already complete -- zero consumers import directly from `merchantTrustService` outside the repository. Preferences migration of the main data-access hook (`useUserPreferences.ts`) is also complete (uses `usePreferencesRepository()`). However, 10 non-repository files still import **types and constants** from `userPreferencesService.ts`, creating a DAL layer violation where UI components reach into the service layer for shared types (`SupportedCurrency`, `UserPreferences`, `ForeignLocationDisplayFormat`, `SupportedFontFamily`) and runtime constants (`SUPPORTED_CURRENCIES`, `CURRENCY_INFO`). This story extracts those types and constants to proper shared locations and redirects all 10 consumer imports.

## Functional Acceptance Criteria

- [ ] **AC1:** Trust service -- confirmed zero non-repository consumers (no work needed)
- [ ] **AC2:** All `userPreferencesService` type imports redirected to `src/types/preferences.ts` (10 files)
- [ ] **AC3:** All `userPreferencesService` constant imports (`SUPPORTED_CURRENCIES`, `CURRENCY_INFO`) redirected to a shared module (2 files)
- [ ] **AC4:** No direct `userPreferencesService` imports in non-repository files after migration
- [ ] **AC5:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** New types file at `src/types/preferences.ts` containing `SupportedCurrency`, `SupportedFontFamily`, `ForeignLocationDisplayFormat`, `UserPreferences`
- [ ] **AC-ARCH-LOC-2:** `SUPPORTED_CURRENCIES` and `CURRENCY_INFO` constants moved to `src/utils/currency.ts` (existing file, natural home for currency data)
- [ ] **AC-ARCH-LOC-3:** `src/services/userPreferencesService.ts` re-imports types from `src/types/preferences.ts` and constants from `src/utils/currency.ts` (service becomes consumer, not source)
- [ ] **AC-ARCH-LOC-4:** `src/repositories/preferencesRepository.ts` imports types from `src/types/preferences.ts`

### Pattern Requirements

- [ ] **AC-ARCH-PATTERN-1:** Consumer imports use `@/types/preferences` for types and `@/utils/currency` for constants
- [ ] **AC-ARCH-PATTERN-2:** All bare `import { SupportedCurrency }` statements converted to `import type { SupportedCurrency }` where only types are imported (at minimum `App.tsx` and `EditView.tsx`)
- [ ] **AC-ARCH-PATTERN-3:** `src/types/settings.ts` existing `Currency` type alias retained for backward compat -- do NOT merge with `SupportedCurrency` in this story
- [ ] **AC-ARCH-PATTERN-4:** `userPreferencesService.ts` re-exports all types and constants it previously defined, for backward compat with tests and functions

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** No new business logic added during extraction -- pure type/constant relocation
- [ ] **AC-ARCH-NO-2:** No changes to `userPreferencesService.ts` runtime behavior -- only import sources change
- [ ] **AC-ARCH-NO-3:** No function signature changes in any consumer
- [ ] **AC-ARCH-NO-4:** No consolidation of `Currency` (settings.ts) and `SupportedCurrency` (preferences.ts) in this story -- that is a separate cleanup

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

- [ ] 1.1 Run `npm run test:quick` and record total pass count
- [ ] 1.2 `grep -rn "from.*merchantTrustService" src/ --include="*.ts" --include="*.tsx" | grep -v repositories/` -- confirm 0 lines (trust fully migrated)
- [ ] 1.3 `grep -rn "from.*userPreferencesService" src/ --include="*.ts" --include="*.tsx" | grep -v repositories/ | grep -v "services/userPreferencesService"` -- confirm 10 consumer files

### Task 2: Create src/types/preferences.ts and relocate constants

- [ ] 2.1 Create `src/types/preferences.ts` with types extracted from `userPreferencesService.ts`: `SupportedCurrency`, `SupportedFontFamily`, `ForeignLocationDisplayFormat`, `UserPreferences`
- [ ] 2.2 Move `SUPPORTED_CURRENCIES` array and `CURRENCY_INFO` record to `src/utils/currency.ts` (import `SupportedCurrency` from `@/types/preferences`)
- [ ] 2.3 Update `src/services/userPreferencesService.ts` to import types from `@/types/preferences` and constants from `@/utils/currency`, re-exporting both for backward compat
- [ ] 2.4 Update `src/repositories/preferencesRepository.ts` to import `UserPreferences` from `@/types/preferences`
- [ ] 2.5 Run `npx tsc --noEmit` -- must compile clean

### Task 3: Migrate type-only consumers (6 files)

- [ ] 3.1 `src/components/transactions/TransactionCard.tsx` -- change `import type { ForeignLocationDisplayFormat }` source to `@/types/preferences`
- [ ] 3.2 `src/features/settings/views/SettingsView/useSettingsViewData.ts` -- change `import type { SupportedCurrency, ForeignLocationDisplayFormat }` source to `@/types/preferences`
- [ ] 3.3 `src/hooks/app/useTransactionHandlers.ts` -- change `import type { UserPreferences }` source to `@/types/preferences`
- [ ] 3.4 `src/features/scan/hooks/useScanHandlers.ts` -- change `import type { UserPreferences }` source to `@/types/preferences`
- [ ] 3.5 `src/features/scan/hooks/useScanInitiation.ts` -- change `import type { SupportedCurrency }` source to `@/types/preferences`
- [ ] 3.6 `src/features/scan/ScanFeature.tsx` -- change `import type { SupportedCurrency }` source to `@/types/preferences`
- [ ] 3.7 Run `npx tsc --noEmit` -- must compile clean

### Task 4: Migrate runtime + type consumers (4 files)

- [ ] 4.1 `src/features/settings/components/subviews/EscaneoView.tsx` -- split: types from `@/types/preferences`, `SUPPORTED_CURRENCIES` from `@/utils/currency`
- [ ] 4.2 `src/features/transaction-editor/components/AdvancedScanOptions.tsx` -- split: type from `@/types/preferences`, `SUPPORTED_CURRENCIES` from `@/utils/currency`
- [ ] 4.3 `src/App.tsx` -- change `import { SupportedCurrency }` to `import type { SupportedCurrency } from '@/types/preferences'`
- [ ] 4.4 `src/features/transaction-editor/views/EditView.tsx` -- change `import { SupportedCurrency }` to `import type { SupportedCurrency } from '@/types/preferences'`
- [ ] 4.5 Run `npx tsc --noEmit` -- must compile clean

### Task 5: Migrate useUserPreferences hook

- [ ] 5.1 `src/hooks/useUserPreferences.ts` -- change type imports to `from '@/types/preferences'`
- [ ] 5.2 Run `npx tsc --noEmit` -- must compile clean

### Task 6: Final verification

- [ ] 6.1 `grep -rn "from.*userPreferencesService" src/ --include="*.ts" --include="*.tsx" | grep -v repositories/ | grep -v "services/userPreferencesService"` -- must return 0 lines
- [ ] 6.2 Verify tests still import correctly: `grep -rn "userPreferencesService" tests/` -- backward compat re-exports ensure these still work
- [ ] 6.3 Run `npm run test:quick` -- all pass, same count as baseline

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

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial draft (stub with estimated counts) |
| 2026-02-23 | Full rewrite. Trust confirmed 100% migrated (0 consumers). Preferences confirmed 10 consumers, all type/constant imports only (data-access already on repository). Story refocused from DAL hook migration to type/constant extraction from service layer. Precise file spec with exact paths and import lines. |
