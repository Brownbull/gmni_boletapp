# Story 15-TD-1: TOCTOU Security Fixes

**Epic:** 15 - Codebase Refactoring
**Points:** 3
**Priority:** HIGH
**Status:** ready-for-dev

## Description

Wrap read-then-write Firestore patterns in `runTransaction()` to eliminate Time-of-Check-to-Time-of-Use (TOCTOU) race conditions. These are pre-existing patterns identified during Epic 15 code review that violate the project's security rules (`.claude/rules/security.md`).

## Background

The project's security rules require that authorization check and mutation happen in the same Firestore transaction. Three service files perform `getDoc()` then conditional `updateDoc()`/`setDoc()` as separate operations, creating a window for concurrent writes to cause data corruption.

## Source Tech Debt Items

- **TD-6:** TOCTOU race in credits deduction (`creditsService.ts`) — pre-existing, needs transaction-based fix
- **TD-17:** TOCTOU in `mappingServiceBase.saveMapping` — wrap upsert in `runTransaction()`
- **TD-18:** TOCTOU in `merchantTrustService.recordScan` — wrap read-then-write in `runTransaction()`

## Acceptance Criteria

- [ ] **AC1:** `mappingServiceBase.saveMapping()` uses `runTransaction()` to atomically check-then-upsert
- [ ] **AC2:** `merchantTrustService.recordScan()` uses `runTransaction()` to atomically read-check-write
- [ ] **AC3:** `userCreditsService.deductCredit()` uses `runTransaction()` for atomic credit deduction
- [ ] **AC4:** All existing unit tests pass after transaction wrapping
- [ ] **AC5:** Test mocks updated from `mockGetDoc + mockUpdateDoc` to `mockTransactionGet + mockTransactionUpdate`

## Tasks

- [ ] **Task 1:** Wrap `mappingServiceBase.saveMapping()` in `runTransaction()`
  - [ ] Replace `getDocs()` → conditional `updateDoc()`/`addDoc()` with transaction
  - [ ] Update `mappingServiceBase.test.ts` mocks (if test exists, otherwise note for TD-15)
- [ ] **Task 2:** Wrap `merchantTrustService.recordScan()` in `runTransaction()`
  - [ ] Replace `getDoc()` → conditional `updateDoc()`/`setDoc()` with transaction
  - [ ] Update `merchantTrustService.test.ts` mocks
- [ ] **Task 3:** Wrap `userCreditsService.deductCredit()` in `runTransaction()`
  - [ ] Replace read-then-decrement with atomic transaction
  - [ ] Update existing credit service tests

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `src/services/mappingServiceBase.ts` | MODIFY | Wrap saveMapping in runTransaction |
| `src/services/merchantTrustService.ts` | MODIFY | Wrap recordScan in runTransaction |
| `src/services/userCreditsService.ts` | MODIFY | Wrap deductCredit in runTransaction |
| `tests/unit/services/merchantTrustService.test.ts` | MODIFY | Update mocks for transactions |

## Dev Notes

- Import `runTransaction` from `firebase/firestore` in each file
- The `saveMapping` upsert pattern: query → check exists → update or create. Inside a transaction, use `transaction.get()` then `transaction.set()` with merge
- `recordScan` reads trust record then updates counts — straightforward transaction wrap
- `deductCredit` must verify sufficient credits inside the transaction to prevent race-condition overdrafts
- Pattern reference: `.claude/rules/security.md` TOCTOU Prevention section
