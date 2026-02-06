/**
 * Cloud Function: changelogWriter (onTransactionWrite)
 *
 * Story 14d-v2-1-8a: Cloud Function - Changelog Writer Foundation
 * Story 14d-v2-1-8b: Cloud Function - Changelog Writer Validation Layer (Task 7: Batch Writing)
 * Story 14d-v2-1-8c: Cloud Function - Changelog Writer Logging & Export
 *
 * Category: CRITICAL (core sync functionality)
 *
 * Firestore trigger (2nd gen) that detects transaction changes and creates
 * changelog entries for shared group sync.
 *
 * Architecture Decisions:
 * - AD-2: Changelog as PRIMARY sync source
 * - AD-3: Full transaction data in changelog (50% cost reduction)
 * - AD-7: Changelog as subcollection (enables Firestore TTL)
 * - AD-9: 30-day TTL on changelog entries
 *
 * Change Detection Matrix:
 * | Before State | After State | Action |
 * |--------------|-------------|--------|
 * | null         | groupA      | ADDED to groupA |
 * | groupA       | null        | REMOVED from groupA |
 * | groupA       | groupA (data changed) | MODIFIED in groupA |
 * | groupA       | groupB      | REMOVED from groupA, ADDED to groupB |
 * | groupA       | groupA (deletedAt set) | REMOVED from groupA |
 * | groupA       | document deleted | REMOVED from groupA |
 *
 * Idempotency:
 * - Uses deterministic document ID: `{eventId}-{changeType}`
 * - Uses set() instead of add() for safe retries
 *
 * @see src/types/changelog.ts for ChangelogEntry types (duplicated here for isolation)
 */

import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';

// ============================================================================
// Firebase Admin Initialization
// ============================================================================

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

// ============================================================================
// Constants
// ============================================================================

/**
 * Changelog entry TTL in milliseconds (30 days).
 *
 * IMPORTANT: This constant is intentionally duplicated from src/types/changelog.ts.
 * Cloud Functions have an isolated build environment and cannot reliably import
 * from the client-side src/ directory.
 *
 * @see src/types/changelog.ts CHANGELOG_TTL_MS
 */
const CHANGELOG_TTL_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Default currency code when not specified in transaction.
 */
const DEFAULT_CURRENCY = 'CLP';

/**
 * Maximum length for summary string fields (defense in depth).
 */
const MAX_SUMMARY_STRING_LENGTH = 200;

// ============================================================================
// Types (duplicated for Cloud Functions isolation)
// ============================================================================

/**
 * Type of change recorded in the changelog.
 */
type ChangelogEntryType =
  | 'TRANSACTION_ADDED'
  | 'TRANSACTION_MODIFIED'
  | 'TRANSACTION_REMOVED';

/**
 * Summary data for notification display and quick sync previews.
 */
interface ChangelogSummary {
  amount: number;
  currency: string;
  description: string;
  category: string | null;
}

/**
 * Changelog entry structure for Firestore.
 */
interface ChangelogEntryData {
  type: ChangelogEntryType;
  transactionId: string;
  timestamp: FirebaseFirestore.FieldValue;
  actorId: string;
  groupId: string;
  data: Record<string, unknown> | null;
  summary: ChangelogSummary;
  _ttl: FirebaseFirestore.Timestamp;
  processedAt: FirebaseFirestore.FieldValue;
}

/**
 * Transaction data structure (minimal fields needed for changelog).
 */
