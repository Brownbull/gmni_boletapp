# Story 14c-refactor.6: Firestore Data Cleanup Script

Status: ready-for-dev

## Story

As a **developer**,
I want **a script to clean up shared group data from Firestore**,
So that **orphaned data is removed and storage costs are reduced**.

## Acceptance Criteria

1. **Given** Firestore contains `sharedGroups` and `pendingInvitations` collections
   **When** the cleanup script is run
   **Then:**
   - All documents in `sharedGroups` collection are deleted
   - All documents in `pendingInvitations` collection are deleted
   - Script logs progress and summary
   - Script has dry-run mode for safety

2. **Given** transactions may have `sharedGroupIds` arrays
   **When** the cleanup script is run (with appropriate flag)
   **Then:**
   - `sharedGroupIds` field is removed from all affected transactions
   - OR `sharedGroupIds` is set to empty array `[]`
   - Script reports number of affected transactions

3. **Given** user preferences may have `memberOfSharedGroups` arrays
   **When** the cleanup script is run
   **Then:**
   - `memberOfSharedGroups` field is removed from user settings
   - Script reports number of affected users

4. **Given** the production environment
   **When** running the script
   **Then:**
   - Script requires explicit confirmation before modifying production data
   - Backup recommendations are displayed
   - Script can target specific project (production vs development)

## Tasks / Subtasks

