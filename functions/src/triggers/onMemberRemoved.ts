/**
 * Cloud Function: onMemberRemoved
 *
 * Story 14d-v2-1-7c: Cloud Function - Member Leave Handler
 *
 * Firestore trigger that detects when members are removed from a shared group's
 * members array and creates TRANSACTION_REMOVED changelog entries for their
 * transactions.
 *
 * Architecture:
 * - Triggers on sharedGroups/{groupId} document updates
 * - Compares before/after members arrays to detect removals
 * - Queries transactions collection for each removed member
 * - Creates idempotent changelog entries with 30-day TTL
 *
 * Idempotency:
 * - Uses deterministic entry ID: `removed-{memberId}-{transactionId}`
 * - Checks for existing entry before creating
 * - Safe for Cloud Functions retries
 *
 * @see src/types/changelog.ts for ChangelogEntry type
 * @see src/types/sharedGroup.ts for SharedGroup type
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Constants
/**
 * Firebase project ID for constructing user transaction paths.
 * Uses environment variable from Cloud Functions runtime, with fallback for local dev/testing.
 */
const APP_ID = process.env.GCLOUD_PROJECT || 'boletapp-d609f';

/**
 * Changelog entry TTL in milliseconds (30 days).
 *
 * IMPORTANT: This constant is intentionally duplicated from src/types/changelog.ts.
 * Cloud Functions have an isolated build environment and cannot reliably import
 * from the client-side src/ directory. Keeping constants co-located with the
 * function ensures predictable builds without cross-boundary dependencies.
 *
 * @see src/types/changelog.ts CHANGELOG_TTL_MS
 */
const CHANGELOG_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
/**
 * Maximum transactions to process per member to prevent DoS.
 * Users with more transactions will have partial changelog entries.
 * This limit should be monitored in production - if hit frequently,
 * consider pagination or async processing.
 */
const MAX_TRANSACTIONS_PER_MEMBER = 500;

/**
 * Firestore reference for database operations
 */
const db = admin.firestore();

/**
 * Batch size for parallel changelog entry creation.
 * Balances parallelism with Firestore write limits.
 */
const BATCH_SIZE = 50;

/**
 * Interface for SharedGroup document data.
 *
 * IMPORTANT: This interface is intentionally duplicated from src/types/sharedGroup.ts.
 * Cloud Functions have an isolated build environment and cannot import from the
 * client-side src/ directory without complex build configuration. Co-locating
 * types ensures predictable builds and clear function boundaries.
 *
 * @see src/types/sharedGroup.ts SharedGroup
 */
interface SharedGroupData {
  members: string[];
  ownerId: string;
  name?: string;
}

/**
 * Interface for Transaction document data.
 *
 * IMPORTANT: Duplicated from src/types/transaction.ts for Cloud Functions isolation.
 * @see src/types/transaction.ts Transaction
 */
interface TransactionData {
  id?: string;
  sharedGroupId: string | null;
  total: number;
  currency?: string;
  merchant?: string;
  category?: string;
  items?: Array<{ name: string; price: number }>;
  date?: string;
}

/**
 * Interface for ChangelogEntry to write.
 *
 * IMPORTANT: Duplicated from src/types/changelog.ts for Cloud Functions isolation.
 * @see src/types/changelog.ts ChangelogEntry
 */
interface ChangelogEntry {
  type: 'TRANSACTION_REMOVED';
  transactionId: string;
  timestamp: FirebaseFirestore.FieldValue;
  actorId: string;
  groupId: string;
  data: null;
  summary: {
    amount: number;
    currency: string;
    description: string;
    category: string | null;
  };
  _ttl: FirebaseFirestore.Timestamp;
}

/**
 * Type guard for Firestore error with error code.
 * Used for atomic idempotency check with create().
 */
interface FirestoreError {
  code?: number | string;
  message?: string;
}

function isFirestoreError(error: unknown): error is FirestoreError {
  return (
    typeof error === 'object' &&
    error !== null &&
    ('code' in error || 'message' in error)
  );
}

/**
 * Truncates a user ID for safe logging (first 8 characters).
 * Prevents exposing full user IDs in logs.
 */
function truncateUserId(userId: string): string {
  return userId.length > 8 ? `${userId.substring(0, 8)}...` : userId;
}

/**
 * Detects which members were removed by comparing before/after arrays
 *
 * @param beforeMembers - Members array before the update
 * @param afterMembers - Members array after the update
 * @returns Array of member IDs that were removed
 */
function detectRemovedMembers(
  beforeMembers: string[],
  afterMembers: string[]
): string[] {
  const afterSet = new Set(afterMembers);
  return beforeMembers.filter((member) => !afterSet.has(member));
}

/**
 * Creates a summary object for a transaction
 *
 * @param transaction - Transaction data
 * @returns Summary object for changelog entry
 */
function createSummary(transaction: TransactionData): {
  amount: number;
  currency: string;
  description: string;
  category: string | null;
} {
  const description =
    transaction.merchant ||
    (transaction.items && transaction.items.length > 0
      ? transaction.items[0].name
      : 'Transaction');

  return {
    amount: transaction.total,
    currency: transaction.currency ?? 'CLP',
    description,
    category: transaction.category ?? null,
  };
}

/**
 * Generates a deterministic changelog entry ID for idempotency
 *
 * @param memberId - The member being removed
 * @param transactionId - The transaction ID
 * @returns Deterministic entry ID
 */
function generateEntryId(memberId: string, transactionId: string): string {
  return `removed-${memberId}-${transactionId}`;
}

