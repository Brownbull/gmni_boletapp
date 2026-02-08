/**
 * Shared mock Timestamp factory for cooldown and Firestore tests.
 *
 * TD-CONSOLIDATED-4: Extracted from duplicated helpers across
 * cooldownCore.test.ts, sharingCooldown.test.ts, userSharingCooldown.test.ts.
 */

import type { Timestamp } from 'firebase/firestore';

export function createMockTimestamp(date: Date): Timestamp {
    return {
        toDate: () => date,
        seconds: Math.floor(date.getTime() / 1000),
        nanoseconds: 0,
    } as unknown as Timestamp;
}