- [ ] Task 1: Create cleanup script structure (AC: #1, #4)
  - [ ] Create `scripts/cleanup-shared-group-data.ts`
  - [ ] Add TypeScript configuration for scripts
  - [ ] Implement CLI argument parsing (--dry-run, --project, --confirm)
  - [ ] Add Firebase Admin SDK initialization

- [ ] Task 2: Implement sharedGroups cleanup (AC: #1)
  - [ ] Query all documents in `sharedGroups` collection
  - [ ] Batch delete documents (500 per batch)
  - [ ] Log progress: "Deleted N of M sharedGroups documents"
  - [ ] Report final count

- [ ] Task 3: Implement pendingInvitations cleanup (AC: #1)
  - [ ] Query all documents in `pendingInvitations` collection
  - [ ] Batch delete documents
  - [ ] Log progress and final count

- [ ] Task 4: Implement transaction sharedGroupIds cleanup (AC: #2)
  - [ ] Optional: Only run with `--clean-transactions` flag
  - [ ] Use collectionGroup query on `transactions`
  - [ ] Filter for `sharedGroupIds != null && sharedGroupIds.length > 0`
  - [ ] Remove field or set to empty array
  - [ ] Log affected transaction count per user

- [ ] Task 5: Implement user preferences cleanup (AC: #3)
  - [ ] Query user settings documents with `memberOfSharedGroups`
  - [ ] Remove the field
  - [ ] Log affected user count

- [ ] Task 6: Add safety features (AC: #4)
  - [ ] Implement `--dry-run` mode (report only, no modifications)
  - [ ] Add confirmation prompt for production
  - [ ] Display backup recommendations
  - [ ] Add `--project` flag for targeting specific Firebase project

- [ ] Task 7: Document and test script (AC: #1, #4)
  - [ ] Add usage instructions to README or script header
  - [ ] Test in development environment first
  - [ ] Verify dry-run mode works correctly

## Dev Notes

### Script Location

```
scripts/
  cleanup-shared-group-data.ts    # Main cleanup script
  tsconfig.json                   # TypeScript config for scripts
```

### Script Implementation

```typescript
#!/usr/bin/env npx ts-node

/**
 * Firestore Shared Group Data Cleanup Script
 *
 * Story 14c-refactor.6: Clean up orphaned shared group data
 *
 * Usage:
 *   npx ts-node scripts/cleanup-shared-group-data.ts --dry-run
 *   npx ts-node scripts/cleanup-shared-group-data.ts --project boletapp-production --confirm
 *   npx ts-node scripts/cleanup-shared-group-data.ts --clean-transactions --dry-run
 *
 * Options:
 *   --dry-run           Report what would be deleted without making changes
 *   --project <id>      Firebase project ID (required for production)
 *   --confirm           Required for production modifications
 *   --clean-transactions  Also clean sharedGroupIds from transactions
 *   --help              Show usage information
 */

import * as admin from 'firebase-admin';
import * as readline from 'readline';

// ... implementation
```

### Collections to Clean

1. **sharedGroups** (top-level)
   - Path: `sharedGroups/{groupId}`
   - Contains: Group metadata, members array, share codes
   - Action: Delete all documents

2. **pendingInvitations** (top-level)
   - Path: `pendingInvitations/{invitationId}`
   - Contains: Email-based group invitations
   - Action: Delete all documents

3. **transactions** (per-user, optional)
   - Path: `artifacts/{appId}/users/{userId}/transactions/{transactionId}`
   - Field: `sharedGroupIds: string[]`
   - Action: Remove field or set to `[]`

4. **user preferences** (per-user)
   - Path: `artifacts/{appId}/users/{userId}/preferences/settings`
   - Field: `memberOfSharedGroups: string[]`
   - Action: Remove field

### Safety Considerations

1. **Backup First**: Recommend Firestore export before running
   ```bash
   gcloud firestore export gs://boletapp-backups/pre-cleanup-$(date +%Y%m%d)
   ```

2. **Dry Run First**: Always test with `--dry-run`

3. **Development First**: Test on dev project before production

4. **Batch Operations**: Use Firestore batch limit of 500 operations

5. **Transaction Cleanup**: Optional flag because:
   - May want to preserve historical transaction data
   - Large number of transactions could be slow
   - Can be run separately later

### CLI Output Example

```
🧹 Firestore Shared Group Data Cleanup

Project: boletapp-production
Mode: DRY RUN (no changes will be made)

Scanning collections...

📦 sharedGroups:
   Found: 47 documents
   Would delete: 47 documents

📧 pendingInvitations:
   Found: 12 documents
   Would delete: 12 documents

📋 transactions (--clean-transactions not specified):
   Skipped

👤 user preferences:
   Found: 23 users with memberOfSharedGroups
   Would clean: 23 documents

Summary:
- sharedGroups: 47 → 0
- pendingInvitations: 12 → 0
- User preferences: 23 cleaned

To apply changes, run without --dry-run:
  npx ts-node scripts/cleanup-shared-group-data.ts --project boletapp-production --confirm
```

### Firebase Admin SDK Setup

```typescript
// Initialize with service account or default credentials
import * as admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID || args.project;

admin.initializeApp({
  projectId,
  credential: admin.credential.applicationDefault(),
});

const db = admin.firestore();
```

### Dependencies

Add to package.json (devDependencies):
```json
{
  "firebase-admin": "^12.x",
  "ts-node": "^10.x"
}
```

### Testing Standards

- Test with `--dry-run` first
- Verify counts match expectations
- Test in development environment
- Check Firebase Console after cleanup

### Dependencies

- **Depends on:** Story 14c-refactor.5 (UI must be stubbed first so users don't see errors)
- **Blocks:** None (can be run independently)

### References

- [Source: docs/sprint-artifacts/epic-14c-retro-2026-01-20.md] - Retrospective
- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md#Story-14c.6] - Story definition
- [Source: firestore.rules] - Security rules for these collections

## Atlas Workflow Analysis

> 🗺️ This section was generated by Atlas workflow chain analysis (2026-01-21)

### Affected Workflows

- **Household Sharing Flow (#10)**: All data permanently removed
- **Data Audit Flow**: Cleanup script provides audit trail via logs

### Downstream Effects to Consider

- After cleanup, there's no way to recover shared group data (ensure backup)
- Users' `memberOfSharedGroups` being removed won't affect app (hooks return empty)
- Transaction `sharedGroupIds` removal is optional (historical data preserved by default)

### Important Note

**This is a destructive operation.** Ensure:
1. Firestore backup exists
2. UI placeholders are in place (Story 14c-refactor.5)
3. Security rules are simplified (Story 14c-refactor.7) after this

### Testing Implications

- **Development testing:** Run on dev project first
- **Dry run verification:** Check counts before actual run
- **Post-cleanup verification:** Check Firebase Console

### Workflow Chain Visualization

```
[SCRIPT: cleanup-shared-group-data.ts]
  ↓
Delete sharedGroups collection
  ↓
Delete pendingInvitations collection
  ↓
(Optional) Clean transactions.sharedGroupIds
  ↓
Clean user preferences.memberOfSharedGroups
  ↓
[COMPLETE: Data cleaned]
```

## Dev Agent Record

### Agent Model Used

(To be filled by dev agent)

### Debug Log References

(To be filled during implementation)

### Completion Notes List

(To be filled during implementation)

### File List

(To be filled during implementation - files created)
