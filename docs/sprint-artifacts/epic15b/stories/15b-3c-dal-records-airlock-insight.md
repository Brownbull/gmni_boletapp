# Story 15b-3c: DAL: Migrate Records + Airlock + Insight Profile Hooks

**Epic:** 15b - Continued Codebase Refactoring
**Phase:** 3 - Infrastructure
**Points:** 3
**Priority:** MEDIUM
**Status:** drafted

## Overview

This story migrates the remaining direct service imports for records, airlock, and insight profile consumers to their respective DAL repositories. Actual grep findings reveal 3 consumer files to migrate (not the ~8 estimated in the stub): `usePersonalRecords.ts` (1 Firestore call to records), `useInsightProfile.ts` (5 Firestore calls to insight profile), and `InsightsView.tsx` (1 Firestore call to insight profile via re-export). The airlock service has zero direct consumers outside its repository -- it is already fully behind the DAL. Additionally, the `insightEngineService.ts` re-export of `getUserInsightProfile` should be removed once `InsightsView.tsx` is migrated, eliminating a cross-service coupling.

## Functional Acceptance Criteria

- [ ] **AC1:** `usePersonalRecords.ts` uses `useRecordsRepository` for the `storePersonalRecord` call; pure functions `detectAndFilterRecords` and `getCurrentWeekId` remain as direct service imports (they are not Firestore operations)
- [ ] **AC2:** Airlock service has zero direct consumers outside the repository -- VERIFY only, no migration needed
- [ ] **AC3:** `useInsightProfile.ts` uses `useInsightProfileRepository` for all 5 Firestore calls
- [ ] **AC4:** `InsightsView.tsx` uses `useInsightProfileRepository` instead of `getUserInsightProfile` from `insightEngineService`
- [ ] **AC5:** The `getUserInsightProfile` re-export in `insightEngineService.ts` is removed after consumers are migrated
- [ ] **AC6:** No direct `insightProfileService` imports remain in non-repository files after migration
- [ ] **AC7:** Each consumer migrated individually with tests passing between migrations
- [ ] **AC8:** `npm run test:quick` passes with 0 failures

## Architectural Acceptance Criteria (MANDATORY)

> These ACs are MANDATORY and will be validated during code review.

### File Location Requirements

- [ ] **AC-ARCH-LOC-1:** `src/repositories/recordsRepository.ts` -- verified complete, no changes needed
- [ ] **AC-ARCH-LOC-2:** `src/repositories/airlockRepository.ts` -- verified complete; zero external consumers
- [ ] **AC-ARCH-LOC-3:** `src/repositories/insightProfileRepository.ts` -- verified complete, no changes needed
- [ ] **AC-ARCH-LOC-4:** `src/hooks/usePersonalRecords.ts` imports repository hook from `@/repositories`
- [ ] **AC-ARCH-LOC-5:** `src/features/insights/hooks/useInsightProfile.ts` imports repository hook from `@/repositories`
- [ ] **AC-ARCH-LOC-6:** `src/features/insights/views/InsightsView.tsx` uses repository hook, not `getUserInsightProfile` from engine service

### Pattern Requirements

- [ ] **AC-ARCH-PATTERN-1:** Consumers obtain repository instance via `useXxxRepository()` hook, not by constructing directly
- [ ] **AC-ARCH-PATTERN-2:** Repository hook returns `null` when not authenticated; consumers guard on null before calling methods
- [ ] **AC-ARCH-PATTERN-3:** Pure computation functions (`detectAndFilterRecords`, `getCurrentWeekId`) remain as direct service imports -- repositories only wrap data access
- [ ] **AC-ARCH-PATTERN-4:** Insight profile repository delegates to TOCTOU-safe `runTransaction()` service functions (verified, not re-implemented)

### Anti-Pattern Requirements (Must NOT Happen)

- [ ] **AC-ARCH-NO-1:** Do NOT wrap pure computation functions in repositories (no `detectAndFilterRecords` in `IRecordsRepository`)
- [ ] **AC-ARCH-NO-2:** Do NOT introduce new `useAuth()` calls in files that already receive auth context via props -- check `usePersonalRecords` which receives `db, userId, appId` as props
- [ ] **AC-ARCH-NO-3:** Must NOT bypass TOCTOU-safe `runTransaction` wrappers in the insight profile repository
- [ ] **AC-ARCH-NO-4:** Must NOT remove the `insightEngineService.ts` re-export before `InsightsView.tsx` is migrated

## File Specification

### Modified Files

