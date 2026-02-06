/**
 * Export Transaction Data from Production Firestore
 *
 * Run with: npx tsx scripts/export-transactions.ts
 *
 * Prerequisites:
 * - .env has VITE_E2E_MODE=production
 * - Dev server running (npm run dev)
 *
 * This script authenticates via the Firebase REST API and fetches
 * transaction data for creating test mockups.
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || '';
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || 'boletapp-d609f';

// Allow override via CLI args: npx tsx scripts/export-transactions.ts email@example.com password123
const USER_EMAIL = process.argv[2] || process.env.VITE_PROD_TEST_USER_EMAIL || '';
const USER_PASSWORD = process.argv[3] || process.env.VITE_PROD_TEST_USER_PASSWORD || '';

interface AuthResponse {
  idToken: string;
  localId: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
}

interface FirestoreDocument {
  name: string;
  fields: Record<string, any>;
  createTime: string;
  updateTime: string;
}

interface FirestoreListResponse {
  documents?: FirestoreDocument[];
  nextPageToken?: string;
}

async function signIn(): Promise<AuthResponse> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: USER_EMAIL,
        password: USER_PASSWORD,
        returnSecureToken: true,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Auth failed: ${JSON.stringify(error)}`);
  }

  return response.json();
}

async function fetchTransactions(idToken: string, userId: string, limit = 10): Promise<any[]> {
  // Use Firestore REST API to list documents
  const collectionPath = `artifacts/${PROJECT_ID}/users/${userId}/transactions`;
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionPath}?pageSize=${limit}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Firestore fetch failed: ${error}`);
  }

  const data: FirestoreListResponse = await response.json();

  if (!data.documents) {
    console.log('No documents found');
    return [];
  }

  // Convert Firestore document format to plain objects
  return data.documents.map(doc => {
    const id = doc.name.split('/').pop();
    const fields = convertFirestoreFields(doc.fields);
    return { id, ...fields };
  });
}

function convertFirestoreFields(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  for (const [key, value] of Object.entries(fields)) {
    result[key] = convertFirestoreValue(value);
  }

  return result;
}

function convertFirestoreValue(value: any): any {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return parseInt(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.nullValue !== undefined) return null;
  if (value.arrayValue !== undefined) {
    return (value.arrayValue.values || []).map(convertFirestoreValue);
  }
  if (value.mapValue !== undefined) {
    return convertFirestoreFields(value.mapValue.fields || {});
  }
  return value;
}

async function main() {
  console.log('🔐 Signing in to Firebase...');

  if (!USER_EMAIL || !USER_PASSWORD) {
    console.error('❌ Missing credentials. Set VITE_PROD_TEST_USER_EMAIL and VITE_PROD_TEST_USER_PASSWORD in .env');
    process.exit(1);
  }

  const auth = await signIn();
  console.log(`✅ Signed in as: ${auth.email} (uid: ${auth.localId})`);

  console.log('\n📊 Fetching transactions...');
  const transactions = await fetchTransactions(auth.idToken, auth.localId, 10);

  if (transactions.length === 0) {
    console.log('ℹ️ No transactions found for this user.');
    console.log('   You may need to use a different account with transaction data.');
    process.exit(0);
  }

  console.log(`✅ Found ${transactions.length} transactions`);

  // Save to a test fixtures file
  const outputDir = path.join(process.cwd(), 'tests', 'fixtures');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'sample-transactions.json');
  fs.writeFileSync(outputPath, JSON.stringify(transactions, null, 2));

  console.log(`\n💾 Saved ${transactions.length} transactions to: ${outputPath}`);

  // Also print a summary
  console.log('\n📋 Transaction Summary:');
  transactions.forEach((tx, i) => {
    console.log(`   ${i + 1}. ${tx.merchant} - ${tx.total} ${tx.currency || ''} (${tx.date})`);
  });
}

main().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
