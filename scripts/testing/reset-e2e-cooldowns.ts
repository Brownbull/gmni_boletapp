#!/usr/bin/env node

/**
 * Reset E2E Cooldown Fields (Staging Only)
 *
 * Resets toggle cooldown fields on shared groups and user preferences
 * so E2E tests can toggle transaction sharing without hitting rate limits.
 *
 * Uses Firebase Admin SDK with the staging service account key.
 * Safety: Refuses to run against any project other than boletapp-staging.
 *
 * Usage:
 *   # Reset group-level cooldown
 *   npx tsx scripts/testing/reset-e2e-cooldowns.ts --group-id abc123 --execute
 *
 *   # Reset user-level cooldown for bob on a specific group
 *   npx tsx scripts/testing/reset-e2e-cooldowns.ts --user-email bob@boletapp.test --group-id abc123 --execute
 *
 *   # Reset both group-level and user-level cooldowns
 *   npx tsx scripts/testing/reset-e2e-cooldowns.ts --group-id abc123 --user-email bob@boletapp.test --execute
 *
 *   # Dry run (default - shows what would be reset without writing)
 *   npx tsx scripts/testing/reset-e2e-cooldowns.ts --group-id abc123
 */

import { initializeApp, cert, getApps, type ServiceAccount } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// =============================================================================
// Constants
// =============================================================================

const STAGING_PROJECT_ID = 'boletapp-staging';
const STAGING_APP_ID = 'boletapp-staging';
const SERVICE_ACCOUNT_PATH = 'scripts/keys/serviceAccountKey.staging.json';
const GROUPS_COLLECTION = 'sharedGroups';

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// =============================================================================
// CLI Argument Parsing
// =============================================================================

interface CliArgs {
    groupId: string | null;
    userEmail: string | null;
    execute: boolean;
}

function parseArgs(): CliArgs {
    const args = process.argv.slice(2);
    const result: CliArgs = {
        groupId: null,
        userEmail: null,
        execute: false,
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--group-id':
                result.groupId = args[++i] || null;
                break;
            case '--user-email':
                result.userEmail = args[++i] || null;
                break;
            case '--execute':
                result.execute = true;
                break;
        }
    }

    return result;
}

// =============================================================================
// Firebase Admin Initialization
// =============================================================================

function initAdmin(): { db: FirebaseFirestore.Firestore; auth: ReturnType<typeof getAuth> } {
    const serviceAccountPath = join(process.cwd(), SERVICE_ACCOUNT_PATH);

    if (!existsSync(serviceAccountPath)) {
        log(`Service account key not found at: ${SERVICE_ACCOUNT_PATH}`, 'red');
        log('Download from Firebase Console > Project Settings > Service Accounts', 'yellow');
        process.exit(1);
    }

    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8')) as ServiceAccount;

    // Safety: Validate this is the staging project
    const projectId = (serviceAccount as Record<string, string>).project_id;
    if (projectId !== STAGING_PROJECT_ID) {
        log(`SAFETY BLOCK: Expected project '${STAGING_PROJECT_ID}', got '${projectId}'`, 'red');
        log('This script only runs against staging. Aborting.', 'red');
        process.exit(1);
    }

    if (getApps().length === 0) {
        initializeApp({
            credential: cert(serviceAccount),
            projectId: STAGING_PROJECT_ID,
        });
    }

    return { db: getFirestore(), auth: getAuth() };
}

// =============================================================================
// Cooldown Reset Functions
// =============================================================================

async function resetGroupCooldown(
    db: FirebaseFirestore.Firestore,
    groupId: string,
    dryRun: boolean
): Promise<boolean> {
    const groupRef = db.collection(GROUPS_COLLECTION).doc(groupId);
    const groupSnap = await groupRef.get();

    if (!groupSnap.exists) {
        log(`  Group '${groupId}' not found in Firestore`, 'red');
        return false;
    }

    const data = groupSnap.data();
    log(`  Current group-level cooldown state:`, 'blue');
    log(`    transactionSharingLastToggleAt: ${data?.transactionSharingLastToggleAt ?? 'null'}`, 'yellow');
    log(`    transactionSharingToggleCountToday: ${data?.transactionSharingToggleCountToday ?? 0}`, 'yellow');
    log(`    transactionSharingToggleCountResetAt: ${data?.transactionSharingToggleCountResetAt ?? 'null'}`, 'yellow');

    if (dryRun) {
        log(`  [DRY RUN] Would reset group cooldown fields`, 'yellow');
        return true;
    }

    await groupRef.update({
        transactionSharingLastToggleAt: FieldValue.delete(),
        transactionSharingToggleCountToday: 0,
        transactionSharingToggleCountResetAt: FieldValue.delete(),
    });

    log(`  Group cooldown reset`, 'green');
    return true;
}

