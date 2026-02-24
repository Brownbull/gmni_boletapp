/**
 * Firestore Security Rules Tests — Schema Bounds
 *
 * TD-15b-12: Schema bounds — non-empty merchant and non-negative total
 * TD-15b-13: Upper-bound cap — total <= 999,999,999
 *
 * Split from firestore-rules.test.ts to stay under the 500-line integration test limit.
 */

import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
    setupFirebaseEmulator,
    teardownFirebaseEmulator,
    clearFirestoreData,
    getAuthedFirestore,
    TEST_USERS,
    TEST_COLLECTION_PATH,
    assertSucceeds,
    assertFails,
} from '../setup/firebase-emulator';
import { collection, addDoc } from 'firebase/firestore';

/**
 * TD-15b-12: Schema bounds — non-empty merchant and non-negative total
 *
 * Verifies that hasValidFieldBounds enforces:
 * - merchant (when present) is a non-empty string (size >= 1)
 * - total (when present) is non-negative (>= 0), with zero explicitly accepted
 *
 * AC4 (optional-field guard preserved) is covered by TD-15b-11 Tests 9 and 12
 * (preferences and credits subcollection writes without merchant/total still pass).
 */
describe('Transaction schema bounds (TD-15b-12)', () => {
    // Shared helper — creates a fresh collection reference for USER_1 transactions each call.
    const getTxnCollection = () => collection(
        getAuthedFirestore(TEST_USERS.USER_1),
        `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/transactions`
    );

    beforeAll(async () => {
        await setupFirebaseEmulator();
    });

    afterAll(async () => {
        await teardownFirebaseEmulator();
    });

    beforeEach(async () => {
        await clearFirestoreData();
    });

    it('should reject transaction write with empty merchant field (AC1)', async () => {
        await assertFails(
            addDoc(getTxnCollection(), { merchant: '', date: '2026-02-24', total: 50, category: 'Groceries', items: [] })
        );
    });

    it('should reject transaction write with negative total field (AC2)', async () => {
        await assertFails(
            addDoc(getTxnCollection(), { merchant: 'Jumbo', date: '2026-02-24', total: -1, category: 'Groceries', items: [] })
        );
    });

    it('should allow transaction write with zero total — free item (AC3)', async () => {
        await assertSucceeds(
            addDoc(getTxnCollection(), { merchant: 'Jumbo', date: '2026-02-24', total: 0, category: 'Groceries', items: [] })
        );
    });

    it('should allow transaction write with fractional total (AC3 extension)', async () => {
        await assertSucceeds(
            addDoc(getTxnCollection(), { merchant: 'Jumbo', date: '2026-02-24', total: 99.99, category: 'Groceries', items: [] })
        );
    });
});

/**
 * TD-15b-13: Upper-bound cap — total <= 999,999,999
 *
 * Verifies that hasValidFieldBounds enforces:
 * - total (when present) does not exceed 999,999,999 (≈ ₡1M CLP upper domain bound)
 *
 * Rationale: ₡999,999,999 ≈ ~$1M USD. A single transaction exceeding this value
 * is almost certainly a data entry error. The cap is enforced at the rules layer
 * as a defense-in-depth bound; client-layer validation (sanitizeInput) is the first line.
 */
describe('Transaction upper-bound cap (TD-15b-13)', () => {
    // Shared helper — creates a fresh collection reference for USER_1 transactions each call.
    const getTxnCollection = () => collection(
        getAuthedFirestore(TEST_USERS.USER_1),
        `${TEST_COLLECTION_PATH}/${TEST_USERS.USER_1}/transactions`
    );

    beforeAll(async () => {
        await setupFirebaseEmulator();
    });

    afterAll(async () => {
        await teardownFirebaseEmulator();
    });

    beforeEach(async () => {
        await clearFirestoreData();
    });

    it('should allow transaction write with total at upper boundary (999999999) (AC3)', async () => {
        await assertSucceeds(
            addDoc(getTxnCollection(), { merchant: 'Jumbo', date: '2026-02-24', total: 999999999, category: 'Groceries', items: [] })
        );
    });

    it('should reject transaction write with total exceeding upper boundary (1000000000) (AC3)', async () => {
        await assertFails(
            addDoc(getTxnCollection(), { merchant: 'Jumbo', date: '2026-02-24', total: 1000000000, category: 'Groceries', items: [] })
        );
    });
});
