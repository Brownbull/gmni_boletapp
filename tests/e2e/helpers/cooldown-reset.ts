/**
 * E2E Helper: Cooldown Reset
 *
 * Wraps the reset-e2e-cooldowns.ts admin script for use in Playwright tests.
 * Calls the script via execSync so Firestore cooldown fields are cleared
 * before toggle interactions in E2E specs.
 *
 * Usage in E2E specs:
 *   import { resetGroupCooldown, resetUserCooldown, resetAllCooldowns } from '../helpers/cooldown-reset';
 *
 *   test.beforeEach(async () => {
 *     resetGroupCooldown(groupId);
 *   });
 */
import { execSync } from 'child_process';

const SCRIPT_PATH = 'scripts/testing/reset-e2e-cooldowns.ts';

/**
 * Reset group-level toggle cooldown fields in staging Firestore.
 *
 * Clears transactionSharingLastToggleAt, resets transactionSharingToggleCountToday to 0,
 * and clears transactionSharingToggleCountResetAt on the sharedGroups/{groupId} document.
 *
 * @param groupId - Firestore document ID of the shared group
 */
export function resetGroupCooldown(groupId: string): void {
    execSync(`npx tsx ${SCRIPT_PATH} --group-id ${groupId} --execute`, {
        stdio: 'pipe',
        timeout: 15000,
    });
}

/**
 * Reset user-level toggle cooldown fields in staging Firestore.
 *
 * Clears lastToggleAt, resets toggleCountToday to 0, and clears toggleCountResetAt
 * on the user's sharedGroups preference for the specified group.
 *
 * @param userEmail - Email of the test user (e.g., 'bob@boletapp.test')
 * @param groupId - Firestore document ID of the shared group
 */
export function resetUserCooldown(userEmail: string, groupId: string): void {
    execSync(`npx tsx ${SCRIPT_PATH} --user-email ${userEmail} --group-id ${groupId} --execute`, {
        stdio: 'pipe',
        timeout: 15000,
    });
}

/**
 * Reset both group-level and user-level toggle cooldown fields.
 *
 * Convenience function that resets both in a single script invocation.
 *
 * @param groupId - Firestore document ID of the shared group
 * @param userEmail - Email of the test user (e.g., 'alice@boletapp.test')
 */
export function resetAllCooldowns(groupId: string, userEmail: string): void {
    execSync(`npx tsx ${SCRIPT_PATH} --group-id ${groupId} --user-email ${userEmail} --execute`, {
        stdio: 'pipe',
        timeout: 15000,
    });
}
