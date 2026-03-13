/**
 * Statement Scanner — Cloud Function Caller
 *
 * Calls the analyzeStatement Cloud Function to scan statement PDFs.
 * Reuses Firebase auth infrastructure from the receipt scanner.
 *
 * @see prompt-testing/scripts/lib/scanner.ts (receipt equivalent)
 */

import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { authenticateUser, isAuthenticated } from '../../lib/scanner';
import type { StatementResult } from '../../../prompts/statement/types';

// Re-export auth functions from receipt scanner
export { authenticateUser, signOutUser, isAuthenticated } from '../../lib/scanner';

// ============================================================================
// Types
// ============================================================================

export interface StatementScanResult extends StatementResult {
  promptVersion: string;
  model: string;
  latencyMs: number;
}

// ============================================================================
// Scanner
// ============================================================================

/**
 * Scan a statement PDF using the analyzeStatement Cloud Function.
 *
 * @param pdfBuffer - PDF file as Buffer
 * @param options - Scan options
 * @returns Statement scan result from Gemini AI
 *
 * @example
 * ```typescript
 * const pdfBuffer = fs.readFileSync('statement.pdf');
 * const result = await scanStatement(pdfBuffer);
 * console.log(`${result.transactions.length} transactions extracted`);
 * ```
 */
export async function scanStatement(
  pdfBuffer: Buffer,
  options: {
    useEmulator?: boolean;
    retries?: number;
    promptContext?: 'production' | 'development';
  } = {}
): Promise<StatementScanResult> {
  const {
    useEmulator = false,
    retries = 1,
    promptContext = 'development',
  } = options;

  // Ensure user is authenticated (reuses receipt scanner auth)
  await authenticateUser();

  // Get Functions instance
  // Import dynamically to avoid circular init with receipt scanner
  const { initializeApp, getApps } = await import('firebase/app');
  let app = getApps()[0];
  if (!app) {
    const apiKey = process.env.VITE_FIREBASE_API_KEY;
    const authDomain = process.env.VITE_FIREBASE_AUTH_DOMAIN;
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
    if (!apiKey || !authDomain || !projectId) {
      throw new Error('Firebase config not found. Set VITE_FIREBASE_* env vars.');
    }
    app = initializeApp({ apiKey, authDomain, projectId });
  }

  const functions = getFunctions(app, 'us-central1');

  if (useEmulator) {
    connectFunctionsEmulator(functions, 'localhost', 5001);
  }

  // Convert PDF to base64
  const pdfBase64 = pdfBuffer.toString('base64');

  // Get callable function
  const analyzeStatement = httpsCallable<
    { pdf: string; promptContext?: string },
    StatementScanResult
  >(functions, 'analyzeStatement');

  // Execute with retry logic
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await analyzeStatement({
        pdf: pdfBase64,
        promptContext,
      });
      return result.data;
    } catch (error) {
      lastError = error as Error;
      const errorCode = (error as { code?: string }).code;

      if (errorCode === 'resource-exhausted') {
        console.log('Rate limited, waiting 30s...');
        await new Promise(resolve => setTimeout(resolve, 30000));
        continue;
      }

      if (attempt < retries) {
        console.log(`Scan failed (attempt ${attempt + 1}/${retries + 1}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
    }
  }

  throw lastError || new Error('Statement scan failed after retries');
}