interface TransactionData {
  sharedGroupId?: string | null;
  total: number;
  currency?: string;
  merchant?: string;
  category?: string;
  items?: Array<{ name: string; price: number }>;
  date?: string;
  deletedAt?: FirebaseFirestore.Timestamp | null;
  [key: string]: unknown;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sanitizes a string for safe storage in changelog entries.
 * Removes HTML tags (basic XSS prevention) and truncates to max length.
 *
 * Note: Client must also sanitize when displaying. This is defense-in-depth.
 *
 * @param value - String to sanitize
 * @param maxLength - Maximum allowed length
 * @param fallback - Fallback value if input is empty/invalid
 * @returns Sanitized string
 */
function sanitizeString(
  value: string | undefined | null,
  maxLength: number,
  fallback: string
): string {
  if (!value || typeof value !== 'string') return fallback;
  // Remove HTML tags (basic XSS prevention - client should also escape)
  const sanitized = value.replace(/<[^>]*>/g, '').trim();
  return sanitized.slice(0, maxLength) || fallback;
}

/**
 * Creates a summary object from transaction data.
 * Uses defensive defaults for missing/malformed fields.
 * Sanitizes string fields for safe storage.
 *
 * @param transaction - Transaction data
 * @returns Summary suitable for changelog entry
 */
function createSummary(transaction: TransactionData): ChangelogSummary {
  // Description fallback: merchant -> first item name -> "Transaction"
  const rawDescription =
    transaction.merchant ||
    (transaction.items && transaction.items.length > 0
      ? transaction.items[0].name
      : null);

  return {
    // Defensive: default to 0 if total is missing or malformed
    amount: transaction.total ?? 0,
    currency: transaction.currency ?? DEFAULT_CURRENCY,
    description: sanitizeString(rawDescription, MAX_SUMMARY_STRING_LENGTH, 'Transaction'),
    category: transaction.category
      ? sanitizeString(transaction.category, MAX_SUMMARY_STRING_LENGTH, '')  || null
      : null,
  };
}

/**
 * Calculates TTL timestamp (30 days from now).
 *
 * @returns Firestore Timestamp 30 days in the future
 */
function calculateTtl(): FirebaseFirestore.Timestamp {
  const ttlMs = Date.now() + CHANGELOG_TTL_MS;
  return admin.firestore.Timestamp.fromMillis(ttlMs);
}

/**
 * Builds changelog entry data without writing to Firestore.
 * Pure function that constructs the entry object.
 *
 * @param groupId - Target shared group ID
 * @param eventId - Unique event ID for idempotency
 * @param entryType - Type of changelog entry
 * @param transactionId - Transaction document ID
 * @param actorId - User who made the change
 * @param transactionData - Full transaction data (null for REMOVED)
 * @returns Changelog entry data object
 */
function buildChangelogEntryData(
  groupId: string,
  eventId: string,
  entryType: ChangelogEntryType,
  transactionId: string,
  actorId: string,
  transactionData: TransactionData | null
): { docId: string; entry: ChangelogEntryData } {
  // Deterministic document ID for idempotency
  const docId = `${eventId}-${entryType}`;

  const entry: ChangelogEntryData = {
    type: entryType,
    transactionId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    actorId,
    groupId,
    data: transactionData ? { ...transactionData } : null,
    summary: transactionData
      ? createSummary(transactionData)
      : { amount: 0, currency: DEFAULT_CURRENCY, description: 'Transaction', category: null },
    _ttl: calculateTtl(),
    processedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  return { docId, entry };
}

/**
 * Validates prerequisites for a changelog entry.
 * Checks groupId format and group membership.
 *
 * @param groupId - Group ID to validate
 * @param actorId - User ID to check membership
 * @param transactionId - Transaction ID for logging
 * @param entryType - Entry type for logging
 * @returns true if validation passes, false otherwise
 */
async function validateChangelogPrerequisites(
  groupId: string,
  actorId: string,
  transactionId: string,
  entryType: ChangelogEntryType
): Promise<boolean> {
  // SECURITY: Validate groupId format
  if (!isValidGroupId(groupId)) {
    functions.logger.warn('Invalid groupId format, skipping', {
      groupId,
      transactionId,
      actorId,
    });
    return false;
  }

  // SECURITY: Validate actor is a member of the target group
  const isMember = await isUserGroupMember(actorId, groupId);
  if (!isMember) {
    functions.logger.warn('Rejected changelog entry: actor not a group member', {
      actorId,
      groupId,
      transactionId,
      entryType,
    });
    return false;
  }

  return true;
}

/**
 * Writes multiple changelog entries atomically using Firestore batch.
 *
 * @param entries - Array of validated changelog entries to write
 * @throws {Error} If batch commit fails (triggers Cloud Functions retry)
 */
async function writeChangelogBatch(
  entries: Array<{
    groupId: string;
    docId: string;
    entry: ChangelogEntryData;
  }>
): Promise<void> {
  if (entries.length === 0) {
    return;
  }

  const batch = db.batch();

  for (const { groupId, docId, entry } of entries) {
    const changelogRef = db
      .collection('sharedGroups')
      .doc(groupId)
      .collection('changelog')
      .doc(docId);

    batch.set(changelogRef, entry);

    functions.logger.debug('Added changelog entry to batch', {
      docId,
      type: entry.type,
      groupId,
      transactionId: entry.transactionId,
    });
  }

  await batch.commit();

  functions.logger.debug('Committed changelog batch', {
    entryCount: entries.length,
  });

  // Structured success logs for Cloud Logging queries (Story 14d-v2-1-8c)
  // Log each entry individually for consistent filtering with single-entry writes
  for (const { groupId, docId, entry } of entries) {
    // Extract eventId from docId format: {eventId}-{changeType}
    // changeType is always TRANSACTION_ADDED/MODIFIED/REMOVED, so we find the last hyphen before it
    const changeTypeSuffix = `-${entry.type}`;
    const eventId = docId.endsWith(changeTypeSuffix)
      ? docId.slice(0, -changeTypeSuffix.length)
      : docId.split('-')[0]; // Fallback for unexpected format

    functions.logger.info('Changelog entry created', {
      eventId,
      transactionId: entry.transactionId,
      groupId,
      changeType: entry.type,
      action: 'CREATED',
      severity: 'INFO',
    });
  }
}

/**
 * Validates that a groupId is a valid Firestore document ID.
 *
 * @param groupId - Group ID to validate
 * @returns true if groupId is valid
 */
function isValidGroupId(groupId: string | null | undefined): groupId is string {
  if (!groupId) return false;
  // Firestore doc IDs: 1-1500 bytes, no forward slashes
  if (groupId.length === 0 || groupId.length > 1500) return false;
  if (groupId.includes('/')) return false;
  return true;
}

/**
 * Checks if a user is a member of a shared group.
 *
 * SECURITY: This validation prevents users from writing changelog entries
 * to groups they don't belong to. Without this check, a malicious user could
 * set arbitrary sharedGroupId values on their transactions.
 *
 * @param userId - User ID to check
 * @param groupId - Group ID to check membership in
 * @returns true if user is a member of the group
 */
async function isUserGroupMember(
  userId: string,
  groupId: string
): Promise<boolean> {
  try {
    const groupDoc = await db.collection('sharedGroups').doc(groupId).get();
    if (!groupDoc.exists) {
      functions.logger.debug('Group does not exist', { groupId });
      return false;
    }
    const members = groupDoc.data()?.members || [];
    return members.includes(userId);
  } catch (error) {
    functions.logger.error('Error checking group membership', {
      userId,
      groupId,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Creates a changelog entry in Firestore.
 *
 * Uses set() with deterministic document ID for idempotency.
 *
 * SECURITY: Validates group membership before writing to prevent
 * unauthorized changelog entries.
 *
 * @param groupId - Target shared group ID
 * @param eventId - Unique event ID for idempotency
 * @param entryType - Type of changelog entry
 * @param transactionId - Transaction document ID
 * @param actorId - User who made the change
 * @param transactionData - Full transaction data (null for REMOVED)
 * @throws {Error} If Firestore write fails (triggers Cloud Functions retry)
 */
async function createChangelogEntry(
  groupId: string,
  eventId: string,
  entryType: ChangelogEntryType,
  transactionId: string,
  actorId: string,
  transactionData: TransactionData | null
): Promise<void> {
  // Validate prerequisites
  const isValid = await validateChangelogPrerequisites(
    groupId,
    actorId,
    transactionId,
    entryType
  );
  if (!isValid) {
    return;
  }

  // Build entry data
  const { docId, entry } = buildChangelogEntryData(
    groupId,
    eventId,
    entryType,
    transactionId,
    actorId,
    transactionData
  );

  const changelogRef = db
    .collection('sharedGroups')
    .doc(groupId)
    .collection('changelog')
    .doc(docId);

  // set() instead of add() for idempotent writes
  await changelogRef.set(entry);

  functions.logger.debug('Created changelog entry', {
    docId,
    type: entryType,
    groupId,
    transactionId,
  });

  // Structured log for Cloud Logging queries (Story 14d-v2-1-8c)
  functions.logger.info('Changelog entry created', {
    eventId,
    transactionId,
    groupId,
    changeType: entryType,
    action: 'CREATED',
    severity: 'INFO',
  });
}

/**
 * Detects if a transaction was soft-deleted (deletedAt was set).
 *
 * @param beforeData - Transaction data before change
 * @param afterData - Transaction data after change
 * @returns true if deletedAt was set (soft delete)
 */
function wasSoftDeleted(
  beforeData: TransactionData | null,
  afterData: TransactionData | null
): boolean {
  if (!afterData) return false;

  const beforeDeletedAt = beforeData?.deletedAt;
  const afterDeletedAt = afterData.deletedAt;

  // Soft delete: deletedAt changed from null/undefined to a timestamp
  return !beforeDeletedAt && !!afterDeletedAt;
}

// ============================================================================
// Main Cloud Function
// ============================================================================

/**
 * onTransactionWrite - Firestore Trigger (2nd gen)
 *
 * Triggers on any write to a user's transaction document and creates
 * changelog entries for shared group sync.
 *
 * Trigger Path: artifacts/{appId}/users/{userId}/transactions/{transactionId}
 */
export const onTransactionWrite = onDocumentWritten(
  'artifacts/{appId}/users/{userId}/transactions/{transactionId}',
  async (event) => {
    const { userId, transactionId } = event.params;
    const eventId = event.id;

    try {
      // Extract before/after data
      const beforeSnapshot = event.data?.before;
      const afterSnapshot = event.data?.after;

      const beforeData = beforeSnapshot?.exists
        ? (beforeSnapshot.data() as TransactionData)
        : null;
      const afterData = afterSnapshot?.exists
        ? (afterSnapshot.data() as TransactionData)
        : null;

      // Extract sharedGroupId from before/after
      const beforeGroupId = beforeData?.sharedGroupId || null;
      const afterGroupId = afterData?.sharedGroupId || null;

      // Check for soft delete (deletedAt set)
      const isSoftDelete = wasSoftDeleted(beforeData, afterData);

      // Skip if no group involvement
      if (!beforeGroupId && !afterGroupId) {
        functions.logger.debug('No group involvement, skipping', {
          transactionId,
          userId,
          action: 'SKIPPED',
          severity: 'DEBUG',
        });
        return null;
      }

      // SECURITY (AC #2): Validate ownership consistency
      // Ownership is implicit from document path (userId IS the owner).
      // The ownerId field in transaction data should match - log if mismatch for audit.
      const transactionOwnerId = afterData?.ownerId || beforeData?.ownerId;
      if (transactionOwnerId && transactionOwnerId !== userId) {
        functions.logger.warn('Ownership mismatch detected (path is authoritative)', {
          pathUserId: userId,
          transactionOwnerId: String(transactionOwnerId),
          transactionId,
          eventId,
        });
        // Continue processing - document path userId is authoritative for Cloud Functions
      }

      functions.logger.info('Processing transaction write', {
        eventId,
        transactionId,
        userId,
        beforeGroupId,
        afterGroupId,
        isSoftDelete,
        severity: 'INFO',
      });

      // ======================================================================
      // Change Detection and Entry Creation
      // ======================================================================

      // Case 1: Soft delete (deletedAt set while in a group)
      if (isSoftDelete && beforeGroupId) {
        await createChangelogEntry(
          beforeGroupId,
          eventId,
          'TRANSACTION_REMOVED',
          transactionId,
          userId,
          null
        );
        return null;
      }

      // Case 2: Hard delete (document deleted while in a group)
      if (!afterData && beforeGroupId) {
        await createChangelogEntry(
          beforeGroupId,
          eventId,
          'TRANSACTION_REMOVED',
          transactionId,
          userId,
          null
        );
        return null;
      }

      // Case 3: Group change (moved from one group to another)
      // Uses batch writing for atomic operations (AC #3, #4)
      //
      // SECURITY NOTE (TOCTOU): There is a small race condition window between
      // membership validation and batch commit. This is acceptable because:
      // 1. Changelog security rules also enforce membership at write time
      // 2. Race window is milliseconds
      // 3. 30-day TTL limits exposure of any orphaned entries
      // 4. Idempotent design allows safe retries
      // See: TD-14d-11 for potential Firestore transaction enhancement
      if (beforeGroupId && afterGroupId && beforeGroupId !== afterGroupId) {
        // Validate prerequisites for both groups
        const [beforeValid, afterValid] = await Promise.all([
          validateChangelogPrerequisites(beforeGroupId, userId, transactionId, 'TRANSACTION_REMOVED'),
          validateChangelogPrerequisites(afterGroupId, userId, transactionId, 'TRANSACTION_ADDED'),
        ]);

        // Build entries for validated groups
        const entries: Array<{
          groupId: string;
          docId: string;
          entry: ChangelogEntryData;
        }> = [];

        if (beforeValid) {
          const { docId, entry } = buildChangelogEntryData(
            beforeGroupId,
            eventId,
            'TRANSACTION_REMOVED',
            transactionId,
            userId,
            null
          );
          entries.push({ groupId: beforeGroupId, docId, entry });
        }

        if (afterValid) {
          const { docId, entry } = buildChangelogEntryData(
            afterGroupId,
            eventId,
            'TRANSACTION_ADDED',
            transactionId,
            userId,
            afterData
          );
          entries.push({ groupId: afterGroupId, docId, entry });
        }

        // Atomic batch write - all entries succeed or fail together
        await writeChangelogBatch(entries);
        return null;
      }

      // Case 4: Removed from group (group -> null)
      if (beforeGroupId && !afterGroupId) {
        await createChangelogEntry(
          beforeGroupId,
          eventId,
          'TRANSACTION_REMOVED',
          transactionId,
          userId,
          null
        );
        return null;
      }

      // Case 5: Added to group (null -> group or new doc with group)
      if (!beforeGroupId && afterGroupId) {
        await createChangelogEntry(
          afterGroupId,
          eventId,
          'TRANSACTION_ADDED',
          transactionId,
          userId,
          afterData
        );
        return null;
      }

      // Case 6: Modified within same group (same groupId, data changed)
      if (beforeGroupId && afterGroupId && beforeGroupId === afterGroupId) {
        await createChangelogEntry(
          afterGroupId,
          eventId,
          'TRANSACTION_MODIFIED',
          transactionId,
          userId,
          afterData
        );
        return null;
      }

      return null;
    } catch (error) {
      // Log error and rethrow to trigger Cloud Functions retry mechanism
      // The idempotent design ensures retries are safe
      functions.logger.error('Error processing transaction write', {
        transactionId,
        userId,
        eventId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        action: 'ERROR',
        severity: 'ERROR',
      });
      throw error;
    }
  }
);
