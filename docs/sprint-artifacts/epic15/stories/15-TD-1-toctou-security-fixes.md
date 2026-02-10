# Story 15-TD-1: TOCTOU Security Fixes

**Epic:** 15 - Codebase Refactoring
**Points:** 3
**Priority:** HIGH
**Status:** done

## Description

Wrap read-then-write Firestore patterns in `runTransaction()` to eliminate Time-of-Check-to-Time-of-Use (TOCTOU) race conditions. These are pre-existing patterns identified during Epic 15 code review that violate the project's security rules (`.claude/rules/security.md`).

## Background

The project's security rules require that authorization check and mutation happen in the same Firestore transaction. Three service files perform `getDoc()` then conditional `updateDoc()`/`setDoc()` as separate operations, creating a window for concurrent writes to cause data corruption.

## Source Tech Debt Items

- **TD-6:** TOCTOU race in credits deduction (`creditsService.ts`) — pre-existing, needs transaction-based fix
- **TD-17:** TOCTOU in `mappingServiceBase.saveMapping` — wrap upsert in `runTransaction()`
- **TD-18:** TOCTOU in `merchantTrustService.recordScan` — wrap read-then-write in `runTransaction()`

## Acceptance Criteria

- [x] **AC1:** `mappingServiceBase.saveMapping()` uses `runTransaction()` to atomically check-then-upsert
- [x] **AC2:** `merchantTrustService.recordScan()` uses `runTransaction()` to atomically read-check-write
- [x] **AC3:** `userCreditsService.deductAndSaveCredits()` + `deductAndSaveSuperCredits()` use `runTransaction()` for atomic credit deduction
- [x] **AC4:** All 6,345 existing unit tests pass after transaction wrapping
- [x] **AC5:** New test files created with `mockTransaction.get/set/update` pattern (no prior Firestore mock tests existed for these functions)

## Tasks

- [x] **Task 1:** Wrap `mappingServiceBase.saveMapping()` in `runTransaction()`
  - [x] Query outside transaction (client SDK limitation), write inside transaction
  - [x] Created `mappingServiceBase.saveMapping.test.ts` (5 tests)
- [x] **Task 2:** Wrap `merchantTrustService.recordScan()` in `runTransaction()`
  - [x] Full read-compute-write inside transaction (uses doc ref, not query)
  - [x] Created `merchantTrustService.recordScan.test.ts` (5 tests)
- [x] **Task 3:** Wrap `userCreditsService.deductAndSaveCredits()` in `runTransaction()`
  - [x] Reads fresh balance inside transaction (ignores stale `currentCredits` param)
  - [x] Same for `deductAndSaveSuperCredits()`
  - [x] Created `userCreditsService.deduct.test.ts` (8 tests)

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/services/mappingServiceBase.ts` | MODIFY | Wrap saveMapping in runTransaction |
| `src/services/merchantTrustService.ts` | MODIFY | Wrap recordScan in runTransaction |
| `src/services/userCreditsService.ts` | MODIFY | Wrap deduct functions in runTransaction |
| `tests/unit/services/mappingServiceBase.saveMapping.test.ts` | CREATE | 5 transaction tests |
| `tests/unit/services/merchantTrustService.recordScan.test.ts` | CREATE | 5 transaction tests |
| `tests/unit/services/userCreditsService.deduct.test.ts` | CREATE | 8 transaction tests |

## Dev Notes

- Import `runTransaction` from `firebase/firestore` in each file
- The `saveMapping` upsert pattern: query → check exists → update or create. Inside a transaction, use `transaction.get()` then `transaction.set()` with merge
- `recordScan` reads trust record then updates counts — straightforward transaction wrap
- `deductCredit` must verify sufficient credits inside the transaction to prevent race-condition overdrafts
- Pattern reference: `.claude/rules/security.md` TOCTOU Prevention section
