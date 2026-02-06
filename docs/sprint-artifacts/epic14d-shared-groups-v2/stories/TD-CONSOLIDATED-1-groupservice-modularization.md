# TD-CONSOLIDATED-1: groupService Modularization

Status: ready-for-dev

> **Tier:** 1 - Code Bloat Prevention (MUST DO)
> **Consolidated from:** TD-14d-4
> **Priority:** HIGH
> **Estimated Effort:** 4-6 hours
> **Risk:** MEDIUM (many exports, potential import path changes)
> **Dependencies:** None

## Story

As a **developer**,
I want **groupService.ts (~1,367 LOC) split into focused service modules**,
So that **each module has a single responsibility and the codebase is easier to maintain**.

## Problem Statement

`src/features/shared-groups/services/groupService.ts` significantly exceeds the 800-line guideline. It contains multiple responsibilities: Group CRUD, share code operations, leave/transfer, and deletion functions.

## Acceptance Criteria

- [ ] Split into: `groupService.ts` (CRUD), `groupDeletionService.ts` (deletion), `groupMemberService.ts` (leave/transfer/join)
- [ ] Each module under 400 lines
- [ ] All existing tests pass without modification
- [ ] Barrel export (`services/index.ts`) maintains backward compatibility
- [ ] No functional changes - pure refactor

## Cross-References

- **Original story:** [TD-14d-4](TD-ARCHIVED/TD-14d-4-groupservice-modularization.md)
- **Blocks:** TD-CONSOLIDATED-2 (GruposView Dialog Extraction)
- **Source:** ECC Code Review #5 (2026-02-03) on story 14d-v2-1-7e
