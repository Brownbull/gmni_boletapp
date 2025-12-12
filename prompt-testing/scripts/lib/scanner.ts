/**
 * Cloud Function Scanner
 *
 * Calls the analyzeReceipt Cloud Function to scan receipt images.
 * Handles authentication for both local development and CI environments.
 *
 * @see docs/sprint-artifacts/epic8/architecture-epic8.md#Authentication
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getAuth, signInWithEmailAndPassword, Auth, User } from 'firebase/auth';
import { CONFIG } from '../config';

// ============================================================================
// Types
// ============================================================================

/**
 * Result from the Cloud Function analyzeReceipt call.
 * Matches the response structure from functions/src/analyzeReceipt.ts
 */
export interface ScanResult {
  merchant: string;
  date: string;
  time?: string; // 24h format HH:MM, default "04:04" if not found
  total: number;
  currency?: string;
  category: string;
  country?: string | null;
  city?: string | null;
  items: Array<{
    name: string;
    price: number;
    quantity?: number;
    category?: string;
    subcategory?: string;
  }>;
  metadata?: {
    receiptType?: string;
    confidence?: number;
  };
  transactionId: string;
  imageUrls?: string[];
  thumbnailUrl?: string;
}

/**
 * Error from the Cloud Function.
 */
export interface ScanError {
  code: string;
  message: string;
  details?: unknown;
}

// ============================================================================
// Firebase Configuration
// ============================================================================

/**
 * Firebase configuration loaded from environment variables.
 * Uses the same VITE_FIREBASE_* variables as the main app.
 *
 * For test harness, set these in your shell or .env file:
 * - VITE_FIREBASE_API_KEY
 * - VITE_FIREBASE_AUTH_DOMAIN
 * - VITE_FIREBASE_PROJECT_ID
 * - VITE_FIREBASE_STORAGE_BUCKET
 * - VITE_FIREBASE_MESSAGING_SENDER_ID
 * - VITE_FIREBASE_APP_ID
 */
function getFirebaseConfig() {
  const apiKey = process.env.VITE_FIREBASE_API_KEY;
  const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.VITE_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.VITE_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId) {
    throw new Error(
      'Firebase configuration not found in environment variables.\n' +
      'Ensure VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, and VITE_FIREBASE_PROJECT_ID are set.\n' +
      'You can source your .env file: export $(cat .env | xargs)'
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket: storageBucket || `${projectId}.firebasestorage.app`,
    messagingSenderId: messagingSenderId || '',
    appId: appId || '',
  };
}

/**
 * Region where Cloud Functions are deployed.
 */
const FUNCTIONS_REGION = 'us-central1';

// ============================================================================
// Firebase Initialization
// ============================================================================

let firebaseApp: FirebaseApp | null = null;
let auth: Auth | null = null;
let currentUser: User | null = null;

/**
 * Initialize Firebase app (singleton).
 */
function getFirebaseApp(): FirebaseApp {
  if (!firebaseApp) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0];
    } else {
      firebaseApp = initializeApp(getFirebaseConfig());
    }
  }
  return firebaseApp;
}

/**
 * Get Firebase Auth instance.
 */
function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}

// ============================================================================
// Authentication
// ============================================================================

/**
 * Sign in with test user credentials.
 *
 * For local development, uses test user credentials from environment.
 * For CI, uses service account (GOOGLE_APPLICATION_CREDENTIALS).
 *
 * @throws Error if authentication fails
 */
