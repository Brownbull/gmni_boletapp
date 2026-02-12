# Tech Debt Story TD-20: insightProfileService TOCTOU Transaction Safety

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-12) on story 15-TD-15
> **Priority:** LOW
> **Estimated Effort:** 2 pts

## Story

As a **developer**,
I want **all read-then-write functions in insightProfileService to use `runTransaction()`**,
So that **the codebase is fully consistent with the TOCTOU prevention pattern established in TD-1, TD-11, TD-13, and TD-15**.

## Context

`insightProfileService.ts` has 5 functions that use a non-transactional read-then-write pattern. Concurrent calls could cause one write to overwrite another's changes (lost update). Risk is LOW because these operate on per-user insight history (non-financial data), but the pattern is inconsistent with the codebase's TOCTOU policy.

## Acceptance Criteria

- [ ] **AC1:** `getOrCreateInsightProfile()` wrapped in `runTransaction()` — atomic create-if-not-exists
- [ ] **AC2:** `recordInsightShown()` wrapped in `runTransaction()` — read profile, mutate recentInsights array, write atomically
- [ ] **AC3:** `deleteInsight()` wrapped in `runTransaction()` — read profile, filter recentInsights, write atomically
- [ ] **AC4:** `deleteInsights()` wrapped in `runTransaction()` — read profile, filter multiple, write atomically
- [ ] **AC5:** `recordIntentionalResponse()` wrapped in `runTransaction()` — read profile, update response, write atomically
- [ ] **AC6:** Unit tests for all 5 wrapped functions (existence check + normal flow)
- [ ] **AC7:** All existing tests pass

## Tasks

- [ ] **Task 1:** Wrap `getOrCreateInsightProfile()` in `runTransaction()`
  - [ ] Use transaction.get() → exists check → transaction.set() or return existing
- [ ] **Task 2:** Wrap `recordInsightShown()`, `deleteInsight()`, `deleteInsights()`, `recordIntentionalResponse()` in `runTransaction()`
  - [ ] Each reads full profile via transaction.get(), mutates in-memory, writes via transaction.update()
- [ ] **Task 3:** Add unit tests for all 5 wrapped functions
  - [ ] Test normal flow with transaction mocks
  - [ ] Test doc-not-found / create-if-not-exists handling

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/features/insights/services/insightProfileService.ts` | MODIFY | Wrap 5 functions in runTransaction |
| `tests/unit/features/insights/services/insightProfileService.test.ts` | CREATE | Transaction tests for all 5 functions |

## Dev Notes

- Follow the same `runTransaction` pattern established in TD-1, TD-11, TD-13, TD-15
- Source: 15-TD-6 code review → added to 15-TD-15 Dev Notes → elevated to standalone story in 15-TD-15 code review
- LOW impact: per-user insight history, no financial data, worst case is lost/duplicate insight record
- Source story: [15-TD-15](./15-TD-15-standalone-mutation-safety.md)
- Review findings: #7