async function resetUserCooldown(
    db: FirebaseFirestore.Firestore,
    auth: ReturnType<typeof getAuth>,
    userEmail: string,
    groupId: string,
    dryRun: boolean
): Promise<boolean> {
    // Resolve email to UID
    let uid: string;
    try {
        const userRecord = await auth.getUserByEmail(userEmail);
        uid = userRecord.uid;
        log(`  Resolved ${userEmail} -> UID: ${uid}`, 'blue');
    } catch {
        log(`  User '${userEmail}' not found in Firebase Auth`, 'red');
        return false;
    }

    // Read current state
    const prefsRef = db.doc(`artifacts/${STAGING_APP_ID}/users/${uid}/preferences/sharedGroups`);
    const prefsSnap = await prefsRef.get();

    if (!prefsSnap.exists) {
        log(`  No sharedGroups preferences document for user`, 'yellow');
        return true; // Nothing to reset
    }

    const prefs = prefsSnap.data();
    const groupPref = prefs?.groupPreferences?.[groupId];

    if (!groupPref) {
        log(`  No preference entry for group '${groupId}'`, 'yellow');
        return true; // Nothing to reset
    }

    log(`  Current user-level cooldown state:`, 'blue');
    log(`    lastToggleAt: ${groupPref.lastToggleAt ?? 'null'}`, 'yellow');
    log(`    toggleCountToday: ${groupPref.toggleCountToday ?? 0}`, 'yellow');
    log(`    toggleCountResetAt: ${groupPref.toggleCountResetAt ?? 'null'}`, 'yellow');

    if (dryRun) {
        log(`  [DRY RUN] Would reset user cooldown fields`, 'yellow');
        return true;
    }

    await prefsRef.update({
        [`groupPreferences.${groupId}.lastToggleAt`]: FieldValue.delete(),
        [`groupPreferences.${groupId}.toggleCountToday`]: 0,
        [`groupPreferences.${groupId}.toggleCountResetAt`]: FieldValue.delete(),
    });

    log(`  User cooldown reset`, 'green');
    return true;
}

// =============================================================================
// Main
// =============================================================================

async function main() {
    const args = parseArgs();

    if (!args.groupId && !args.userEmail) {
        log('Usage: npx tsx scripts/testing/reset-e2e-cooldowns.ts [options]', 'cyan');
        log('');
        log('Options:', 'cyan');
        log('  --group-id <id>        Reset group-level cooldown');
        log('  --user-email <email>   Reset user-level cooldown (requires --group-id)');
        log('  --execute              Actually write changes (default is dry-run)');
        log('');
        log('Examples:', 'cyan');
        log('  npx tsx scripts/testing/reset-e2e-cooldowns.ts --group-id abc123 --execute');
        log('  npx tsx scripts/testing/reset-e2e-cooldowns.ts --group-id abc123 --user-email bob@boletapp.test --execute');
        process.exit(0);
    }

    if (args.userEmail && !args.groupId) {
        log('--user-email requires --group-id (user cooldowns are per-group)', 'red');
        process.exit(1);
    }

    const mode = args.execute ? 'EXECUTE' : 'DRY RUN';
    log(`\n[${mode}] Reset E2E Cooldowns (staging)`, 'cyan');
    log('='.repeat(50), 'cyan');

    const { db, auth } = initAdmin();

    let success = true;

    // Reset group-level cooldown
    if (args.groupId) {
        log(`\nGroup cooldown: ${args.groupId}`, 'cyan');
        const ok = await resetGroupCooldown(db, args.groupId, !args.execute);
        if (!ok) success = false;
    }

    // Reset user-level cooldown
    if (args.userEmail && args.groupId) {
        log(`\nUser cooldown: ${args.userEmail} (group: ${args.groupId})`, 'cyan');
        const ok = await resetUserCooldown(db, auth, args.userEmail, args.groupId, !args.execute);
        if (!ok) success = false;
    }

    if (!args.execute) {
        log('\n[DRY RUN] No changes written. Add --execute to apply.', 'yellow');
    }

    if (success) {
        log('\nDone.', 'green');
    } else {
        log('\nCompleted with errors.', 'red');
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        log(`\nFatal error: ${error instanceof Error ? error.message : String(error)}`, 'red');
        console.error(error);
        process.exit(1);
    });
