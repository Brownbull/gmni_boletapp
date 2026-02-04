# Story 14d-v2.1.3a: Changelog TypeScript Types

Status: done

> **Split from:** 14d-v2-1-3 (Changelog Infrastructure) - Task 1
> **Split reason:** Original story exceeded sizing guidelines (5 tasks, 27 subtasks)

## Story

As a **developer**,
I want **TypeScript type definitions for changelog entries**,
So that **changelog data structures are type-safe and documented**.

## Acceptance Criteria

### Core Requirements (from Original Story AC #3, #5, #6, #7, #8)

1. **Given** TypeScript is used in the codebase
   **When** this story is completed
   **Then** TypeScript types are defined for:
   - `ChangelogEntry` interface (full document structure)
   - `ChangelogEntryType` enum/union type
   - `ChangelogSummary` interface
   - Export from appropriate type file

2. **Given** the changelog entry structure (AD-3: Full transaction data embedded)
   **When** a changelog entry is created
   **Then** the `data` field contains the FULL transaction object
   **And** this enables single-read sync (no additional query for transaction details)

3. **Given** Firestore TTL policy requirement (AD-9: 30-day TTL)
   **When** a changelog entry is created
   **Then** it includes a `ttl` field set to `timestamp + 30 days`
   **And** this field is named `_ttl` to follow Firestore TTL naming convention

4. **Given** the changelog types are imported in other files
   **When** the types are defined
   **Then** they are exported from `src/types/index.ts` barrel file
   **And** JSDoc comments document the purpose of each field

5. **Given** a changelog entry is created without a transaction (edge case)
   **When** validation occurs
   **Then** the `transactionId` and `actorId` fields are required (non-nullable)
   **And** the `data` field can be `null` ONLY for `TRANSACTION_REMOVED` type

## Tasks / Subtasks

- [x] **Task 1: Define TypeScript Types** (AC: #1, #2, #3, #4, #5)
  - [x] 1.1: Create `src/types/changelog.ts` file
  - [x] 1.2: Define `ChangelogEntryType` union type: `'TRANSACTION_ADDED' | 'TRANSACTION_MODIFIED' | 'TRANSACTION_REMOVED'`
  - [x] 1.3: Define `ChangelogSummary` interface with `amount`, `description`, `category` summary fields
  - [x] 1.4: Define `ChangelogEntry` interface with all fields:
    - `id: string` (document ID)
    - `type: ChangelogEntryType`
    - `transactionId: string` (required)
    - `timestamp: Timestamp`
    - `actorId: string` (required - user who made the change)
    - `data: Transaction | null` (full transaction, null only for REMOVED)
    - `summary: ChangelogSummary` (for notifications)
    - `_ttl: Timestamp` (Firestore TTL field - 30 days after timestamp)
    - `groupId: string` (denormalized for queries)
  - [x] 1.5: Add comprehensive JSDoc comments for each field
  - [x] 1.6: Export types from `src/types/index.ts`

## Dev Notes

### Architecture Decisions (from Epic 14d-v2)

| Decision | Value | Rationale |
|----------|-------|-----------|
| **AD-3** | Full transaction data in changelog | 50% cost reduction - single read per change |
| **AD-9** | 30-day TTL on changelog entries | Auto-cleanup, cost control |

### Changelog Entry Schema

```typescript
export type ChangelogEntryType =
  | 'TRANSACTION_ADDED'
  | 'TRANSACTION_MODIFIED'
  | 'TRANSACTION_REMOVED';

export interface ChangelogSummary {
  /** Transaction amount for notification display */
  amount: number;
  /** Currency code (CLP, USD, etc.) */
  currency: string;
  /** Short description for notification */
  description: string;
  /** Store category for context */
  category: string | null;
}

export interface ChangelogEntry {
  /** Firestore document ID */
  id: string;
  /** Type of change */
  type: ChangelogEntryType;
  /** ID of affected transaction */
  transactionId: string;
  /** When the change occurred */
  timestamp: Timestamp;
  /** User ID who made the change */
  actorId: string;
  /** Group ID (denormalized) */
  groupId: string;
  /** Full transaction data (null only for REMOVED) */
  data: Transaction | null;
  /** Summary for notifications */
  summary: ChangelogSummary;
  /** TTL field for Firestore auto-delete (timestamp + 30 days) */
  _ttl: Timestamp;
}
```

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `src/types/changelog.ts` | **CREATE** | TypeScript type definitions |
| `src/types/index.ts` | MODIFY | Add changelog exports |

### Project Structure Notes

- Types follow existing pattern: `src/types/{feature}.ts`
- Existing type patterns: `src/types/transaction.ts`

### Dependencies

- **Blocks:** Story 14d-v2-1-3c (Service + Tests need types)
- **Blocked by:** None (foundation story)
- **Parallel with:** Story 14d-v2-1-3b (Security Rules)

### References

- [Epic 14d-v2 Requirements: docs/sprint-artifacts/epic14d-shared-groups-v2/epics.md#story-1.3]
- [Architecture Decisions: AD-3, AD-9 in epics.md]
- [Type Patterns: src/types/transaction.ts]
- [Original Story: docs/sprint-artifacts/epic14d-shared-groups-v2/stories/14d-v2-1-3-changelog-infrastructure.md]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (atlas-dev-story workflow)

### Debug Log References

None - implementation straightforward

### Completion Notes List

- ✅ Created `src/types/changelog.ts` with comprehensive type definitions
- ✅ Implemented `ChangelogEntryType` union: `TRANSACTION_ADDED | TRANSACTION_MODIFIED | TRANSACTION_REMOVED`
- ✅ Implemented `ChangelogSummary` interface with `amount`, `currency`, `description`, `category` fields
- ✅ Implemented `ChangelogEntry` interface with all required fields per AD-3 and AD-9
- ✅ Added `CreateChangelogEntryInput` type for Cloud Function use
- ✅ Added constants: `CHANGELOG_TTL_MS` (30 days in ms), `CHANGELOG_TTL_DAYS` (30)
- ✅ Added utility functions: `createChangelogSummary`, `isChangelogRemoval`, `hasChangelogData`
- ✅ Created `src/types/index.ts` barrel file exporting changelog types
- ✅ Added comprehensive JSDoc comments for all fields and functions
- ✅ Created 25 unit tests covering all types, constants, and utility functions
- ✅ All 6269 tests pass (no regressions)

### File List

| File | Action | Lines |
|------|--------|-------|
| `src/types/changelog.ts` | **CREATED** | 212 |
| `src/types/index.ts` | **CREATED** | 76 |
| `tests/unit/types/changelog.test.ts` | **CREATED** | 456 |

### Change Log

| Date | Change |
|------|--------|
| 2026-02-01 | Story implementation complete - ready for review |
