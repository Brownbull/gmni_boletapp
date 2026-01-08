import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    deleteDoc,
    getDocs,
    onSnapshot,
    serverTimestamp,
    query,
    orderBy,
    limit,
    Firestore,
    Unsubscribe,
} from 'firebase/firestore';
import {
    TrustedMerchant,
    TrustedMerchantCreate,
    TrustPromptEligibility,
    TRUST_THRESHOLDS,
} from '../types/trust';
import { LISTENER_LIMITS } from './firestore';

/**
 * Get the collection path for a user's trusted merchants
 * Story 11.4: AC #8 - Trust data stored per-user in Firestore
 */
function getTrustedMerchantsCollectionPath(appId: string, userId: string): string {
    return `artifacts/${appId}/users/${userId}/trusted_merchants`;
}

/**
 * Normalize a merchant name for trust matching
 * - Lowercase
 * - Trim whitespace
 * - Remove special characters except alphanumeric and spaces
 * - Collapse multiple spaces
 * - Remove accents/diacritics
 *
 * Story 11.4: Task 2 - Handle merchant name normalization
 */
export function normalizeMerchantNameForTrust(name: string): string {
    return name
        .toLowerCase()
        .trim()
        // Remove accents/diacritics
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Remove non-alphanumeric except spaces
        .replace(/[^a-z0-9\s]/gi, '')
        // Collapse multiple spaces
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Calculate edit rate from scan and edit counts
 * Returns 0 if no scans to avoid division by zero
 */
export function calculateEditRate(scanCount: number, editCount: number): number {
    if (scanCount === 0) return 0;
    return editCount / scanCount;
}

/**
 * Check if trust prompt should be shown for a merchant
 * Story 11.4: AC #2, AC #4
 *
 * Trust criteria:
 * - At least 3 scans (MIN_SCANS)
 * - Edit rate < 10% (MAX_EDIT_RATE)
 * - Not already trusted
 * - Not previously declined (to avoid nagging)
 */
export function shouldShowTrustPrompt(merchant: TrustedMerchant): TrustPromptEligibility {
    // Already trusted - no prompt needed
    if (merchant.trusted) {
        return {
            shouldShowPrompt: false,
            merchant,
            reason: 'already_trusted',
        };
    }

    // Already declined - don't nag (AC #4)
    if (merchant.declined) {
        return {
            shouldShowPrompt: false,
            merchant,
            reason: 'already_declined',
        };
    }

    // Insufficient scans (AC #2: minimum 3)
    if (merchant.scanCount < TRUST_THRESHOLDS.MIN_SCANS) {
        return {
            shouldShowPrompt: false,
            merchant,
            reason: 'insufficient_scans',
        };
    }

    // High edit rate (AC #2: must be < 10%)
    if (merchant.editRate >= TRUST_THRESHOLDS.MAX_EDIT_RATE) {
        return {
            shouldShowPrompt: false,
            merchant,
            reason: 'high_edit_rate',
        };
    }

    // All criteria met - show prompt
    return {
        shouldShowPrompt: true,
        merchant,
        reason: 'eligible',
    };
}

/**
 * Record a scan for a merchant (create or update tracking record)
 * Story 11.4: Task 2 - Track each scan
 *
 * @param db Firestore instance
 * @param userId User ID
 * @param appId App ID
 * @param merchantName Merchant display name (alias)
 * @param wasEdited Whether the user edited the transaction before saving
 * @returns Updated trust prompt eligibility
 */
export async function recordScan(
    db: Firestore,
    userId: string,
    appId: string,
    merchantName: string,
    wasEdited: boolean
): Promise<TrustPromptEligibility> {
    const normalizedName = normalizeMerchantNameForTrust(merchantName);

    // Use normalized name as document ID for consistent lookups
    const collectionPath = getTrustedMerchantsCollectionPath(appId, userId);
    const docRef = doc(db, collectionPath, normalizedName);

    const existingDoc = await getDoc(docRef);

    if (existingDoc.exists()) {
        // Update existing record
        const existing = { id: existingDoc.id, ...existingDoc.data() } as TrustedMerchant;
        const newScanCount = existing.scanCount + 1;
        const newEditCount = existing.editCount + (wasEdited ? 1 : 0);
        const newEditRate = calculateEditRate(newScanCount, newEditCount);

        await updateDoc(docRef, {
            scanCount: newScanCount,
            editCount: newEditCount,
            editRate: newEditRate,
            lastScanAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        });

        const updated: TrustedMerchant = {
            ...existing,
            scanCount: newScanCount,
            editCount: newEditCount,
            editRate: newEditRate,
        };

        return shouldShowTrustPrompt(updated);
    } else {
        // Create new record - use TrustedMerchantCreate for proper serverTimestamp() typing
        const newRecord: TrustedMerchantCreate = {
            merchantName,
            normalizedName,
            scanCount: 1,
            editCount: wasEdited ? 1 : 0,
            editRate: wasEdited ? 1 : 0,
            trusted: false,
            lastScanAt: serverTimestamp(),
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        await setDoc(docRef, newRecord);

        // Return a TrustedMerchant representation for the eligibility check
        // Note: Timestamp fields will be populated by Firestore on read
        return {
            shouldShowPrompt: false,
            merchant: {
                id: normalizedName,
                merchantName,
                normalizedName,
                scanCount: 1,
                editCount: wasEdited ? 1 : 0,
                editRate: wasEdited ? 1 : 0,
                trusted: false,
            } as TrustedMerchant,
            reason: 'insufficient_scans',
        };
    }
}

/**
 * Check if a merchant is trusted
 * Story 11.4: AC #5 - Trusted merchants auto-save
 */
export async function isMerchantTrusted(
    db: Firestore,
    userId: string,
    appId: string,
    merchantName: string
): Promise<boolean> {
    const normalizedName = normalizeMerchantNameForTrust(merchantName);
    const collectionPath = getTrustedMerchantsCollectionPath(appId, userId);
    const docRef = doc(db, collectionPath, normalizedName);

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return false;

    const data = docSnap.data() as TrustedMerchant;
    return data.trusted === true;
}

/**
 * Mark a merchant as trusted
 * Story 11.4: AC #4 - User can accept trust
 */
export async function trustMerchant(
    db: Firestore,
    userId: string,
    appId: string,
    merchantName: string
): Promise<void> {
    const normalizedName = normalizeMerchantNameForTrust(merchantName);
    const collectionPath = getTrustedMerchantsCollectionPath(appId, userId);
    const docRef = doc(db, collectionPath, normalizedName);

    await updateDoc(docRef, {
        trusted: true,
        trustedAt: serverTimestamp(),
        promptShownAt: serverTimestamp(),
        declined: false,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Decline trust for a merchant (marks as declined to avoid nagging)
 * Story 11.4: AC #4 - User can decline trust, only show prompt once per merchant
 */
export async function declineTrust(
    db: Firestore,
    userId: string,
    appId: string,
    merchantName: string
): Promise<void> {
    const normalizedName = normalizeMerchantNameForTrust(merchantName);
    const collectionPath = getTrustedMerchantsCollectionPath(appId, userId);
    const docRef = doc(db, collectionPath, normalizedName);

    await updateDoc(docRef, {
        declined: true,
        promptShownAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
}

/**
 * Revoke trust for a merchant
 * Story 11.4: AC #7 - Users can revoke trust at any time
 */
export async function revokeTrust(
    db: Firestore,
    userId: string,
    appId: string,
    merchantName: string
): Promise<void> {
    const normalizedName = normalizeMerchantNameForTrust(merchantName);
    const collectionPath = getTrustedMerchantsCollectionPath(appId, userId);
    const docRef = doc(db, collectionPath, normalizedName);

    await updateDoc(docRef, {
        trusted: false,
        trustedAt: null,
        updatedAt: serverTimestamp(),
    });
}

/**
 * Delete a trusted merchant record entirely
 * Story 11.4: AC #6, AC #7 - Settings management
 */
export async function deleteTrustedMerchant(
    db: Firestore,
    userId: string,
    appId: string,
    merchantId: string
): Promise<void> {
    const collectionPath = getTrustedMerchantsCollectionPath(appId, userId);
    const docRef = doc(db, collectionPath, merchantId);
    await deleteDoc(docRef);
}

/**
 * Get all trusted merchants for a user
 * Story 11.4: AC #6 - View trusted merchants in Settings
 */
export async function getTrustedMerchants(
    db: Firestore,
    userId: string,
    appId: string
): Promise<TrustedMerchant[]> {
    const collectionPath = getTrustedMerchantsCollectionPath(appId, userId);
    const colRef = collection(db, collectionPath);
    const snapshot = await getDocs(colRef);

    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
    } as TrustedMerchant));
}

/**
 * Get only merchants that are trusted (for Settings display)
 * Story 11.4: AC #6 - List trusted merchants
 */
export async function getOnlyTrustedMerchants(
    db: Firestore,
    userId: string,
    appId: string
): Promise<TrustedMerchant[]> {
    const all = await getTrustedMerchants(db, userId, appId);
    return all.filter(m => m.trusted === true);
}

/**
 * Subscribe to trusted merchants (real-time updates)
 * Story 11.4: AC #6 - Settings management
 * Story 14.25: LIMITED to 200 merchants to reduce Firestore reads
 */
export function subscribeToTrustedMerchants(
    db: Firestore,
    userId: string,
    appId: string,
    callback: (merchants: TrustedMerchant[]) => void
): Unsubscribe {
    const collectionPath = getTrustedMerchantsCollectionPath(appId, userId);
    const colRef = collection(db, collectionPath);

    // Story 14.25: Add limit to reduce Firestore reads
    // Order by scanCount desc to prioritize most-used merchants
    const q = query(
        colRef,
        orderBy('scanCount', 'desc'),
        limit(LISTENER_LIMITS.TRUSTED_MERCHANTS)
    );

    return onSnapshot(q, (snapshot) => {
        const merchants = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as TrustedMerchant));

        // Dev-mode logging for snapshot size monitoring (AC #6)
        if (import.meta.env.DEV && snapshot.size >= LISTENER_LIMITS.TRUSTED_MERCHANTS) {
            console.warn(
                `[merchantTrustService] subscribeToTrustedMerchants: ${snapshot.size} docs at limit`
            );
        }

        callback(merchants);
    });
}

/**
 * Get merchant trust record by name
 */
export async function getMerchantTrustRecord(
    db: Firestore,
    userId: string,
    appId: string,
    merchantName: string
): Promise<TrustedMerchant | null> {
    const normalizedName = normalizeMerchantNameForTrust(merchantName);
    const collectionPath = getTrustedMerchantsCollectionPath(appId, userId);
    const docRef = doc(db, collectionPath, normalizedName);

    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    return {
        id: docSnap.id,
        ...docSnap.data(),
    } as TrustedMerchant;
}
