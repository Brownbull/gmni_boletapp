/**
 * Cloud Function: getSharedGroupTransactions
 *
 * Story 14c.5: Shared Group Transactions View
 * Epic 14c: Household Sharing
 *
 * Secure server-side function to fetch transactions shared to a group.
 * Validates membership before executing query, preventing unauthorized access.
 *
 * Security Model:
 * 1. Authenticates user via Firebase Auth token
 * 2. Validates user is a member of the requested group
 * 3. Executes collectionGroup query with admin SDK (bypasses client rules)
 * 4. Returns transactions with owner info extracted from document path
 *
 * This replaces the insecure client-side collectionGroup query that relied
 * on UUID obscurity for security.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize admin SDK if not already initialized
if (admin.apps.length === 0) {
    admin.initializeApp();
}

const db = admin.firestore();

// ============================================================================
// Types
// ============================================================================

/**
 * Request payload for getSharedGroupTransactions
 */
interface GetSharedGroupTransactionsRequest {
    /** Shared group document ID */
    groupId: string;
    /** Start date for range filter (YYYY-MM-DD) */
    startDate?: string;
    /** End date for range filter (YYYY-MM-DD) */
    endDate?: string;
    /** Maximum transactions to return (default: 200, max: 500) */
    limit?: number;
}

/**
 * Transaction data returned by the function.
 * Mirrors the client-side SharedGroupTransaction type.
 */
interface SharedGroupTransactionResponse {
    id: string;
    _ownerId: string;
    date: string;
    total: number;
    merchant?: string;
    category?: string;
    items?: Array<{
        name: string;
        price: number;
        quantity?: number;
        category?: string;
    }>;
    sharedGroupIds?: string[];
    createdAt?: admin.firestore.Timestamp;
    updatedAt?: admin.firestore.Timestamp;
    // Include other transaction fields as needed
    [key: string]: unknown;
}

// ============================================================================
// Constants
// ============================================================================

/** Maximum allowed limit per request */
const MAX_LIMIT = 500;

/** Default limit if not specified */
const DEFAULT_LIMIT = 200;

// ============================================================================
// Main Function
// ============================================================================

/**
 * Fetches transactions shared to a group, with server-side membership validation.
 *
 * @throws unauthenticated - If user is not signed in
 * @throws not-found - If group doesn't exist
 * @throws permission-denied - If user is not a member of the group
 * @throws invalid-argument - If groupId is missing or invalid
 */
export const getSharedGroupTransactions = functions.https.onCall(
    async (
        data: GetSharedGroupTransactionsRequest,
        context: functions.https.CallableContext
    ): Promise<SharedGroupTransactionResponse[]> => {
        // ================================================================
        // 1. Authentication Check
        // ================================================================
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'Must be signed in to access shared group transactions'
            );
        }

        const userId = context.auth.uid;

        // ================================================================
        // 2. Input Validation
        // ================================================================
        const { groupId, startDate, endDate, limit } = data;

        if (!groupId || typeof groupId !== 'string' || groupId.trim() === '') {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'groupId is required and must be a non-empty string'
            );
        }

        // Validate date formats if provided
        if (startDate && !isValidDateString(startDate)) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'startDate must be in YYYY-MM-DD format'
            );
        }

        if (endDate && !isValidDateString(endDate)) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'endDate must be in YYYY-MM-DD format'
            );
        }

        // Sanitize limit
        const queryLimit = Math.min(
            Math.max(1, limit || DEFAULT_LIMIT),
            MAX_LIMIT
        );

        // ================================================================
        // 3. Membership Validation
        // ================================================================
        const groupDoc = await db.doc(`sharedGroups/${groupId}`).get();

        if (!groupDoc.exists) {
            throw new functions.https.HttpsError(
                'not-found',
                'Shared group not found'
            );
        }

        const groupData = groupDoc.data();
        const members: string[] = groupData?.members || [];

        if (!members.includes(userId)) {
            // Log suspicious access attempt (but don't expose details to client)
            console.warn(
                `[SECURITY] User ${userId} attempted to access group ${groupId} without membership`
            );

            throw new functions.https.HttpsError(
                'permission-denied',
                'You are not a member of this group'
            );
        }

        // ================================================================
        // 4. Execute Secure Query
        // ================================================================
        try {
            let query: admin.firestore.Query = db
                .collectionGroup('transactions')
                .where('sharedGroupIds', 'array-contains', groupId)
                .orderBy('date', 'desc')
                .limit(queryLimit);

            // Add date range filters if provided
            if (startDate) {
                query = query.where('date', '>=', startDate);
            }
            if (endDate) {
                query = query.where('date', '<=', endDate);
            }

            const snapshot = await query.get();

            // ================================================================
            // 5. Transform Results
            // ================================================================
            const transactions: SharedGroupTransactionResponse[] = snapshot.docs.map(doc => {
                // Extract owner ID from document path
                // Path format: artifacts/{appId}/users/{userId}/transactions/{transactionId}
                const pathParts = doc.ref.path.split('/');
                const usersIndex = pathParts.indexOf('users');
                const ownerId = usersIndex !== -1 && pathParts.length > usersIndex + 1
                    ? pathParts[usersIndex + 1]
                    : 'unknown';

                const docData = doc.data();

                return {
                    id: doc.id,
                    _ownerId: ownerId,
                    date: docData.date,
                    total: docData.total || 0,
                    merchant: docData.merchant,
                    category: docData.category,
                    items: docData.items,
                    sharedGroupIds: docData.sharedGroupIds,
                    createdAt: docData.createdAt,
                    updatedAt: docData.updatedAt,
                    // Spread remaining fields (but exclude sensitive ones if any)
                    ...sanitizeTransactionData(docData),
                };
            });

            console.log(
                `[getSharedGroupTransactions] User ${userId} fetched ${transactions.length} transactions from group ${groupId}`
            );

            return transactions;
        } catch (error) {
            console.error('[getSharedGroupTransactions] Query error:', error);

            throw new functions.https.HttpsError(
                'internal',
                'Failed to fetch shared group transactions'
            );
        }
    }
);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validates a date string is in YYYY-MM-DD format.
 */
function isValidDateString(dateStr: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
        return false;
    }

    // Also verify it's a valid date
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
}

/**
 * Sanitizes transaction data to remove any sensitive fields
 * and ensure consistent output format.
 */
function sanitizeTransactionData(
    data: admin.firestore.DocumentData
): Record<string, unknown> {
    // Fields to explicitly exclude from the response
    const excludeFields = new Set([
        // Already handled explicitly
        'id',
        '_ownerId',
        'date',
        'total',
        'merchant',
        'category',
        'items',
        'sharedGroupIds',
        'createdAt',
        'updatedAt',
        // Sensitive or internal fields
        'deletedAt', // Soft-deleted transactions shouldn't be returned anyway
    ]);

    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
        if (!excludeFields.has(key)) {
            sanitized[key] = value;
        }
    }

    return sanitized;
}
