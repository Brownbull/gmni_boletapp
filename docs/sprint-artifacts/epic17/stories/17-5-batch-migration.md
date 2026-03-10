# Story 17-5: Build and Execute Category Batch Migration

## Status: review

## Intent
**Epic Handle:** "Name everything in the language the user thinks in"
**Story Handle:** "This story names everything by rewriting every stored label -- a one-time warehouse-wide relabeling"

## Story
As a user, I want my existing transaction data migrated to the new taxonomy, so that old and new data use the same labels in analytics.

## Acceptance Criteria

### Functional
- **AC-1:** Given a Cloud Function `migrateCategories` exists, when executed, then all user transactions have category fields updated to new canonical names
- **AC-2:** Given the migration function, when run twice on the same data, then the result is identical (idempotent)
- **AC-3:** Given batch operations, when processing large datasets, then Firestore batches are chunked at 500 operations
- **AC-4:** Given a read-time normalizer exists, when migration is in progress, then users see correct category names regardless of migration state
- **AC-5:** Given migration completes and is verified, when the normalizer's old-to-new mappings are no longer needed, then they can be pruned (separate cleanup task, not this story)

### Architectural
- **AC-ARCH-LOC-1:** Migration function at `functions/src/migrateCategories.ts`
- **AC-ARCH-PATTERN-1:** Same pattern as Epic 14d-v2 `periods` field migration (proven approach)
- **AC-ARCH-PATTERN-2:** Idempotent: check value before writing, skip if already new
- **AC-ARCH-PATTERN-3:** Chunked at 500 per batch (Firestore limit)
- **AC-ARCH-NO-1:** No data loss -- migration only UPDATES category fields, never deletes
- **AC-ARCH-NO-2:** No migration of `items[].category` and `items[].subcategory` is missed -- item-level categories migrate too

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Migration Cloud Function | `functions/src/migrateCategories.ts` | Cloud Functions | NEW |
| Migration mapping | `functions/src/categoryMigrationMap.ts` | Data mapping | NEW |
| Migration tests | `functions/src/__tests__/migrateCategories.test.ts` | Vitest/Jest | NEW |
| Read-time normalizer | Existing normalizer file | Normalizer | VERIFIED |

## Tasks

### Task 1: Build Migration Mapping (2 subtasks)
- [x] 1.1: Create `categoryMigrationMap.ts` with old-to-new mapping for all 4 levels (from taxonomy spec)
- [x] 1.2: Include item-level mappings (items[].category, items[].subcategory) -- not just transaction-level

### Task 2: Build Migration Cloud Function (4 subtasks)
- [x] 2.1: Create `migrateCategories.ts` -- callable Cloud Function (admin-only)
- [x] 2.2: Implement user enumeration: iterate all users under `/artifacts/{appId}/users/`
- [x] 2.3: For each user: read all transactions, check each category field, batch-update with new values
- [x] 2.4: **HARDENING:** Implement 500-op batch chunking with error handling and retry logic

### Task 3: Idempotency and Safety (3 subtasks)
- [x] 3.1: Check-before-write: skip documents where all category fields already match new values
- [x] 3.2: Logging: report per-user stats (total transactions, migrated, skipped, errors)
- [x] 3.3: **HARDENING:** Dry-run mode flag -- log what would change without writing

### Task 4: Test Migration (3 subtasks)
- [x] 4.1: Unit test: mapping completeness -- every old value produces a new value
- [x] 4.2: Unit test: idempotency -- running twice produces same result
- [x] 4.3: Integration test: migrate sample data set (10 transactions with mixed old/new categories)

### Task 5: Verify Read-Time Normalizer Coverage (2 subtasks)
- [x] 5.1: Verify normalizer handles all intermediate states: un-migrated data, partially-migrated data, fully-migrated data
- [x] 5.2: Test: user sees correct categories while migration runs in background

### Task 6: Build and Deploy (2 subtasks)
- [x] 6.1: `cd functions && npm run build` -- verify build succeeds
- [ ] 6.2: Deploy to staging, execute migration on staging data, verify results

## Sizing
- **Points:** 5 (MEDIUM)
- **Tasks:** 6
- **Subtasks:** 16
- **Files:** ~4

## Dependencies
- **17-2** (constants must be updated)
- **17-3** (prompt should be updated before migration -- new scans use new names)
- **17-4** (UI should display new names before migration runs -- normalizer handles the gap)

## Risk Flags
- DATA_PIPELINE (batch migration of all stored data)

## Dev Notes
- Pattern: Epic 14d-v2 `periods` migration is the template. Same approach: read all, check, batch-write, chunk at 500.
- CRITICAL: Item-level categories (`items[].category`, `items[].subcategory`) must also migrate -- don't forget nested arrays.
- The normalizer is the safety net: users see correct names even if migration hasn't reached their data yet.
- Execute on staging first. Verify. Then execute on production.
- After production migration is verified (separate future task), old normalizer entries can be pruned. NOT in this story.
- Consider: add a `categoryVersion` field to migrated documents to make future migrations easier. (Optional -- evaluate during implementation.)
