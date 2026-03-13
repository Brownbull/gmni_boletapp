#!/usr/bin/env tsx
/**
 * Statement Scan Test CLI
 *
 * Test harness for statement extraction prompts, parallel to the receipt
 * test harness (prompt-testing/scripts/index.ts).
 *
 * Usage:
 *   # Source env vars (Firebase config + test credentials)
 *   source .env.staging
 *
 *   # Run single test (flagship)
 *   npx tsx prompt-testing/scripts/statement/index.ts --file cmr/cmr202503.pdf
 *
 *   # Run one per folder (oldest from each bank)
 *   npx tsx prompt-testing/scripts/statement/index.ts --one-per-folder
 *
 *   # Run all tests
 *   npx tsx prompt-testing/scripts/statement/index.ts --all
 *
 *   # Verbose output (print all transactions)
 *   npx tsx prompt-testing/scripts/statement/index.ts --file cmr/cmr202503.pdf --verbose
 *
 *   # Use development prompt (default) or production
 *   npx tsx prompt-testing/scripts/statement/index.ts --file cmr/cmr202503.pdf --context=production
 *
 * Results saved to prompt-testing/results/statement/
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { scanStatement, authenticateUser, signOutUser } from './lib/scanner';
import type { StatementScanResult } from './lib/scanner';

// ============================================================================
// Configuration
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_CASES_DIR = join(__dirname, '../../test-cases/CreditCard');
const RESULTS_DIR = join(__dirname, '../../results/statement');

// ============================================================================
// Types
// ============================================================================

interface TestResult {
  file: string;
  folder: string;
  timestamp: string;
  success: boolean;
  error?: string;
  latencyMs: number;
  transactionCount?: number;
  result?: StatementScanResult;
}

// ============================================================================
// Test Case Discovery
// ============================================================================

function discoverTestCases(args: {
  singleFile?: string;
  onePerFolder?: boolean;
  all?: boolean;
}): string[] {
  const { singleFile, onePerFolder, all } = args;

  if (singleFile) {
    const fullPath = join(TEST_CASES_DIR, singleFile);
    if (!existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      process.exit(1);
    }
    return [singleFile];
  }

  // Discover all bank folders
  const folders = readdirSync(TEST_CASES_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name)
    .sort();

  const files: string[] = [];

  for (const folder of folders) {
    const folderPath = join(TEST_CASES_DIR, folder);
    const pdfs = readdirSync(folderPath)
      .filter(f => f.endsWith('.pdf'))
      .sort();

    if (pdfs.length === 0) continue;

    if (onePerFolder || (!all && !singleFile)) {
      // Take the oldest (first sorted) from each folder
      files.push(join(folder, pdfs[0]));
    } else {
      // Take all PDFs
      for (const pdf of pdfs) {
        files.push(join(folder, pdf));
      }
    }
  }

  return files;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const all = args.includes('--all');
  const onePerFolder = args.includes('--one-per-folder');
  const contextArg = args.find(a => a.startsWith('--context='));
  const promptContext = (contextArg?.split('=')[1] as 'production' | 'development') || 'development';
  const fileArg = args.find((_, i) => args[i - 1] === '--file');

  // Ensure results directory
  if (!existsSync(RESULTS_DIR)) {
    mkdirSync(RESULTS_DIR, { recursive: true });
  }

  // Discover test cases
  const testFiles = discoverTestCases({
    singleFile: fileArg,
    onePerFolder,
    all,
  });

  if (testFiles.length === 0) {
    console.error('No test cases found.');
    process.exit(1);
  }

  console.log('\n=== Statement Scan Test ===');
  console.log(`Prompt context: ${promptContext}`);
  console.log(`PDFs: ${testFiles.length}`);
  console.log(`Test cases dir: ${TEST_CASES_DIR}`);
  console.log('');

  // Authenticate
  try {
    const user = await authenticateUser();
    console.log(`Authenticated as: ${user.email}`);
  } catch (error) {
    console.error('Authentication failed:', (error as Error).message);
    console.error('Set VITE_FIREBASE_* and SCAN_TEST_EMAIL/SCAN_TEST_PASSWORD env vars.');
    process.exit(1);
  }

  const results: TestResult[] = [];

  for (const testFile of testFiles) {
    const filePath = join(TEST_CASES_DIR, testFile);
    const folder = testFile.split('/')[0];
    const fileName = basename(testFile);
    console.log(`Processing: ${testFile}...`);

    const startTime = Date.now();

    try {
      const pdfBuffer = readFileSync(filePath);
      const scanResult = await scanStatement(pdfBuffer, { promptContext });

      const latencyMs = scanResult.latencyMs;
      const txCount = scanResult.transactions.length;

      const testResult: TestResult = {
        file: fileName,
        folder,
        timestamp: new Date().toISOString(),
        success: true,
        latencyMs,
        transactionCount: txCount,
        result: scanResult,
      };

      console.log(`  OK: ${txCount} transactions, ${latencyMs}ms`);
      console.log(`  Bank: ${scanResult.statementInfo.bank} | Period: ${scanResult.statementInfo.period}`);
      console.log(`  Prompt: ${scanResult.promptVersion} | Model: ${scanResult.model}`);

      if (scanResult.metadata.warnings.length > 0) {
        console.log(`  Warnings: ${scanResult.metadata.warnings.join(', ')}`);
      }

      if (verbose) {
        console.log('  Transactions:');
        for (const tx of scanResult.transactions) {
          const installment = tx.installment ? ` [${tx.installment}]` : '';
          console.log(
            `    ${tx.date} | ${tx.description.substring(0, 40).padEnd(40)} | ` +
            `${String(tx.amount).padStart(10)} | ${tx.type}${installment} | ${tx.category}`
          );
        }
      }

      results.push(testResult);
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      results.push({
        file: fileName,
        folder,
        timestamp: new Date().toISOString(),
        success: false,
        error: errorMsg,
        latencyMs,
      });

      console.log(`  FAIL: ${errorMsg} (${latencyMs}ms)`);
    }

    // Rate limiting delay between calls
    if (testFiles.indexOf(testFile) < testFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('');
  }

  // ========================================================================
  // Summary
  // ========================================================================

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalTxns = successful.reduce((sum, r) => sum + (r.transactionCount ?? 0), 0);
  const avgLatency = successful.length > 0
    ? Math.round(successful.reduce((sum, r) => sum + r.latencyMs, 0) / successful.length)
    : 0;

  console.log('=== SUMMARY ===');
  console.log(`Successful: ${successful.length}/${results.length}`);
  console.log(`Failed: ${failed.length}/${results.length}`);
  console.log(`Total transactions: ${totalTxns}`);
  console.log(`Avg latency: ${avgLatency}ms`);

  if (successful.length > 0) {
    console.log('\nPer-statement:');
    console.log('  File                     | Txns | Latency  | Bank');
    console.log('  -------------------------|------|----------|-----');
    for (const r of successful) {
      const bank = r.result?.statementInfo.bank ?? 'N/A';
      console.log(
        `  ${(r.folder + '/' + r.file).padEnd(25)}| ${String(r.transactionCount).padStart(4)} | ` +
        `${String(r.latencyMs).padStart(6)}ms | ${bank}`
      );
    }
  }

  if (failed.length > 0) {
    console.log('\nFailed:');
    for (const r of failed) {
      console.log(`  ${r.folder}/${r.file}: ${r.error}`);
    }
  }

  // Save results
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const resultFile = join(RESULTS_DIR, `${timestamp}_statement-test.json`);
  writeFileSync(resultFile, JSON.stringify({
    runDate: new Date().toISOString(),
    promptContext,
    totalFiles: results.length,
    successful: successful.length,
    failed: failed.length,
    totalTransactions: totalTxns,
    avgLatencyMs: avgLatency,
    results,
  }, null, 2));

  console.log(`\nResults saved to: ${resultFile}`);

  // Sign out
  await signOutUser();

  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(2);
});
