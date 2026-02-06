# TD-CONSOLIDATED-3: DRY Utilities Extraction

Status: ready-for-dev

> **Tier:** 1 - Code Bloat Prevention (MUST DO)
> **Consolidated from:** TD-14d-30, TD-14d-33, TD-14d-34
> **Priority:** HIGH
> **Estimated Effort:** 3-4 hours
> **Risk:** LOW
> **Dependencies:** None

## Story

As a **developer**,
I want **duplicated utility code extracted into shared modules**,
So that **logic is DRY and changes propagate consistently**.

## Problem Statement

Three areas of code duplication identified across the shared-groups feature:
1. **Transaction merge logic** - duplicated across Dashboard, History, and Trends views
2. **ViewMode type** - defined in multiple locations instead of single source
3. **Test factory functions** - duplicated across multiple test files

## Acceptance Criteria

- [ ] Extract transaction merging logic to `src/utils/transactionMerge.ts`
- [ ] Consolidate ViewMode type to single source of truth
- [ ] Extract shared test factory to `tests/helpers/sharedGroupFactory.ts`
- [ ] All consumers updated to use shared utilities
- [ ] All tests pass

## Cross-References

- **Original stories:**
  - [TD-14d-30](TD-ARCHIVED/TD-14d-30-transaction-merge-extraction.md) - Transaction merge extraction
  - [TD-14d-33](TD-ARCHIVED/TD-14d-33-viewmode-type-consolidation.md) - ViewMode type consolidation
  - [TD-14d-34](TD-ARCHIVED/TD-14d-34-shared-test-factory.md) - Shared test factory
- **Source:** ECC Parallel Review (2026-02-04) on story 14d-v2-1-10d
