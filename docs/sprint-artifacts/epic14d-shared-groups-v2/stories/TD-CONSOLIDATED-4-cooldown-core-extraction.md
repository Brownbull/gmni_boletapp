# TD-CONSOLIDATED-4: Cooldown Core Extraction

Status: ready-for-dev

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

- [ ] Create `src/utils/cooldownCore.ts` with shared cooldown logic
- [ ] Refactor `sharingCooldown.ts` and `userSharingCooldown.ts` to use core
- [ ] All existing cooldown tests pass
- [ ] No behavioral changes
- [ ] Also incorporates cooldown reason type enum pattern (from archived TD-14d-36)

## Cross-References

- **Original story:** [TD-14d-48](TD-ARCHIVED/TD-14d-48-cooldown-pluralization.md) (cooldown core, not pluralization)
- **Also absorbs:** TD-14d-36 (cooldown reason type enum, archived)
- **Source:** ECC Parallel Review (2026-02-05) on story 14d-v2-1-12a