export async function authenticateUser(): Promise<User> {
  if (currentUser) {
    return currentUser;
  }

  const auth = getFirebaseAuth();

  // Check if already signed in
  if (auth.currentUser) {
    currentUser = auth.currentUser;
    return currentUser;
  }

  // Get credentials from environment
  const email = process.env.SCAN_TEST_EMAIL || process.env.TEST_USER_EMAIL;
  const password = process.env.SCAN_TEST_PASSWORD || process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'Test user credentials not configured.\n' +
      'Set SCAN_TEST_EMAIL and SCAN_TEST_PASSWORD environment variables.\n' +
      'Or use: export SCAN_TEST_EMAIL="test@example.com" SCAN_TEST_PASSWORD="..."'
    );
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    currentUser = userCredential.user;
    return currentUser;
  } catch (error) {
    const authError = error as { code?: string; message?: string };
    throw new Error(
      `Authentication failed: ${authError.message || 'Unknown error'}\n` +
      'Ensure SCAN_TEST_EMAIL and SCAN_TEST_PASSWORD are correct.'
    );
  }
}

/**
 * Sign out the current user.
 */
export async function signOutUser(): Promise<void> {
  if (auth) {
    await auth.signOut();
    currentUser = null;
  }
}

// ============================================================================
// Scanner
// ============================================================================

/**
 * Scan a receipt image using the Cloud Function.
 *
 * @param imageBuffer - Image data as Buffer
 * @param options - Scan options
 * @returns Scan result from Gemini AI
 * @throws Error if scan fails
 *
 * @example
 * ```typescript
 * const imageBuffer = fs.readFileSync('receipt.jpg');
 * const result = await scanReceipt(imageBuffer);
 * console.log(result.merchant, result.total);
 * ```
 */
export async function scanReceipt(
  imageBuffer: Buffer,
  options: {
    currency?: string;
    receiptType?: string;
    useEmulator?: boolean;
    retries?: number;
    /** Prompt context: 'production' (default) or 'development' for DEV_PROMPT */
    promptContext?: 'production' | 'development';
  } = {}
): Promise<ScanResult> {
  const {
    currency = 'CLP',
    receiptType,
    useEmulator = false,
    retries = CONFIG.api.maxRetries,
    promptContext = 'development', // Test harness defaults to development prompt
  } = options;

  // Ensure user is authenticated
  await authenticateUser();

  // Get Functions instance
  const app = getFirebaseApp();
  const functions = getFunctions(app, FUNCTIONS_REGION);

  // Connect to emulator if specified
  if (useEmulator) {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  }

  // Convert image to base64 data URI
  const base64Image = imageBuffer.toString('base64');
  const mimeType = detectMimeType(imageBuffer);
  const dataUri = `data:${mimeType};base64,${base64Image}`;

  // Get callable function
  const analyzeReceipt = httpsCallable<
    { images: string[]; currency: string; receiptType?: string; promptContext?: string },
    ScanResult
  >(functions, 'analyzeReceipt');

  // Execute with retry logic
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await analyzeReceipt({
        images: [dataUri],
        currency,
        promptContext, // 'development' for test harness, 'production' for app
        ...(receiptType && { receiptType }),
      });

      return result.data;
    } catch (error) {
      lastError = error as Error;
      const errorCode = (error as { code?: string }).code;

      // Handle rate limiting
      if (errorCode === 'resource-exhausted') {
        console.log(`Rate limited, waiting ${CONFIG.api.rateLimitWaitMs / 1000}s...`);
        await sleep(CONFIG.api.rateLimitWaitMs);
        continue;
      }

      // Retry on other errors
      if (attempt < retries) {
        console.log(`Scan failed (attempt ${attempt + 1}/${retries + 1}), retrying...`);
        await sleep(1000);
        continue;
      }
    }
  }

  throw lastError || new Error('Scan failed after retries');
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Detect MIME type from image buffer magic bytes.
 */
function detectMimeType(buffer: Buffer): string {
  if (buffer.length < 4) {
    return 'image/jpeg'; // Default
  }

  // Check magic bytes
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }

  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    // Could be WEBP (RIFF header)
    if (buffer.length >= 12 && buffer.slice(8, 12).toString() === 'WEBP') {
      return 'image/webp';
    }
  }

  // Default to JPEG
  return 'image/jpeg';
}

/**
 * Sleep for specified milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if the scanner is authenticated.
 */
export function isAuthenticated(): boolean {
  return currentUser !== null;
}
