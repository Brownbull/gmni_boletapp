# TD-CONSOLIDATED-9: ADR Documentation

Status: done

> **Tier:** 4 - Documentation (DO WHEN NEEDED)
> **Consolidated from:** TD-14d-32, TD-14d-38
> **Priority:** LOW (write when decision is questioned)
> **Estimated Effort:** 2-3 hours
> **Risk:** NONE
> **Dependencies:** None

## Story

As a **developer**,
I want **key architectural decisions documented as ADRs**,
So that **future developers understand why certain patterns were chosen**.

## Problem Statement

Two significant architecture decisions lack formal documentation:
1. **Client-side filtering** - Why we filter transactions client-side instead of server-side
2. **Rate limiting approach** - Why we use client-side cooldowns instead of server-side rate limiting

## Acceptance Criteria

- [x] Create ADR-021: Client-Side Filtering Architecture Decision
- [x] Create ADR-022: Rate Limiting approach (client-side cooldowns)
- [x] Both ADRs follow existing ADR template format
- [x] Link from relevant code via comments

## Cross-References

- **Original stories:**
  - [TD-14d-32](TD-ARCHIVED/TD-14d-32-client-side-filtering-adr.md) - Client-side filtering ADR
  - [TD-14d-38](TD-ARCHIVED/TD-14d-38-rate-limiting-adr.md) - Rate limiting ADR
- **Sources:** ECC Reviews (2026-02-04)

## Senior Developer Review (ECC)

- **Review Date:** 2026-02-08
- **Classification:** SIMPLE
- **ECC Agents:** code-reviewer, tdd-guide
- **Outcome:** APPROVED (3 quick fixes applied)
- **Fixes Applied:**
  1. Fixed broken relative path links in ADR-021 References (`../../` → `../../../`)
  2. Added "simplified for clarity" note to ADR-021 code snippet
  3. Updated `~110 LOC` to `~120 LOC` in ADR-022 (accuracy)
- **Tests:** 68 existing tests pass (no new tests needed — documentation-only story)