| File | Exact Path | Change |
|------|------------|--------|
| usePersonalRecords | `src/hooks/usePersonalRecords.ts` | Replace `storePersonalRecord` import with `useRecordsRepository`; keep pure function imports |
| useInsightProfile | `src/features/insights/hooks/useInsightProfile.ts` | Replace 5 insightProfileService imports with `useInsightProfileRepository` |
| InsightsView | `src/features/insights/views/InsightsView.tsx` | Replace `getUserInsightProfile` import with `useInsightProfileRepository` |
| insightEngineService | `src/features/insights/services/insightEngineService.ts` | Remove `getUserInsightProfile` re-export after consumers migrated |
| usePersonalRecords.test | `tests/unit/hooks/usePersonalRecords.test.ts` | Update mocks to target repository |
| useInsightProfile.test | `tests/unit/features/insights/hooks/useInsightProfile.test.ts` | Update mocks to target repository |
| InsightsView.test | `tests/unit/features/insights/views/InsightsView.test.tsx` | Update mocks to target repository |

### Verified Files (No Changes Needed)

| File | Exact Path | Status |
|------|------------|--------|
| recordsRepository | `src/repositories/recordsRepository.ts` | Complete -- wraps all service functions |
| airlockRepository | `src/repositories/airlockRepository.ts` | Complete -- zero external consumers |
| insightProfileRepository | `src/repositories/insightProfileRepository.ts` | Complete -- wraps all functions including TOCTOU-safe mutations |
| repository hooks | `src/repositories/hooks.ts` | Complete -- exports all 3 repository hooks |

## Tasks / Subtasks

### Task 1: Establish baseline and audit consumers

- [ ] 1.1 Run `npm run test:quick` and record total pass count
- [ ] 1.2 `grep -rn "from.*recordsService" src/ --include="*.ts" --include="*.tsx" | grep -v repositories/ | grep -v "services/index.ts"` -- confirm consumer list
- [ ] 1.3 `grep -rn "from.*airlockService" src/ --include="*.ts" --include="*.tsx" | grep -v repositories/` -- confirm 0 external consumers
- [ ] 1.4 `grep -rn "from.*insightProfileService" src/ --include="*.ts" --include="*.tsx" | grep -v repositories/` -- confirm consumer list
- [ ] 1.5 `grep -rn "getUserInsightProfile" src/ --include="*.ts" --include="*.tsx"` -- confirm InsightsView and insightEngineService

### Task 2: Migrate usePersonalRecords.ts

- [ ] 2.1 In `src/hooks/usePersonalRecords.ts`: add `import { useRecordsRepository } from '@/repositories'`; remove `storePersonalRecord` from recordsService import (keep pure function imports)
- [ ] 2.2 Replace `storePersonalRecord(db, userId, appId, record)` with `recordsRepo?.store(record)` where `recordsRepo = useRecordsRepository()`; preserve null guard (`if (!recordsRepo) return`)
- [ ] 2.3 Note: Keep `{db, userId, appId}` interface for minimal ripple to `App.tsx` (Option A -- see Dev Notes)
- [ ] 2.4 Update `tests/unit/hooks/usePersonalRecords.test.ts`: mock `useRecordsRepository` from `@/repositories` instead of `storePersonalRecord` from service
- [ ] 2.5 Run `npx vitest run tests/unit/hooks/usePersonalRecords.test.ts` -- all pass

### Task 3: Migrate useInsightProfile.ts

- [ ] 3.1 In `src/features/insights/hooks/useInsightProfile.ts`: add `import { useInsightProfileRepository } from '@/repositories'`; remove 5 insightProfileService imports
- [ ] 3.2 Replace service calls with repository equivalents:
  - `getOrCreateInsightProfile(services.db, user.uid, services.appId)` → `insightRepo.getOrCreate()`
  - `recordInsightShown(services.db, user.uid, services.appId, ...)` → `insightRepo.recordInsightShown(...)`
  - `trackTransactionForProfile(services.db, user.uid, services.appId, ...)` → `insightRepo.trackTransaction(...)`
  - `deleteInsight(services.db, user.uid, services.appId, ...)` → `insightRepo.deleteInsight(...)`
  - `deleteInsights(services.db, user.uid, services.appId, ...)` → `insightRepo.deleteInsights(...)`
- [ ] 3.3 Update `tests/unit/features/insights/hooks/useInsightProfile.test.ts`: mock `useInsightProfileRepository` from `@/repositories`
- [ ] 3.4 Run `npx vitest run tests/unit/features/insights/hooks/useInsightProfile.test.ts` -- all pass

### Task 4: Migrate InsightsView.tsx and clean up re-export