/**
 * Creates a changelog entry for a removed transaction.
 *
 * Uses atomic create() for idempotency - safe for Cloud Functions retries.
 *
 * @param groupId - The shared group ID
 * @param memberId - The member who owned the transaction
 * @param transactionId - The transaction ID
 * @param transaction - The transaction data
 * @throws {Error} Re-throws Firestore errors (except "already exists") to trigger retry
 */
async function createChangelogEntry(
  groupId: string,
  memberId: string,
  transactionId: string,
  transaction: TransactionData
): Promise<void> {
  const entryId = generateEntryId(memberId, transactionId);
  const changelogRef = db
    .collection('sharedGroups')
    .doc(groupId)
    .collection('changelog')
    .doc(entryId);

  // Calculate TTL (30 days from now)
  const ttlMs = Date.now() + CHANGELOG_TTL_MS;
  const ttl = admin.firestore.Timestamp.fromMillis(ttlMs);

  const entry: ChangelogEntry = {
    type: 'TRANSACTION_REMOVED',
    transactionId,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
    actorId: memberId,
    groupId,
    data: null, // null for removals - transactions remain tagged
    summary: createSummary(transaction),
    _ttl: ttl,
  };

  // Use create() for atomic idempotency (fails if doc exists)
  // This prevents race conditions in concurrent function executions
  try {
    await changelogRef.create(entry);
    functions.logger.debug('Created changelog entry', {
      entryId,
      transactionId,
      memberId: truncateUserId(memberId),
    });
  } catch (createError: unknown) {
    // Type-safe error code extraction
    if (isFirestoreError(createError)) {
      const code = createError.code;
      // Check if error is "already exists" (Firestore error code 6)
      if (code === 6 || code === 'already-exists') {
        functions.logger.debug('Changelog entry already exists, skipping', {
          entryId,
        });
        return;
      }
    }
    // Re-throw other errors to trigger Cloud Functions retry
    throw createError;
  }
}

/**
 * Processes transactions for a removed member.
 *
 * Uses parallel processing with batching for efficient changelog creation.
 *
 * @param groupId - The shared group ID
 * @param memberId - The member who was removed
 */
async function processRemovedMember(
  groupId: string,
  memberId: string
): Promise<void> {
  const truncatedMemberId = truncateUserId(memberId);
  functions.logger.info('Processing removed member', {
    memberId: truncatedMemberId,
    groupId,
  });

  // Query transactions owned by this member that are tagged to this group
  // Limit to MAX_TRANSACTIONS_PER_MEMBER to prevent DoS from large collections
  const transactionsRef = db.collection(
    `artifacts/${APP_ID}/users/${memberId}/transactions`
  );
  const snapshot = await transactionsRef
    .where('sharedGroupId', '==', groupId)
    .limit(MAX_TRANSACTIONS_PER_MEMBER)
    .get();

  if (snapshot.empty) {
    functions.logger.info('No transactions found for member', {
      memberId: truncatedMemberId,
      groupId,
    });
    return;
  }

  functions.logger.info('Found transactions for member', {
    count: snapshot.docs.length,
    memberId: truncatedMemberId,
    groupId,
  });

  // Warn if we hit the limit - may need pagination for this user
  if (snapshot.docs.length >= MAX_TRANSACTIONS_PER_MEMBER) {
    functions.logger.warn('Transaction limit hit - some may not be processed', {
      memberId: truncatedMemberId,
      groupId,
      limit: MAX_TRANSACTIONS_PER_MEMBER,
    });
  }

  // Create changelog entries in parallel batches for efficiency
  // Process BATCH_SIZE transactions concurrently, then next batch
  const docs = snapshot.docs;
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map((doc) => {
        const transaction = doc.data() as TransactionData;
        return createChangelogEntry(groupId, memberId, doc.id, transaction);
      })
    );
  }

  functions.logger.info('Completed processing transactions for member', {
    processed: docs.length,
    memberId: truncatedMemberId,
    groupId,
  });
}

/**
 * Cloud Function: onMemberRemoved
 *
 * Firestore trigger that fires when a sharedGroup document is updated.
 * Detects member removals and creates changelog entries for their transactions.
 */
export const onMemberRemoved = functions.firestore
  .document('sharedGroups/{groupId}')
  .onUpdate(async (change, context) => {
    const { groupId } = context.params;

    try {
      // Get before and after data
      const beforeData = change.before.data() as SharedGroupData | undefined;
      const afterData = change.after.data() as SharedGroupData | undefined;

      // Guard: Handle missing data (document created or deleted)
      if (!beforeData || !afterData) {
        functions.logger.debug('Missing before or after data, skipping', { groupId });
        return null;
      }

      // Get members arrays (default to empty if not present)
      const beforeMembers = beforeData.members || [];
      const afterMembers = afterData.members || [];

      // Detect removed members
      const removedMembers = detectRemovedMembers(beforeMembers, afterMembers);

      if (removedMembers.length === 0) {
        functions.logger.debug('No members removed, skipping', { groupId });
        return null;
      }

      functions.logger.info('Detected removed members', {
        count: removedMembers.length,
        groupId,
        // Truncate member IDs for privacy in logs
        memberIds: removedMembers.map(truncateUserId),
      });

      // Process each removed member
      for (const memberId of removedMembers) {
        await processRemovedMember(groupId, memberId);
      }

      functions.logger.info('Completed processing for group', { groupId });
      return null;
    } catch (error) {
      // Log error and rethrow to trigger Cloud Functions retry mechanism
      // The idempotent design ensures retries are safe
      functions.logger.error('Error processing member removal', {
        groupId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  });
