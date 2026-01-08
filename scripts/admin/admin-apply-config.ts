/**
 * Admin Script: Apply User Configuration from YAML File
 *
 * Reads a YAML configuration file and applies credit/subscription changes
 * to multiple users in batch.
 *
 * USAGE:
 *   npx tsx scripts/admin-apply-config.ts <config-file.yaml>
 *   npx tsx scripts/admin-apply-config.ts <config-file.yaml> --dry-run
 *
 * OPTIONS:
 *   --dry-run    Preview changes without applying them
 *   --verbose    Show detailed output for each operation
 *
 * EXAMPLES:
 *   npx tsx scripts/admin-apply-config.ts promo-credits.yaml
 *   npx tsx scripts/admin-apply-config.ts promo-credits.yaml --dry-run
 *
 * CONFIG FILE FORMAT: See admin-user-config.example.yaml
 *
 * ENVIRONMENT:
 *   FIREBASE_PROJECT_ID  Target project (default: boletapp-prod)
 *   BOLETAPP_APP_ID      App ID (default: boletapp)
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'fs';
import { parse as parseYaml } from 'yaml';
import { parseArgs } from 'node:util';

// Types
interface CreditConfig {
    mode: 'set' | 'add';
    normal?: number;
    super?: number;
}

interface SubscriptionConfig {
    tier: 'free' | 'basic' | 'pro' | 'max';
    days?: number;
    reason?: string;
}

interface UserConfig {
    email: string;
    credits?: CreditConfig;
    subscription?: SubscriptionConfig;
}

interface ConfigFile {
    users: UserConfig[];
    metadata?: {
        admin?: string;
        ticket?: string;
        campaign?: string;
        notes?: string;
    };
}

interface OperationResult {
    email: string;
    userId?: string;
    success: boolean;
    creditsApplied: boolean;
    subscriptionApplied: boolean;
    error?: string;
    details: string[];
}

// Default credits
const DEFAULT_CREDITS = {
    remaining: 1200,
    used: 0,
    superRemaining: 100,
    superUsed: 0,
};

// Initialize Firebase Admin
function initFirebase() {
    if (getApps().length > 0) {
        return { db: getFirestore(), auth: getAuth() };
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || 'boletapp-prod';

    try {
        initializeApp({ projectId });
    } catch (error) {
        console.error('\n❌ Failed to initialize Firebase Admin SDK.');
        console.error('Make sure you have set up authentication:');
        console.error('  - Set GOOGLE_APPLICATION_CREDENTIALS to a service account key file, OR');
        console.error('  - Run: gcloud auth application-default login\n');
        process.exit(1);
    }

    return { db: getFirestore(), auth: getAuth() };
}

// Get userId from email
async function getUserIdByEmail(auth: ReturnType<typeof getAuth>, email: string): Promise<string | null> {
    try {
        const user = await auth.getUserByEmail(email);
        return user.uid;
    } catch (error: any) {
        if (error.code === 'auth/user-not-found') {
            return null;
        }
        throw error;
    }
}

// Get current credits
async function getCurrentCredits(db: FirebaseFirestore.Firestore, appId: string, userId: string) {
    const docRef = db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('credits').doc('balance');
    const doc = await docRef.get();

    if (!doc.exists) {
        return { ...DEFAULT_CREDITS };
    }

    const data = doc.data()!;
    return {
        remaining: data.remaining ?? DEFAULT_CREDITS.remaining,
        used: data.used ?? 0,
        superRemaining: data.superRemaining ?? DEFAULT_CREDITS.superRemaining,
        superUsed: data.superUsed ?? 0,
    };
}

// Apply credits
async function applyCredits(
    db: FirebaseFirestore.Firestore,
    appId: string,
    userId: string,
    config: CreditConfig,
    dryRun: boolean
): Promise<{ success: boolean; details: string[] }> {
    const details: string[] = [];

    try {
        const current = await getCurrentCredits(db, appId, userId);
        const updates: Record<string, unknown> = { updatedAt: Timestamp.now() };

        if (config.mode === 'set') {
            if (config.normal !== undefined) {
                updates.remaining = config.normal;
                details.push(`Normal credits: ${current.remaining} → ${config.normal}`);
            }
            if (config.super !== undefined) {
                updates.superRemaining = config.super;
                details.push(`Super credits: ${current.superRemaining} → ${config.super}`);
            }
        } else if (config.mode === 'add') {
            if (config.normal !== undefined) {
                const newValue = current.remaining + config.normal;
                updates.remaining = newValue;
                details.push(`Normal credits: ${current.remaining} + ${config.normal} = ${newValue}`);
            }
            if (config.super !== undefined) {
                const newValue = current.superRemaining + config.super;
                updates.superRemaining = newValue;
                details.push(`Super credits: ${current.superRemaining} + ${config.super} = ${newValue}`);
            }
        }

        if (!dryRun && Object.keys(updates).length > 1) {
            const docRef = db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('credits').doc('balance');
            await docRef.set(updates, { merge: true });
        }

        return { success: true, details };
    } catch (error: any) {
        return { success: false, details: [`Error: ${error.message}`] };
    }
}

// Apply subscription
async function applySubscription(
    db: FirebaseFirestore.Firestore,
    appId: string,
    userId: string,
    config: SubscriptionConfig,
    metadata: ConfigFile['metadata'],
    dryRun: boolean
): Promise<{ success: boolean; details: string[] }> {
    const details: string[] = [];

    try {
        const updates: Record<string, unknown> = {
            tier: config.tier,
            startDate: Timestamp.now(),
            paymentProvider: 'admin_config',
            updatedAt: Timestamp.now(),
        };

        if (config.days) {
            const endDate = new Date(Date.now() + config.days * 24 * 60 * 60 * 1000);
            updates.endDate = Timestamp.fromDate(endDate);
            details.push(`Subscription: ${config.tier.toUpperCase()} for ${config.days} days (until ${endDate.toISOString().split('T')[0]})`);
        } else if (config.tier === 'free') {
            updates.endDate = Timestamp.now(); // Expired
            details.push(`Subscription: Revoked (set to FREE)`);
        } else {
            details.push(`Subscription: ${config.tier.toUpperCase()} (lifetime)`);
        }

        if (config.reason) {
            updates.grantReason = config.reason;
        }
        if (metadata?.admin) {
            updates.grantedBy = metadata.admin;
        }
        if (metadata?.ticket) {
            updates.grantReason = `${updates.grantReason || ''} [${metadata.ticket}]`.trim();
        }

        if (!dryRun) {
            const docRef = db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('subscription').doc('current');
            await docRef.set(updates, { merge: true });
        }

        return { success: true, details };
    } catch (error: any) {
        return { success: false, details: [`Error: ${error.message}`] };
    }
}

// Process a single user
async function processUser(
    db: FirebaseFirestore.Firestore,
    auth: ReturnType<typeof getAuth>,
    appId: string,
    userConfig: UserConfig,
    metadata: ConfigFile['metadata'],
    dryRun: boolean
): Promise<OperationResult> {
    const result: OperationResult = {
        email: userConfig.email,
        success: true,
        creditsApplied: false,
        subscriptionApplied: false,
        details: [],
    };

    // Get userId from email
    const userId = await getUserIdByEmail(auth, userConfig.email);
    if (!userId) {
        result.success = false;
        result.error = 'User not found';
        return result;
    }
    result.userId = userId;

    // Apply credits if configured
    if (userConfig.credits) {
        const creditsResult = await applyCredits(db, appId, userId, userConfig.credits, dryRun);
        result.creditsApplied = creditsResult.success;
        result.details.push(...creditsResult.details);
        if (!creditsResult.success) {
            result.success = false;
        }
    }

    // Apply subscription if configured
    if (userConfig.subscription) {
        const subResult = await applySubscription(db, appId, userId, userConfig.subscription, metadata, dryRun);
        result.subscriptionApplied = subResult.success;
        result.details.push(...subResult.details);
        if (!subResult.success) {
            result.success = false;
        }
    }

    return result;
}

// Print results summary
function printResults(results: OperationResult[], dryRun: boolean) {
    const succeeded = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    console.log('\n' + '='.repeat(70));
    console.log(dryRun ? '📋 DRY RUN RESULTS' : '✅ EXECUTION RESULTS');
    console.log('='.repeat(70));

    // Success summary
    if (succeeded.length > 0) {
        console.log(`\n✅ Successful: ${succeeded.length}`);
        for (const r of succeeded) {
            console.log(`\n  📧 ${r.email}`);
            if (r.userId) console.log(`     User ID: ${r.userId}`);
            for (const detail of r.details) {
                console.log(`     • ${detail}`);
            }
        }
    }

    // Failure summary
    if (failed.length > 0) {
        console.log(`\n❌ Failed: ${failed.length}`);
        for (const r of failed) {
            console.log(`\n  📧 ${r.email}`);
            console.log(`     Error: ${r.error || 'Unknown error'}`);
            for (const detail of r.details) {
                console.log(`     • ${detail}`);
            }
        }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`Total: ${results.length} | Success: ${succeeded.length} | Failed: ${failed.length}`);
    console.log('='.repeat(70) + '\n');
}

// Main function
async function main() {
    const { values, positionals } = parseArgs({
        args: process.argv.slice(2),
        options: {
            'dry-run': { type: 'boolean', default: false },
            'verbose': { type: 'boolean', default: false },
        },
        allowPositionals: true,
    });

    const configPath = positionals[0];
    const dryRun = values['dry-run'] || false;

    if (!configPath) {
        console.log(`
Admin Script: Apply User Configuration

USAGE:
  npx tsx scripts/admin-apply-config.ts <config-file.yaml>
  npx tsx scripts/admin-apply-config.ts <config-file.yaml> --dry-run

OPTIONS:
  --dry-run    Preview changes without applying them
  --verbose    Show detailed output

EXAMPLE:
  npx tsx scripts/admin-apply-config.ts promo-credits.yaml --dry-run

See admin-user-config.example.yaml for configuration file format.
`);
        process.exit(1);
    }

    // Load config file
    let config: ConfigFile;
    try {
        const content = readFileSync(configPath, 'utf-8');
        config = parseYaml(content) as ConfigFile;
    } catch (error: any) {
        console.error(`\n❌ Failed to load config file: ${configPath}`);
        console.error(`   ${error.message}\n`);
        process.exit(1);
    }

    // Validate config
    if (!config.users || !Array.isArray(config.users) || config.users.length === 0) {
        console.error('\n❌ Config file must contain a "users" array with at least one entry.\n');
        process.exit(1);
    }

    // Initialize Firebase
    const { db, auth } = initFirebase();
    // Note: appId should match FIREBASE_PROJECT_ID (used in Firestore paths)
    const appId = process.env.BOLETAPP_APP_ID || process.env.FIREBASE_PROJECT_ID || 'boletapp-d609f';

    console.log('\n' + '='.repeat(70));
    console.log('🔧 Admin Configuration Processor');
    console.log('='.repeat(70));
    console.log(`Project:     ${process.env.FIREBASE_PROJECT_ID || 'boletapp-prod'}`);
    console.log(`App ID:      ${appId}`);
    console.log(`Config File: ${configPath}`);
    console.log(`Mode:        ${dryRun ? '🔍 DRY RUN (no changes)' : '⚡ LIVE (applying changes)'}`);
    console.log(`Users:       ${config.users.length}`);

    if (config.metadata) {
        console.log('\nMetadata:');
        if (config.metadata.admin) console.log(`  Admin:    ${config.metadata.admin}`);
        if (config.metadata.ticket) console.log(`  Ticket:   ${config.metadata.ticket}`);
        if (config.metadata.campaign) console.log(`  Campaign: ${config.metadata.campaign}`);
        if (config.metadata.notes) console.log(`  Notes:    ${config.metadata.notes}`);
    }
    console.log('='.repeat(70));

    // Process all users
    console.log('\nProcessing users...\n');
    const results: OperationResult[] = [];

    for (let i = 0; i < config.users.length; i++) {
        const userConfig = config.users[i];
        process.stdout.write(`  [${i + 1}/${config.users.length}] ${userConfig.email}... `);

        try {
            const result = await processUser(db, auth, appId, userConfig, config.metadata, dryRun);
            results.push(result);
            console.log(result.success ? '✅' : '❌');
        } catch (error: any) {
            results.push({
                email: userConfig.email,
                success: false,
                creditsApplied: false,
                subscriptionApplied: false,
                error: error.message,
                details: [],
            });
            console.log('❌');
        }
    }

    // Print results
    printResults(results, dryRun);

    // Exit with appropriate code
    const anyFailed = results.some(r => !r.success);
    process.exit(anyFailed ? 1 : 0);
}

main().catch((error) => {
    console.error('\n❌ Unexpected error:', error.message);
    process.exit(1);
});
