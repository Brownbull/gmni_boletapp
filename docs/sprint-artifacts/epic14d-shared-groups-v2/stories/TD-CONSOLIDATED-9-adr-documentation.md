# TD-CONSOLIDATED-9: ADR Documentation

Status: ready-for-dev

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

- [ ] Create ADR-021: Client-Side Filtering Architecture Decision
- [ ] Create ADR for Rate Limiting approach (client-side cooldowns)
- [ ] Both ADRs follow existing ADR template format
- [ ] Link from relevant code via comments

## Cross-References

- **Original stories:**
  - [TD-14d-32](TD-ARCHIVED/TD-14d-32-client-side-filtering-adr.md) - Client-side filtering ADR
  - [TD-14d-38](TD-ARCHIVED/TD-14d-38-rate-limiting-adr.md) - Rate limiting ADR
- **Sources:** ECC Reviews (2026-02-04)
