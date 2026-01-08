/**
 * Admin Script: User Subscription Management
 *
 * Allows admins to view and modify user subscriptions directly in Firestore.
 *
 * USAGE:
 *   npx tsx scripts/admin-user-subscription.ts <command> <userId> [options]
 *
 * COMMANDS:
 *   get <userId>                        - View user's current subscription
 *   set <userId> --tier <tier>          - Set subscription tier
 *   set <userId> --expires <date>       - Set expiration date (YYYY-MM-DD)
 *   grant <userId> --tier <tier>        - Grant subscription for 30 days
 *   grant <userId> --tier <tier> --days <n>  - Grant subscription for N days
 *   revoke <userId>                     - Revoke subscription (set to free)
 *   list-premium                        - List all users with paid subscriptions
 *
 * TIERS:
 *   free      - Free tier (no paid features)
 *   basic     - Basic tier ($2-3/mo, 30 scans, 12mo retention)
 *   pro       - Pro tier ($4-5/mo, 300 scans, 12mo retention)
 *   max       - Max tier ($10/mo, 900 scans, 24mo retention)
 *
 * EXAMPLES:
 *   npx tsx scripts/admin-user-subscription.ts get abc123
 *   npx tsx scripts/admin-user-subscription.ts set abc123 --tier pro
 *   npx tsx scripts/admin-user-subscription.ts grant abc123 --tier pro --days 30
 *   npx tsx scripts/admin-user-subscription.ts revoke abc123
 *   npx tsx scripts/admin-user-subscription.ts list-premium
 *
 * ENVIRONMENT:
 *   Set FIREBASE_PROJECT_ID to target a specific project (default: boletapp-prod)
 *   Set BOLETAPP_APP_ID for the app ID (default: boletapp)
 *
 * FIRESTORE PATH:
 *   artifacts/{appId}/users/{userId}/subscription/current
 *
 * DOCUMENT STRUCTURE:
 *   {
 *     tier: 'free' | 'basic' | 'pro' | 'max',
 *     startDate: Timestamp,       // When current subscription started
 *     endDate: Timestamp | null,  // When subscription expires (null = never for free)
 *     paymentProvider: string | null,  // 'mercado_pago', 'admin_grant', etc.
 *     subscriptionId: string | null,   // External payment provider ID
 *     grantedBy: string | null,        // Admin who granted (for manual grants)
 *     grantReason: string | null,      // Reason for manual grant
 *     updatedAt: Timestamp,
 *     createdAt: Timestamp
 *   }
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { parseArgs } from 'node:util';

// Subscription tiers
type SubscriptionTier = 'free' | 'basic' | 'pro' | 'max';

const TIER_INFO: Record<SubscriptionTier, { name: string; scans: number | 'unlimited'; retention: string }> = {
    free: { name: 'Free', scans: 30, retention: '2 months' },
    basic: { name: 'Basic', scans: 30, retention: '12 months' },
    pro: { name: 'Pro', scans: 300, retention: '12 months' },
    max: { name: 'Max', scans: 900, retention: '24 months' },
};

// Initialize Firebase Admin
function initFirebase() {
    if (getApps().length > 0) {
        return getFirestore();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || 'boletapp-prod';

    try {
        initializeApp({
            projectId,
        });
    } catch (error) {
        console.error('Failed to initialize Firebase Admin SDK.');
        console.error('Make sure you have set up authentication:');
        console.error('  - Set GOOGLE_APPLICATION_CREDENTIALS to a service account key file, OR');
        console.error('  - Run: gcloud auth application-default login');
        process.exit(1);
    }

    return getFirestore();
}

// Get the subscription document reference
function getSubscriptionDocRef(db: FirebaseFirestore.Firestore, appId: string, userId: string) {
    return db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('subscription').doc('current');
}

// Get user subscription
async function getUserSubscription(db: FirebaseFirestore.Firestore, appId: string, userId: string) {
    const docRef = getSubscriptionDocRef(db, appId, userId);
    const doc = await docRef.get();

    if (!doc.exists) {
        return null;
    }

    return doc.data();
}

// Set user subscription
async function setUserSubscription(
    db: FirebaseFirestore.Firestore,
    appId: string,
    userId: string,
    subscription: Record<string, unknown>
) {
    const docRef = getSubscriptionDocRef(db, appId, userId);
    const existingDoc = await docRef.get();

    const updateData: Record<string, unknown> = {
        ...subscription,
        updatedAt: Timestamp.now(),
    };

    if (!existingDoc.exists) {
        updateData.createdAt = Timestamp.now();
    }

    await docRef.set(updateData, { merge: true });
    return await docRef.get();
}

// Print subscription in a nice format
function printSubscription(userId: string, data: Record<string, unknown> | null) {
    console.log('\n===========================================');
    console.log(`User ID: ${userId}`);
    console.log('===========================================');

    if (!data) {
        console.log('Status: No subscription document found');
        console.log('Effective Tier: free (default)');
        console.log('\nTier Details:');
        console.log(`  Scans/Month: ${TIER_INFO.free.scans}`);
        console.log(`  Retention:   ${TIER_INFO.free.retention}`);
    } else {
        const tier = (data.tier as SubscriptionTier) || 'free';
        const tierInfo = TIER_INFO[tier] || TIER_INFO.free;

        console.log(`\nCurrent Tier: ${tierInfo.name.toUpperCase()}`);
        console.log(`  Scans/Month: ${tierInfo.scans}`);
        console.log(`  Retention:   ${tierInfo.retention}`);

        if (data.startDate) {
            const startDate = data.startDate as Timestamp;
            console.log(`\nSubscription Started: ${startDate.toDate().toISOString()}`);
        }

        if (data.endDate) {
            const endDate = data.endDate as Timestamp;
            const now = new Date();
            const end = endDate.toDate();
            const isExpired = end < now;
            const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            console.log(`Expires: ${end.toISOString()}`);
            if (isExpired) {
                console.log(`Status: EXPIRED (${Math.abs(daysRemaining)} days ago)`);
            } else {
                console.log(`Status: ACTIVE (${daysRemaining} days remaining)`);
            }
        } else if (tier !== 'free') {
            console.log('Expires: Never (lifetime access)');
        }

        if (data.paymentProvider) {
            console.log(`\nPayment Provider: ${data.paymentProvider}`);
        }
        if (data.subscriptionId) {
            console.log(`Subscription ID: ${data.subscriptionId}`);
        }
        if (data.grantedBy) {
            console.log(`\nGranted By: ${data.grantedBy}`);
        }
        if (data.grantReason) {
            console.log(`Grant Reason: ${data.grantReason}`);
        }

        if (data.updatedAt) {
            const updatedAt = data.updatedAt as Timestamp;
            console.log(`\nLast Updated: ${updatedAt.toDate().toISOString()}`);
        }
    }

    console.log('===========================================\n');
}

// Validate tier
function validateTier(tier: string): SubscriptionTier {
    if (!['free', 'basic', 'pro', 'max'].includes(tier)) {
        console.error(`Invalid tier: ${tier}`);
        console.error('Valid tiers: free, basic, pro, max');
        process.exit(1);
    }
    return tier as SubscriptionTier;
}

// Parse date string to Timestamp
function parseDate(dateStr: string): Timestamp {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
        console.error(`Invalid date format: ${dateStr}`);
        console.error('Use YYYY-MM-DD format (e.g., 2025-12-31)');
        process.exit(1);
    }
    return Timestamp.fromDate(date);
}

// Main function
async function main() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
        console.log(`
Admin Script: User Subscription Management

USAGE:
  npx tsx scripts/admin-user-subscription.ts <command> <userId> [options]

COMMANDS:
  get <userId>                   View user's current subscription
  set <userId> --tier <tier>     Set subscription tier
  grant <userId> --tier <tier>   Grant subscription for 30 days
  revoke <userId>                Revoke subscription (set to free)
  list-premium                   List all premium subscribers

OPTIONS:
  --tier <tier>      Subscription tier (free, basic, pro, max)
  --expires <date>   Expiration date (YYYY-MM-DD)
  --days <n>         Days to grant (default: 30)
  --reason <text>    Reason for grant/revoke
  --admin <name>     Admin name for audit trail

EXAMPLES:
  npx tsx scripts/admin-user-subscription.ts get abc123
  npx tsx scripts/admin-user-subscription.ts set abc123 --tier pro --expires 2025-12-31
  npx tsx scripts/admin-user-subscription.ts grant abc123 --tier max --days 90 --reason "Beta tester"
  npx tsx scripts/admin-user-subscription.ts revoke abc123 --reason "Payment failed"
  npx tsx scripts/admin-user-subscription.ts list-premium

TIERS:
  free     Free tier (30 scans/mo, 2mo retention)
  basic    Basic tier (30 scans/mo, 12mo retention)
  pro      Pro tier (300 scans/mo, 12mo retention)
  max      Max tier (900 scans/mo, 24mo retention)

ENVIRONMENT:
  FIREBASE_PROJECT_ID  Target project (default: boletapp-prod)
  BOLETAPP_APP_ID      App ID (default: boletapp)
`);
        process.exit(1);
    }

    const command = args[0];
    const userId = args[1];
    // Note: appId should match FIREBASE_PROJECT_ID (used in Firestore paths)
    const appId = process.env.BOLETAPP_APP_ID || process.env.FIREBASE_PROJECT_ID || 'boletapp-d609f';

    // Parse options
    const { values } = parseArgs({
        args: args.slice(2),
        options: {
            tier: { type: 'string' },
            expires: { type: 'string' },
            days: { type: 'string' },
            reason: { type: 'string' },
            admin: { type: 'string' },
        },
        allowPositionals: true,
    });

    const db = initFirebase();

    console.log(`\nProject: ${process.env.FIREBASE_PROJECT_ID || 'boletapp-prod'}`);
    console.log(`App ID: ${appId}`);
    console.log(`Command: ${command}`);

    switch (command) {
        case 'get': {
            if (!userId) {
                console.error('Error: userId required');
                process.exit(1);
            }
            const subscription = await getUserSubscription(db, appId, userId);
            printSubscription(userId, subscription);
            break;
        }

        case 'set': {
            if (!userId) {
                console.error('Error: userId required');
                process.exit(1);
            }

            const updates: Record<string, unknown> = {};

            if (values.tier) {
                updates.tier = validateTier(values.tier);
            }
            if (values.expires) {
                updates.endDate = parseDate(values.expires);
            }

            if (Object.keys(updates).length === 0) {
                console.error('Error: No values to set. Use --tier and/or --expires');
                process.exit(1);
            }

            updates.paymentProvider = 'admin_manual';
            if (values.admin) {
                updates.grantedBy = values.admin;
            }
            if (values.reason) {
                updates.grantReason = values.reason;
            }

            console.log('\nSetting subscription...');
            console.log('Updates:', updates);

            const result = await setUserSubscription(db, appId, userId, updates);
            printSubscription(userId, result.data() || null);
            console.log('Subscription updated successfully!');
            break;
        }

        case 'grant': {
            if (!userId) {
                console.error('Error: userId required');
                process.exit(1);
            }
            if (!values.tier) {
                console.error('Error: --tier required for grant command');
                process.exit(1);
            }

            const tier = validateTier(values.tier);
            const days = values.days ? parseInt(values.days, 10) : 30;

            const now = new Date();
            const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

            const updates: Record<string, unknown> = {
                tier,
                startDate: Timestamp.now(),
                endDate: Timestamp.fromDate(endDate),
                paymentProvider: 'admin_grant',
                subscriptionId: `admin-grant-${Date.now()}`,
                grantedBy: values.admin || 'admin',
                grantReason: values.reason || `Manual grant for ${days} days`,
            };

            console.log(`\nGranting ${tier.toUpperCase()} subscription for ${days} days...`);

            const result = await setUserSubscription(db, appId, userId, updates);
            printSubscription(userId, result.data() || null);
            console.log('Subscription granted successfully!');
            break;
        }

        case 'revoke': {
            if (!userId) {
                console.error('Error: userId required');
                process.exit(1);
            }

            const updates: Record<string, unknown> = {
                tier: 'free',
                endDate: Timestamp.now(), // Expired immediately
                paymentProvider: 'admin_revoke',
                grantedBy: values.admin || 'admin',
                grantReason: values.reason || 'Manual revocation',
            };

            console.log('\nRevoking subscription...');

            const result = await setUserSubscription(db, appId, userId, updates);
            printSubscription(userId, result.data() || null);
            console.log('Subscription revoked successfully!');
            break;
        }

        case 'list-premium': {
            console.log('\nSearching for premium subscribers...\n');

            const usersRef = db.collection('artifacts').doc(appId).collection('users');
            const usersSnapshot = await usersRef.listDocuments();

            let premiumCount = 0;
            const premiumUsers: Array<{ userId: string; tier: string; endDate?: Date }> = [];

            for (const userDoc of usersSnapshot) {
                const subRef = userDoc.collection('subscription').doc('current');
                const subDoc = await subRef.get();

                if (subDoc.exists) {
                    const data = subDoc.data();
                    if (data && data.tier && data.tier !== 'free') {
                        const endDate = data.endDate ? (data.endDate as Timestamp).toDate() : null;
                        const isActive = !endDate || endDate > new Date();

                        if (isActive) {
                            premiumCount++;
                            premiumUsers.push({
                                userId: userDoc.id,
                                tier: data.tier,
                                endDate: endDate || undefined,
                            });
                        }
                    }
                }
            }

            console.log(`Found ${premiumCount} premium subscribers:\n`);

            if (premiumUsers.length === 0) {
                console.log('  (none)');
            } else {
                for (const user of premiumUsers) {
                    const tierInfo = TIER_INFO[user.tier as SubscriptionTier];
                    const expiresStr = user.endDate ? user.endDate.toISOString().split('T')[0] : 'Never';
                    console.log(`  ${user.userId}: ${tierInfo?.name || user.tier} (expires: ${expiresStr})`);
                }
            }

            console.log('');
            break;
        }

        default:
            console.error(`Unknown command: ${command}`);
            console.error('Valid commands: get, set, grant, revoke, list-premium');
            process.exit(1);
    }

    process.exit(0);
}

main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
});
