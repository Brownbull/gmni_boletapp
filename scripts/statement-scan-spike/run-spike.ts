#!/usr/bin/env tsx
/**
 * Statement Scan Spike — Runner Script
 *
 * Story 18-1: Validates Gemini PDF feasibility for Chilean credit card statements.
 *
 * Usage:
 *   # Source the API key (from functions/.env)
 *   export GEMINI_API_KEY=$(grep GEMINI_API_KEY functions/.env | cut -d= -f2)
 *
 *   # Run all PDFs
 *   tsx scripts/statement-scan-spike/run-spike.ts
 *
 *   # Run a single PDF
 *   tsx scripts/statement-scan-spike/run-spike.ts --file cmr202503.pdf
 *
 *   # Verbose mode (print full JSON)
 *   tsx scripts/statement-scan-spike/run-spike.ts --verbose
 *
 * Results are saved to scripts/statement-scan-spike/results/
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { buildStatementPrompt } from './statement-prompt';

// ============================================================================
// Configuration
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const TEST_CASES_DIR = join(__dirname, '../../prompt-testing/test-cases/CreditCard');
const RESULTS_DIR = join(__dirname, 'results');
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// ============================================================================
// Types
// ============================================================================

interface StatementTransaction {
  date: string;
  description: string;
  amount: number;
  type: string;
  installment: string | null;
  category: string;
  originalCurrency: string | null;
  originalAmount: number | null;
}

interface StatementInfo {
  bank: string;
  cardType: string;
  cardLastFour: string | null;
  period: string;
  closingDate: string | null;
  dueDate: string | null;
  totalDebit: number | null;
  totalCredit: number | null;
  currency: string;
}

interface StatementResult {
  statementInfo: StatementInfo;
  transactions: StatementTransaction[];
  metadata: {
    totalTransactions: number;
    confidence: number;
    pageCount: number;
    warnings: string[];
  };
}

interface SpikeResult {
  file: string;
  timestamp: string;
  model: string;
  latencyMs: number;
  success: boolean;
  error?: string;
  result?: StatementResult;
  transactionCount?: number;
}

// ============================================================================
// Gemini API Call (direct REST — no SDK dependency)
// ============================================================================

async function callGemini(pdfBase64: string, prompt: string, apiKey: string): Promise<string> {
  const body = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: 'application/pdf',
            data: pdfBase64,
          },
        },
      ],
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 65536,
      responseMimeType: 'application/json',
    },
  };

  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('No text in Gemini response');
  }

  return text;
}

// ============================================================================
// Parse Gemini Response
// ============================================================================

function parseResponse(text: string): StatementResult {
  // Clean markdown fences if present
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/\s*```$/i, '')
    .replace(/^```\s*/i, '')
    .trim();

  const parsed = JSON.parse(cleaned) as StatementResult;

  // Basic validation
  if (!parsed.statementInfo) throw new Error('Missing statementInfo');
  if (!Array.isArray(parsed.transactions)) throw new Error('Missing transactions array');

  return parsed;
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const verbose = args.includes('--verbose');
  const singleFile = args.find((_, i) => args[i - 1] === '--file');

  // Check API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('ERROR: GEMINI_API_KEY not set.');
    console.error('Run: export GEMINI_API_KEY=$(grep GEMINI_API_KEY functions/.env | cut -d= -f2)');
    process.exit(1);
  }

  // Ensure results directory exists
  if (!existsSync(RESULTS_DIR)) {
    mkdirSync(RESULTS_DIR, { recursive: true });
  }

  // Find PDF files
  let pdfFiles: string[];
  if (singleFile) {
    const fullPath = join(TEST_CASES_DIR, singleFile);
    if (!existsSync(fullPath)) {
      console.error(`File not found: ${fullPath}`);
      process.exit(1);
    }
    pdfFiles = [singleFile];
  } else {
    pdfFiles = readdirSync(TEST_CASES_DIR)
      .filter(f => f.endsWith('.pdf'))
      .sort();
  }

  console.log(`\n=== Statement Scan Spike ===`);
  console.log(`Model: ${GEMINI_MODEL}`);
  console.log(`PDFs: ${pdfFiles.length}`);
  console.log(`Test cases dir: ${TEST_CASES_DIR}`);
  console.log('');

  const today = new Date().toISOString().split('T')[0];
  const prompt = buildStatementPrompt(today);
  const results: SpikeResult[] = [];

  for (const pdfFile of pdfFiles) {
    const filePath = join(TEST_CASES_DIR, pdfFile);
    console.log(`Processing: ${pdfFile}...`);

    const startTime = Date.now();
    let spikeResult: SpikeResult;

    try {
      // Read PDF and convert to base64
      const pdfBuffer = readFileSync(filePath);
      const pdfBase64 = pdfBuffer.toString('base64');

      // Call Gemini
      const responseText = await callGemini(pdfBase64, prompt, apiKey);

      // Save raw response for debugging
      const rawPath = join(RESULTS_DIR, `${basename(pdfFile, '.pdf')}.raw.txt`);
      writeFileSync(rawPath, responseText);

      const parsed = parseResponse(responseText);

      const latencyMs = Date.now() - startTime;
      const txCount = parsed.transactions.length;

      spikeResult = {
        file: pdfFile,
        timestamp: new Date().toISOString(),
        model: GEMINI_MODEL,
        latencyMs,
        success: true,
        result: parsed,
        transactionCount: txCount,
      };

      // Print summary
      console.log(`  OK: ${txCount} transactions, ${latencyMs}ms`);
      console.log(`  Bank: ${parsed.statementInfo.bank} | Period: ${parsed.statementInfo.period}`);
      console.log(`  Total debit: ${parsed.statementInfo.totalDebit} | Total credit: ${parsed.statementInfo.totalCredit}`);

      if (parsed.metadata.warnings.length > 0) {
        console.log(`  Warnings: ${parsed.metadata.warnings.join(', ')}`);
      }

      if (verbose && parsed.transactions.length > 0) {
        console.log('  Transactions:');
        for (const tx of parsed.transactions) {
          const installment = tx.installment ? ` [${tx.installment}]` : '';
          console.log(`    ${tx.date} | ${tx.description.substring(0, 40).padEnd(40)} | ${String(tx.amount).padStart(10)} | ${tx.type}${installment}`);
        }
      }
    } catch (error) {
      const latencyMs = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);

      spikeResult = {
        file: pdfFile,
        timestamp: new Date().toISOString(),
        model: GEMINI_MODEL,
        latencyMs,
        success: false,
        error: errorMsg,
      };

      console.log(`  FAIL: ${errorMsg} (${latencyMs}ms)`);
    }

    results.push(spikeResult);

    // Save individual result
    const resultPath = join(RESULTS_DIR, `${basename(pdfFile, '.pdf')}.result.json`);
    writeFileSync(resultPath, JSON.stringify(spikeResult, null, 2));

    // Rate limiting: small delay between calls
    if (pdfFiles.indexOf(pdfFile) < pdfFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('');
  }

  // ========================================================================
  // Summary Report
  // ========================================================================

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  const totalTxns = successful.reduce((sum, r) => sum + (r.transactionCount ?? 0), 0);
  const avgLatency = successful.length > 0
    ? Math.round(successful.reduce((sum, r) => sum + r.latencyMs, 0) / successful.length)
    : 0;
  const maxLatency = successful.length > 0
    ? Math.max(...successful.map(r => r.latencyMs))
    : 0;

  console.log('=== SPIKE SUMMARY ===');
  console.log(`Successful: ${successful.length}/${results.length}`);
  console.log(`Failed: ${failed.length}/${results.length}`);
  console.log(`Total transactions extracted: ${totalTxns}`);
  console.log(`Average latency: ${avgLatency}ms`);
  console.log(`Max latency: ${maxLatency}ms (NFR-1.2 target: <15,000ms)`);
  console.log('');

  if (successful.length > 0) {
    console.log('Per-statement breakdown:');
    console.log('  File                | Txns | Latency  | Confidence | Bank');
    console.log('  --------------------|------|----------|------------|-----');
    for (const r of successful) {
      const conf = r.result?.metadata.confidence?.toFixed(2) ?? 'N/A';
      const bank = r.result?.statementInfo.bank ?? 'N/A';
      console.log(`  ${r.file.padEnd(20)}| ${String(r.transactionCount).padStart(4)} | ${String(r.latencyMs).padStart(6)}ms | ${conf.padStart(10)} | ${bank}`);
    }
  }

  if (failed.length > 0) {
    console.log('\nFailed:');
    for (const r of failed) {
      console.log(`  ${r.file}: ${r.error}`);
    }
  }

  // Save full run summary
  const summaryPath = join(RESULTS_DIR, `spike-run-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  writeFileSync(summaryPath, JSON.stringify({
    runDate: new Date().toISOString(),
    model: GEMINI_MODEL,
    totalFiles: results.length,
    successful: successful.length,
    failed: failed.length,
    totalTransactions: totalTxns,
    avgLatencyMs: avgLatency,
    maxLatencyMs: maxLatency,
    results,
  }, null, 2));

  console.log(`\nFull results saved to: ${summaryPath}`);

  // Exit with error code if any failures
  if (failed.length > 0) {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(2);
});
