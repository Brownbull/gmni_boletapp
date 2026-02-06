# Tech Debt Story TD-14d-38: Document Client-Side Rate Limiting Trade-off in ADR

Status: ready-for-dev

> **Source:** ECC Code Review (2026-02-04) on story 14d-v2-1-11b
> **Priority:** LOW (documentation only)
> **Estimated Effort:** XS (< 1 hour)
> **Risk:** LOW (no code changes)

## Story

As a **developer**,
I want **an ADR documenting the client-side rate limiting design decision for transaction sharing toggle**,
So that **future developers understand the security trade-offs and can make informed decisions**.

## Problem Statement

The `updateTransactionSharingEnabled()` function enforces cooldown (15 min) and daily limit (3×/day) in client-side JavaScript. A sophisticated owner could theoretically bypass these limits using Firebase REST API directly.

This is an intentional design trade-off (owner can only affect their own group), but it's not documented.

## Acceptance Criteria

- [ ] AC1: ADR created at `docs/architecture/adr/ADR-XXX-client-side-rate-limiting.md`
- [ ] AC2: ADR documents the decision to use client-side rate limiting
- [ ] AC3: ADR explains the security trade-off (bypass possible but acceptable)
- [ ] AC4: ADR lists alternatives considered (server-side Firestore rules)
- [ ] AC5: ADR references story 14d-v2-1-11b and ECC review

## Tasks / Subtasks

- [ ] 1.1 Determine next ADR number from existing ADRs
- [ ] 1.2 Create ADR following project template
- [ ] 1.3 Document context, decision, and consequences

## Dev Notes

### Template Reference

Use existing ADR format from `docs/architecture/adr/` directory.

### Key Points to Document

1. **Context:** Rate limiting for transaction sharing toggle
2. **Decision:** Client-side enforcement via `canToggleTransactionSharing()`
3. **Alternatives:** Server-side Firestore rules validation
4. **Consequences:**
   - Pro: Simple implementation
   - Con: Owner can bypass (acceptable risk)

### References

- [14d-v2-1-11b](./14d-v2-1-11b-service-layer-security.md) - Source story
- Security review findings from ECC parallel review
