# Story 15b-4a: Design transaction.ts Sub-Type Schema

**Epic:** 15b - Continued Codebase Refactoring
**Points:** 2
**Priority:** HIGH
**Status:** drafted

## Description

Design the split plan for `types/transaction.ts` (109 dependents — 21% of codebase). This is an **analysis-only story** with no code changes. Read all 109 consumers, classify usage patterns, and produce a sub-type schema that minimizes blast radius for future changes.

## Acceptance Criteria

- [ ] **AC1:** All 109 consumers categorized by which transaction type fields they use
- [ ] **AC2:** Sub-type schema designed (e.g., TransactionBase, TransactionDisplay, TransactionMutation, etc.)
- [ ] **AC3:** Migration plan: which consumers move to which sub-type
- [ ] **AC4:** Design document committed to `docs/architecture/`
- [ ] **AC5:** No code changes — design only

## Tasks

- [ ] **Task 1:** List all 109 dependents of `types/transaction.ts`
  - [ ] Use depcruise or grep to find all importers
- [ ] **Task 2:** Categorize each consumer by usage pattern
  - [ ] Read-only display (renders transaction fields)
  - [ ] Mutation (creates/updates transactions)
  - [ ] Type-only (uses Transaction as a type parameter)
  - [ ] Validation (checks transaction fields)
- [ ] **Task 3:** Design sub-type schema
  - [ ] `TransactionBase` — minimal shared fields
  - [ ] `TransactionDisplay` — fields needed for rendering
  - [ ] `TransactionMutation` — fields needed for create/update
  - [ ] Full `Transaction` = intersection of all sub-types (backward compat)
- [ ] **Task 4:** Map consumers to sub-types
- [ ] **Task 5:** Write design document

## File Specification

| File | Action | Description |
|------|--------|-------------|
| `docs/architecture/transaction-type-split-design.md` | CREATE | Sub-type design document |

## Dev Notes

- This story is REQUIRED before 15b-4b (the actual split) — design informs implementation
- The goal is to reduce cascade risk: when a display field changes, only display consumers rebuild
- Consider TypeScript utility types: `Pick<Transaction, 'id' | 'amount' | ...>` for sub-types
- The full `Transaction` type should remain as a union/intersection for backward compatibility
- Look for natural clusters: fields that are always used together by consumers
