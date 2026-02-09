# TD-CONSOLIDATED-4: Cooldown Core Extraction

Status: done

> **Tier:** 1 - Code Bloat Prevention (MUST DO)
> **Consolidated from:** TD-14d-48 (cooldown core)
> **Priority:** HIGH
> **Estimated Effort:** 2-3 hours
> **Risk:** LOW
> **Dependencies:** None

## Story

As a **developer**,
I want **the ~80% duplicated cooldown logic extracted to a shared `cooldownCore.ts`**,
So that **cooldown behavior is consistent and changes only need to happen in one place**.

## Problem Statement

`sharingCooldown.ts` and `userSharingCooldown.ts` share approximately 80% of their implementation. Both implement the same cooldown state machine, time calculations, and error handling with only minor variations.

## Acceptance Criteria

- [x] Create `src/utils/cooldownCore.ts` with shared cooldown logic
- [x] Refactor `sharingCooldown.ts` and `userSharingCooldown.ts` to use core
- [x] All existing cooldown tests pass (100/100 - 34 group + 43 user + 23 core)
- [x] No behavioral changes (zero test modifications, all consumers unchanged)
- [x] Also incorporates cooldown reason type enum pattern (from archived TD-14d-36)

## File List

| File | Action | Lines Before | Lines After |
|------|--------|-------------|-------------|
| `src/utils/cooldownCore.ts` | CREATE | -- | 101 |
| `src/utils/sharingCooldown.ts` | MODIFY | 142 | 101 |
| `src/utils/userSharingCooldown.ts` | MODIFY | 191 | 107 |
| `tests/unit/utils/cooldownCore.test.ts` | CREATE | -- | 234 |

## Dev Notes

- **Implementation Date:** 2026-02-08
- **Approach:** Extract shared cooldown state machine to `cooldownCore.ts`, keep timezone-specific daily reset in wrappers
- **CooldownReason:** Uses `as const` object pattern (not TS enum) for string-literal backward compatibility
- **Key abstraction:** `checkCooldownAllowed()` accepts `shouldReset` callback to abstract timezone strategy
- **LOC reduction:** 333 lines (original) -> 208 lines (refactored) + 101 lines core = net ~25 fewer lines with better separation
- **Consumer impact:** Zero — all re-exports preserve existing import paths
- **Tests:** 100/100 pass (34 group + 43 user + 23 core), zero existing test modifications
- **Review fixes:** Input validation guards, `createMockTimestamp` extracted to `tests/helpers/`, `@deprecated` on re-exports

## Cross-References

- **Original story:** [TD-14d-48](TD-ARCHIVED/TD-14d-48-cooldown-pluralization.md) (cooldown core, not pluralization)
- **Also absorbs:** TD-14d-36 (cooldown reason type enum, archived)
- **Source:** ECC Parallel Review (2026-02-05) on story 14d-v2-1-12a
- **ECC Review 14d-v2-1-13+14 (2026-02-07):** Duplicate join logic between `acceptByLink` and `acceptByCode` in invitationHandlers.ts — both call `checkAndRefreshInvitation`, `joinGroupFromInvitation`, then handle opt-in. Extract shared `processAcceptInvitation` handler

## Senior Developer Review (ECC)

- **Review Date:** 2026-02-08
- **Classification:** SIMPLE
- **ECC Agents:** code-reviewer, tdd-guide
- **Outcome:** APPROVE (9/10)
- **TEA Score:** 96/100 (GOOD)
- **Quick fixes applied (4):**
  1. Input validation on `cooldownMinutes`/`dailyLimit` (negative/zero guard)
  2. `createMockTimestamp` extracted to `tests/helpers/createMockTimestamp.ts`
  3. Edge case tests added for zero/negative `cooldownMinutes` and `dailyLimit`
  4. `@deprecated` JSDoc added to backwards-compatible re-exports
- **Noted for future (not blocking, no TD stories):**
  - `CooldownResult` could become a discriminated union for stronger type safety
  - `shouldReset` callback could be skipped when `toggleCountToday=0` (micro-optimization)
