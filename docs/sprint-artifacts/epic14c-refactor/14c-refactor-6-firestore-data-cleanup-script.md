# Story 14c-refactor.6: Firestore Data Cleanup Script

Status: done

## Story

As a **developer**,
I want **a manual script to clean up Firestore shared group data**,
so that **we start Epic 14d with a clean database state and no orphaned data**.

## Acceptance Criteria

1. **AC1: Script Location**
   - Script located at `scripts/cleanup-shared-groups.ts`
   - Follows existing script patterns (ESM, firebase-admin, serviceAccountKey.json)

2. **AC2: Delete Shared Groups Collection**
   - Deletes all documents in `/sharedGroups` collection (top-level)
   - Logs count of deleted documents

3. **AC3: Delete Pending Invitations Collection**
   - Deletes all documents in `/pendingInvitations` collection (top-level)
   - Logs count of deleted documents

4. **AC4: Clear Transaction sharedGroupIds**
   - For all user transactions: sets `sharedGroupIds` to empty array `[]`
   - Does NOT delete the field (preserves schema for future Epic 14d)
   - Logs count of affected transactions

5. **AC5: Dry-Run Mode**
   - `--dry-run` flag previews changes without executing
   - Shows exactly what would be deleted/updated

6. **AC6: Confirmation Prompt**
   - Requires user confirmation before destructive operations
   - Shows summary of what will be affected
   - Can be bypassed with `--force` flag for CI/automation

7. **AC7: Batch Operations**
   - Uses Firestore batch operations (max 500 per batch)
   - Handles large datasets efficiently

## Tasks / Subtasks

- [x] Task 1: Create script file structure (AC: #1)
  - [x] 1.1 Create `scripts/cleanup-shared-groups.ts` with ESM boilerplate
  - [x] 1.2 Add Firebase Admin initialization (reuse pattern from existing scripts)
  - [x] 1.3 Add command-line argument parsing (--dry-run, --force, --help)

- [x] Task 2: Implement collection deletion (AC: #2, #3, #7)
  - [x] 2.1 Create `deleteCollection()` helper function with batch support
  - [x] 2.2 Implement `/sharedGroups` collection deletion
  - [x] 2.3 Implement `/pendingInvitations` collection deletion
  - [x] 2.4 Add progress logging for large collections

- [x] Task 3: Implement transaction field cleanup (AC: #4, #7)
  - [x] 3.1 Query all users from `artifacts/{appId}/users/`
  - [x] 3.2 For each user, query transactions with non-empty `sharedGroupIds`
  - [x] 3.3 Batch update `sharedGroupIds: []` for affected transactions
  - [x] 3.4 Log per-user and total counts

- [x] Task 4: Implement dry-run mode (AC: #5)
  - [x] 4.1 Add `--dry-run` flag parsing
  - [x] 4.2 Wrap all write operations in dry-run check
  - [x] 4.3 Output "[DRY RUN]" prefix for simulated operations

- [x] Task 5: Implement confirmation prompt (AC: #6)
  - [x] 5.1 Add summary output before operations
  - [x] 5.2 Implement readline-based Y/N prompt
  - [x] 5.3 Add `--force` flag to skip confirmation
  - [x] 5.4 Exit gracefully if user declines

- [x] Task 6: Documentation and testing (AC: all)
  - [x] 6.1 Add usage instructions to script header comment
  - [x] 6.2 Test with `--dry-run` on production data
  - [x] 6.3 Update `scripts/README.md` with new script documentation

## Dev Notes

### Existing Script Patterns
Reference `scripts/add-sharedGroupIds-field.ts` for:
- Firebase Admin initialization with serviceAccountKey.json
- ESM compatibility (createRequire for JSON import)
- Batch operations with 500 document limit
- Command-line argument parsing pattern
- Progress logging format

### Firestore Structure
```
/sharedGroups/{groupId}           # Top-level collection to delete
/pendingInvitations/{invitationId} # Top-level collection to delete
/artifacts/boletapp-d609f/users/{userId}/transactions/{transactionId}
  └── sharedGroupIds: string[]     # Field to clear (set to [])
```

### Important Constraints
- **Do NOT delete the `sharedGroupIds` field** - only clear to `[]`
- Field must remain for Epic 14d schema compatibility
- Use `listDocuments()` to find users (some only have subcollections)

### Command Examples
```bash
# Preview changes (safe)
npx ts-node scripts/cleanup-shared-groups.ts --dry-run

# Execute with confirmation prompt
npx ts-node scripts/cleanup-shared-groups.ts

# Execute without confirmation (for automation)
npx ts-node scripts/cleanup-shared-groups.ts --force

# Show help
npx ts-node scripts/cleanup-shared-groups.ts --help
```

### References
- [Source: scripts/add-sharedGroupIds-field.ts] - Batch update pattern
- [Source: scripts/debug-collections.ts] - Collection exploration pattern
- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md#Story 14c.6] - AC definitions

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

None - implementation was straightforward, no issues encountered.

### Completion Notes List

1. Created `scripts/cleanup-shared-groups.ts` following existing migration script patterns
2. Implemented three cleanup operations:
   - Delete all documents in `/sharedGroups` collection
   - Delete all documents in `/pendingInvitations` collection
   - Clear `sharedGroupIds` to `[]` for all user transactions
3. Added `--dry-run` flag that previews changes without executing (tested on production)
4. Added `--force` flag to skip confirmation prompt for CI/automation
5. Added `--help` flag with comprehensive usage documentation
6. Implemented batch operations (500 docs per batch) for large dataset handling
7. Added confirmation prompt with Y/N input before destructive operations
8. Updated `scripts/README.md` with new script documentation
9. Dry-run test results: Found 2 shared groups, 0 pending invitations, 84 transactions to clear

### File List

| File | Change | Description |
|------|--------|-------------|
| scripts/cleanup-shared-groups.ts | Added | Main cleanup script with all features |
| scripts/README.md | Modified | Added documentation for new script |

### Change Log

| Date | Change |
|------|--------|
| 2026-01-21 | Created cleanup script and documentation |
| 2026-01-21 | Code review fixes: Fixed infinite loop bug in dry-run mode, added retry logic with exponential backoff for batch commits, removed unused imports |
