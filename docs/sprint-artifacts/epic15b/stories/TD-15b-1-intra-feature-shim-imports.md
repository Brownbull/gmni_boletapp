# Tech Debt Story TD-15b-1: Intra-Feature Shim Import Cleanup

Status: done

> **Source:** ECC Code Review (2026-02-15) on story 15b-1f
> **Priority:** LOW
> **Estimated Effort:** 1 pt

## Story

As a **developer**,
I want **moved source files within features/batch-review/ to import hooks directly instead of through backward-compat shims at old locations**,
So that **intra-feature imports don't break when shims are eventually removed, and the dependency graph accurately reflects feature boundaries**.

## Context

Story 15b-1f consolidated batch-review source files into `features/batch-review/`. The moved source files (views and components) still import hooks through shim re-exports at `@/hooks/useBatch*` instead of the canonical `@features/batch-review/hooks/` or relative `../hooks/` paths. This was documented as intentional ("temporary — resolves to shim") during 15b-1f, but creates fragile coupling.

Since `vi.mock()` must target the same module path the source code uses, the test mocks must also be updated in lockstep with source imports. This is why the two changes are coupled.

**Note:** Other Phase 1 consolidation stories (1a-1e, 1g-1j) may have the same pattern. This story covers batch-review only; audit other features during 15b-1l barrel validation.

## Acceptance Criteria

- [x] **AC1:** All source files under `src/features/batch-review/` use direct imports (`../hooks/useBatchCapture`) or canonical feature paths (`@features/batch-review/hooks/useBatchCapture`) — zero references to `@/hooks/useBatch*` shim paths
- [x] **AC2:** All test files under `tests/unit/features/batch-review/` mock and import from canonical paths matching updated source imports
- [x] **AC3:** `npm run test:quick` passes with 0 failures (281 files, 6884 tests)
- [x] **AC4:** Grep verification: `grep -r '@/hooks/useBatch' src/features/batch-review/` returns 0
- [x] **AC5:** Grep verification: `grep -r '@/hooks/useBatch' tests/unit/features/batch-review/` returns 0

## Tasks / Subtasks

### Task 1: Update source file imports (5 files)

- [x] 1.1 `src/features/batch-review/components/BatchCaptureUI.tsx` — `@/hooks/useBatchCapture` → `../hooks/useBatchCapture`
- [x] 1.2 `src/features/batch-review/components/BatchProcessingView.tsx` — `@/hooks/useBatchProcessing` → `../hooks/useBatchProcessing`
- [x] 1.3 `src/features/batch-review/components/BatchThumbnailStrip.tsx` — `@/hooks/useBatchCapture` (type import) → `../hooks/useBatchCapture`
- [x] 1.4 `src/features/batch-review/views/BatchCaptureView.tsx` — `@/hooks/useBatchCapture` → `../hooks/useBatchCapture`
- [x] 1.5 `src/features/batch-review/views/BatchReviewView.tsx` — `@/hooks/useBatchReview` → `../hooks/useBatchReview`
- [x] 1.6 `src/features/batch-review/hooks/useBatchReviewHandlers.ts` — `@/hooks/useBatchReview` → `./useBatchReview` (discovered during implementation)

### Task 2: Update test mock/import paths (4 files, 8 references)

- [x] 2.1 `tests/unit/features/batch-review/components/BatchCaptureUI.test.tsx` — vi.mock + 2 imports
- [x] 2.2 `tests/unit/features/batch-review/components/BatchProcessingView.test.tsx` — vi.mock + import
- [x] 2.3 `tests/unit/features/batch-review/components/BatchThumbnailStrip.test.tsx` — type import
- [x] 2.4 `tests/unit/features/batch-review/views/BatchReviewView.test.tsx` — vi.mock + import

### Task 3: Verification

- [x] 3.1 Run `npx vitest run tests/unit/features/batch-review/` — all 538 tests pass
- [x] 3.2 Run grep verifications (AC4, AC5) — 0 matches both
- [x] 3.3 Run `npm run test:quick` — 281 files, 6884 tests, 0 failures (includes typecheck)

## Dev Notes

- Source story: [15b-1f](./15b-1f-consolidate-batch-review.md)
- Review findings: #1 (MEDIUM — test mocks use shim paths), #2 (LOW — source uses shim indirection)
- Files affected: 6 source + 4 test = 10 files (1 extra: `useBatchReviewHandlers.ts` not in original story)
- Key insight: `vi.mock()` targets must match the exact import path used by source code — cannot update test mocks independently
- Check other Phase 1 features for same pattern during 15b-1l barrel validation
- Dev date: 2026-02-15

## Senior Developer Review (ECC)

- **Review date:** 2026-02-15
- **Classification:** STANDARD (10 files)
- **ECC agents:** code-reviewer (sonnet), security-reviewer (sonnet)
- **Outcome:** APPROVE 10/10 — zero findings at any severity
- **Code quality:** 10/10 — clean import-path refactoring, all 5 ACs verified
- **Security:** 10/10 — pure import cleanup, no security implications
- **Action items:** 0 quick fixes, 0 TD stories created
- **Session cost:** $7.89 (72% below ecc-code-review avg)