- [ ] 4.1 In `src/features/insights/views/InsightsView.tsx`: add `import { useInsightProfileRepository } from '@/repositories'`; remove `getUserInsightProfile` import from `insightEngineService`
- [ ] 4.2 Replace the standalone `getUserInsightProfile(services.db, user.uid, services.appId)` call (in useEffect) with `insightProfileRepo?.get()` or `insightProfileRepo?.getOrCreate()`; call `useInsightProfileRepository()` at component level
- [ ] 4.3 In `src/features/insights/services/insightEngineService.ts`: remove the `getUserInsightProfile` re-export line; verify no other consumers
- [ ] 4.4 Update `tests/unit/features/insights/views/InsightsView.test.tsx`: update mocks
- [ ] 4.5 Run `npx vitest run tests/unit/features/insights/views/InsightsView.test.tsx` -- all pass

### Task 5: Verify and run full test suite

- [ ] 5.1 `grep -rn "from.*recordsService\|from.*airlockService\|from.*insightProfileService" src/ --include="*.ts" --include="*.tsx" | grep -v repositories/ | grep -v "services/index.ts"` -- must return 0 lines
- [ ] 5.2 `grep -rn "getUserInsightProfile" src/ --include="*.ts" --include="*.tsx"` -- must return 0 lines
- [ ] 5.3 Run `npm run test:quick` -- must pass with 0 failures

## Dev Notes

### TOCTOU Safety Verification

The insight profile service has TOCTOU fixes from Epic 15 (TD-20, TD-24). Every mutation method uses `runTransaction` with `getOrCreateProfileInTransaction` inside. The repository (`insightProfileRepository.ts`) delegates directly to these service functions. TOCTOU safety is preserved -- the repository is a thin delegation layer.

### Airlock: Zero Migration Needed

The airlock service has zero direct consumers outside the repository. The airlock migration was effectively already done when the repository was created in Epic 15 Phase 6. `AirlockGenerateButton` component uses functions passed down via props, not direct service imports.

### usePersonalRecords Interface Decision

`usePersonalRecords` currently accepts `{db, userId, appId}` as props from `App.tsx`. Two options:

**Option A (Minimal Change -- RECOMMENDED):** Keep the existing interface. The hook uses `useRecordsRepository()` internally for the `store` call but still uses passed-in params for the null guard and pure functions. `App.tsx` call site does not change.

**Option B (Full DAL):** Remove `{db, userId, appId}` params entirely; use `useRecordsRepository()` null check. Simplifies `App.tsx` call site. Can be done in Phase 4 (App.tsx fan-out reduction).

Use Option A in this story.

### InsightsView Double-Load Pattern

`InsightsView.tsx` both uses `useInsightProfile()` hook (for delete operations) AND calls `getUserInsightProfile()` separately (for loading the insights list in a useEffect). After migration, both use the same repository instance to avoid redundant loads. Call `useInsightProfileRepository()` once at component level and use it for both purposes.

### Mock Update Pattern

```typescript
// Before (in tests):
vi.mock('@/services/insightProfileService', () => ({
  getOrCreateInsightProfile: vi.fn(),
  // ...
}));

// After:
vi.mock('@/repositories', () => ({
  useInsightProfileRepository: vi.fn(() => ({
    getOrCreate: vi.fn(),
    recordInsightShown: vi.fn(),
    // ...
  })),
}));
```

### Critical Pitfalls

1. **Do NOT wrap pure functions in repositories.** `detectAndFilterRecords` and `getCurrentWeekId` are computation-only functions -- wrapping them would violate the repository's responsibility boundary.

2. **useInsightProfile hook signature change.** After migration it will use `useInsightProfileRepository()` internally. Check whether callers (`App.tsx`, `InsightsView.tsx`) need to update their call sites to remove `(user, services)` params.

3. **Remove re-export AFTER migration.** Do not remove `getUserInsightProfile` from `insightEngineService.ts` until `InsightsView.tsx` no longer imports it.

4. **Mock paths in tests.** All three test files mock service functions. After migration, mocks must target `@/repositories` module. Failure to update mocks causes false test passes.

## ECC Analysis Summary

- **Risk Level:** LOW (pure import path change, repositories wrap existing services, TOCTOU safety already in repositories)
- **Complexity:** Low -- 3 consumer files + 1 re-export cleanup + 3 test files = 7 files modified total
- **Sizing:** 5 tasks / 18 subtasks / 7 files (within limits: max 6 tasks, max 25 subtasks, max 10 files)
- **Agents consulted:** Architect
- **Dependencies:** Soft dependency on 15b-3a and 15b-3b for pattern establishment; no hard blocking dependency

## Change Log

| Date | Change |
|------|--------|
| 2026-02-13 | Initial stub with estimated ~8 consumers across 3 services |
| 2026-02-23 | Full rewrite. Grep audit found 3 actual consumers (not 8). Airlock has ZERO consumers outside its repository. Added TOCTOU verification, interface decision block for usePersonalRecords, InsightsView double-load pattern note, and per-file migration instructions. |
