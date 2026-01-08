/**
 * Admin Script: User Credits Management
 *
 * Allows admins to view and modify user credits directly in Firestore.
 *
 * USAGE:
 *   npx tsx scripts/admin-user-credits.ts <command> <userId> [options]
 *
 * COMMANDS:
 *   get <userId>                    - View user's current credits
 *   set <userId> --credits <n>      - Set normal credits remaining
 *   set <userId> --super <n>        - Set super credits remaining
 *   add <userId> --credits <n>      - Add normal credits
 *   add <userId> --super <n>        - Add super credits
 *   reset <userId>                  - Reset to default credits (1200 normal, 100 super)
 *
 * EXAMPLES:
 *   npx tsx scripts/admin-user-credits.ts get abc123
 *   npx tsx scripts/admin-user-credits.ts set abc123 --credits 500
 *   npx tsx scripts/admin-user-credits.ts set abc123 --super 50
 *   npx tsx scripts/admin-user-credits.ts add abc123 --credits 100 --super 10
 *   npx tsx scripts/admin-user-credits.ts reset abc123
 *
 * ENVIRONMENT:
 *   Set FIREBASE_PROJECT_ID to target a specific project (default: boletapp-prod)
 *   Set BOLETAPP_APP_ID for the app ID (default: from environment or 'boletapp')
 *
 * FIRESTORE PATH:
 *   artifacts/{appId}/users/{userId}/credits/balance
 *
 * DOCUMENT STRUCTURE:
 *   {
 *     remaining: number,       // Normal credits available
 *     used: number,            // Normal credits used (lifetime)
 *     superRemaining: number,  // Super credits available
 *     superUsed: number,       // Super credits used (lifetime)
 *     updatedAt: Timestamp,    // Last modification time
 *     createdAt: Timestamp     // When user was first created
 *   }
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { parseArgs } from 'node:util';

// Default values
const DEFAULT_CREDITS = {
    remaining: 1200,
    used: 0,
    superRemaining: 100,
    superUsed: 0,
};

// Initialize Firebase Admin
function initFirebase() {
    if (getApps().length > 0) {
        return getFirestore();
    }

    const projectId = process.env.FIREBASE_PROJECT_ID || 'boletapp-prod';

    // Try to use service account from environment or default credentials
    try {
        initializeApp({
            projectId,
            // Uses GOOGLE_APPLICATION_CREDENTIALS if set, otherwise ADC
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

// Get the credits document reference
function getCreditsDocRef(db: FirebaseFirestore.Firestore, appId: string, userId: string) {
    return db.collection('artifacts').doc(appId).collection('users').doc(userId).collection('credits').doc('balance');
}

// Get user credits
async function getUserCredits(db: FirebaseFirestore.Firestore, appId: string, userId: string) {
    const docRef = getCreditsDocRef(db, appId, userId);
    const doc = await docRef.get();

    if (!doc.exists) {
        return null;
    }

    return doc.data();
}

// Set user credits
async function setUserCredits(
    db: FirebaseFirestore.Firestore,
    appId: string,
    userId: string,
    credits: Partial<typeof DEFAULT_CREDITS>
) {
    const docRef = getCreditsDocRef(db, appId, userId);
    const existingDoc = await docRef.get();

    const updateData: Record<string, unknown> = {
        ...credits,
        updatedAt: Timestamp.now(),
    };

    if (!existingDoc.exists) {
        updateData.createdAt = Timestamp.now();
        // Merge with defaults for new documents
        updateData.remaining = credits.remaining ?? DEFAULT_CREDITS.remaining;
        updateData.used = credits.used ?? DEFAULT_CREDITS.used;
        updateData.superRemaining = credits.superRemaining ?? DEFAULT_CREDITS.superRemaining;
        updateData.superUsed = credits.superUsed ?? DEFAULT_CREDITS.superUsed;
    }

    await docRef.set(updateData, { merge: true });
    return await docRef.get();
}

// Print credits in a nice format
function printCredits(userId: string, data: Record<string, unknown> | null) {
    console.log('\n===========================================');
    console.log(`User ID: ${userId}`);
    console.log('===========================================');

    if (!data) {
        console.log('Status: No credits document found (new user)');
        console.log('\nDefault credits would be applied on first load:');
        console.log(`  Normal Credits: ${DEFAULT_CREDITS.remaining}`);
        console.log(`  Super Credits:  ${DEFAULT_CREDITS.superRemaining}`);
    } else {
        console.log('\nNormal Credits:');
        console.log(`  Remaining: ${data.remaining ?? 'N/A'}`);
        console.log(`  Used:      ${data.used ?? 0}`);

        console.log('\nSuper Credits:');
        console.log(`  Remaining: ${data.superRemaining ?? 'N/A'}`);
        console.log(`  Used:      ${data.superUsed ?? 0}`);

        if (data.updatedAt) {
            const updatedAt = data.updatedAt as Timestamp;
            console.log(`\nLast Updated: ${updatedAt.toDate().toISOString()}`);
        }
        if (data.createdAt) {
            const createdAt = data.createdAt as Timestamp;
            console.log(`Created:      ${createdAt.toDate().toISOString()}`);
        }
    }

    console.log('===========================================\n');
}

// Main function
async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.log(`
Admin Script: User Credits Management

USAGE:
  npx tsx scripts/admin-user-credits.ts <command> <userId> [options]

COMMANDS:
  get <userId>                    View user's current credits
  set <userId> --credits <n>      Set normal credits remaining
  set <userId> --super <n>        Set super credits remaining
  add <userId> --credits <n>      Add normal credits
  add <userId> --super <n>        Add super credits
  reset <userId>                  Reset to default credits

OPTIONS:
  --credits <n>    Normal credits value
  --super <n>      Super credits value
  --used <n>       Set used count (for set command)
  --super-used <n> Set super used count (for set command)

EXAMPLES:
  npx tsx scripts/admin-user-credits.ts get abc123
  npx tsx scripts/admin-user-credits.ts set abc123 --credits 500
  npx tsx scripts/admin-user-credits.ts add abc123 --credits 100 --super 10
  npx tsx scripts/admin-user-credits.ts reset abc123

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
            credits: { type: 'string' },
            super: { type: 'string' },
            used: { type: 'string' },
            'super-used': { type: 'string' },
        },
        allowPositionals: true,
    });

    const db = initFirebase();

    console.log(`\nProject: ${process.env.FIREBASE_PROJECT_ID || 'boletapp-prod'}`);
    console.log(`App ID: ${appId}`);
    console.log(`Command: ${command}`);

    switch (command) {
        case 'get': {
            const credits = await getUserCredits(db, appId, userId);
            printCredits(userId, credits);
            break;
        }

        case 'set': {
            const updates: Partial<typeof DEFAULT_CREDITS> = {};

            if (values.credits !== undefined) {
                updates.remaining = parseInt(values.credits, 10);
            }
            if (values.super !== undefined) {
                updates.superRemaining = parseInt(values.super, 10);
            }
            if (values.used !== undefined) {
                updates.used = parseInt(values.used, 10);
            }
            if (values['super-used'] !== undefined) {
                updates.superUsed = parseInt(values['super-used'], 10);
            }

            if (Object.keys(updates).length === 0) {
                console.error('Error: No values to set. Use --credits and/or --super');
                process.exit(1);
            }

            console.log('\nSetting credits...');
            console.log('Updates:', updates);

            const result = await setUserCredits(db, appId, userId, updates);
            printCredits(userId, result.data() || null);
            console.log('Credits updated successfully!');
            break;
        }

        case 'add': {
            // First get current credits
            const current = await getUserCredits(db, appId, userId);
            const currentData = current || {
                remaining: DEFAULT_CREDITS.remaining,
                used: 0,
                superRemaining: DEFAULT_CREDITS.superRemaining,
                superUsed: 0,
            };

            const updates: Partial<typeof DEFAULT_CREDITS> = {};

            if (values.credits !== undefined) {
                const addAmount = parseInt(values.credits, 10);
                updates.remaining = (currentData.remaining as number) + addAmount;
                console.log(`Adding ${addAmount} normal credits`);
            }
            if (values.super !== undefined) {
                const addAmount = parseInt(values.super, 10);
                updates.superRemaining = (currentData.superRemaining as number) + addAmount;
                console.log(`Adding ${addAmount} super credits`);
            }

            if (Object.keys(updates).length === 0) {
                console.error('Error: No values to add. Use --credits and/or --super');
                process.exit(1);
            }

            const result = await setUserCredits(db, appId, userId, updates);
            printCredits(userId, result.data() || null);
            console.log('Credits added successfully!');
            break;
        }

        case 'reset': {
            console.log('\nResetting to default credits...');
            const result = await setUserCredits(db, appId, userId, {
                remaining: DEFAULT_CREDITS.remaining,
                used: 0,
                superRemaining: DEFAULT_CREDITS.superRemaining,
                superUsed: 0,
            });
            printCredits(userId, result.data() || null);
            console.log('Credits reset to defaults!');
            break;
        }

        default:
            console.error(`Unknown command: ${command}`);
            console.error('Valid commands: get, set, add, reset');
            process.exit(1);
    }

    process.exit(0);
}

main().catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
});
