/**
 * Analyze Command - Generate failure analysis from test results
 *
 * Analyzes test results to identify failure patterns, group failures
 * by field and store type, and generate structured analysis for
 * prompt improvement.
 *
 * Usage:
 *   npm run test:scan:analyze                    # Analyze most recent results
 *   npm run test:scan:analyze -- --result=path  # Analyze specific file
 *
 * @see docs/sprint-artifacts/epic8/story-8.7-ab-prompt-comparison-analysis.md
 */

import * as path from 'path';
import chalk from 'chalk';
import { CONFIG, EXIT_CODES } from '../config';
import {
  analyzeResults,
  loadResultsFile,
  findMostRecentResultsFile,
  saveAnalysis,
  type Analysis,
} from '../lib/analyzer';
import { log } from '../lib/reporter';
import type { AnalyzeOptions } from '../types';

// ============================================================================
// Main Command Handler
// ============================================================================

/**
 * Execute the analyze command.
 *
 * @param options - Command options from Commander
 */
export async function analyzeCommand(options: AnalyzeOptions): Promise<void> {
  try {
    // Display banner
    console.log(chalk.bold('\n📊 Scan Test Analysis'));
    console.log('━'.repeat(40));

    // Find results file to analyze
    let resultsPath: string | null = null;

    if (options.result) {
      resultsPath = path.resolve(options.result);
    } else {
      log.info('Finding most recent results file...');
      resultsPath = findMostRecentResultsFile(CONFIG.resultsDir);
    }

    if (!resultsPath) {
      log.error('No results file found.');
      log.dim(`Ensure ${CONFIG.resultsDir}/ contains JSON results files.`);
      log.dim('Run tests first: npm run test:scan');
      process.exit(EXIT_CODES.ERROR);
    }

    log.info(`Analyzing: ${path.relative(process.cwd(), resultsPath)}`);

    // Load results file
    const runOutput = loadResultsFile(resultsPath);

    // Generate analysis
    const analysis = analyzeResults(
      runOutput.results,
      resultsPath,
      runOutput.metadata.promptVersion
    );

    // Display analysis
    displayAnalysis(analysis);

    // Save analysis to file (AC7)
    const savedPath = saveAnalysis(analysis, CONFIG.resultsDir);
    console.log('');
    log.success(`Analysis saved: ${savedPath}`);

    // Show usage hints
    displayUsageHints(analysis);

    process.exit(EXIT_CODES.SUCCESS);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error(errorMessage);
    process.exit(EXIT_CODES.ERROR);
  }
}

// ============================================================================
// Display Functions
// ============================================================================

/**
 * Display analysis summary.
 */
function displayAnalysis(analysis: Analysis): void {
  console.log('');

  // Summary
  console.log(chalk.bold('Summary'));
  console.log('━'.repeat(40));
  console.log(`  Total tests:    ${analysis.summary.totalTests}`);
  console.log(`  Failed tests:   ${chalk.red(String(analysis.summary.failedTests))}`);
  console.log(`  Accuracy:       ${formatAccuracy(analysis.summary.overallAccuracy)}%`);
  console.log(`  Prompt:         ${analysis.promptVersion}`);

  // By Field (AC2)
  console.log('');
  console.log(chalk.bold('Failures by Field'));
  console.log('━'.repeat(40));

  const fields = ['total', 'date', 'merchant', 'itemsCount', 'itemPrices'] as const;
  for (const field of fields) {
    const data = analysis.byField[field];
    const failureRate = (data.failureRate * 100).toFixed(0);
    const indicator = getFailureIndicator(data.failureRate);

    console.log(
      `  ${(field + ':').padEnd(14)} ${data.failureCount} failures (${failureRate}%) ${indicator}`
    );

    // Show patterns if any
    if (data.patterns.length > 0) {
      for (const pattern of data.patterns.slice(0, 2)) {
        console.log(chalk.dim(`    → ${pattern.description} (${pattern.occurrences}x)`));
      }
    }
  }

  // By Store Type (AC3)
  console.log('');
  console.log(chalk.bold('Failures by Store Type'));
  console.log('━'.repeat(40));

  const storeTypes = Object.entries(analysis.byStoreType)
    .sort((a, b) => b[1].failureRate - a[1].failureRate);

  for (const [storeType, data] of storeTypes) {
    const failureRate = (data.failureRate * 100).toFixed(0);
    const indicator = getFailureIndicator(data.failureRate);

    console.log(
      `  ${(storeType + ':').padEnd(14)} ${data.failureCount}/${data.tests} failed (${failureRate}%) ${indicator}`
    );
  }

  // Top patterns
  if (analysis.failures.length > 0) {
    console.log('');
    console.log(chalk.bold('Top Failure Patterns'));
    console.log('━'.repeat(40));

    // Collect all patterns and sort by occurrence
    const allPatterns: Array<{ field: string; pattern: { description: string; occurrences: number } }> = [];

    for (const field of fields) {
      for (const pattern of analysis.byField[field].patterns) {
        allPatterns.push({ field, pattern });
      }
    }

    allPatterns
      .sort((a, b) => b.pattern.occurrences - a.pattern.occurrences)
      .slice(0, 5)
      .forEach(({ field, pattern }) => {
        console.log(
          `  ${chalk.yellow(field.padEnd(12))} ${pattern.description} (${pattern.occurrences}x)`
        );
      });
  }
}

/**
 * Display usage hints for the analysis.
 */
function displayUsageHints(analysis: Analysis): void {
  console.log('');
  console.log(chalk.bold('Next Steps'));
  console.log('━'.repeat(40));
  console.log(chalk.dim('1. Review the analysis file for detailed failure data'));
  console.log(chalk.dim('2. Focus on fields with highest failure rates'));
  console.log(chalk.dim('3. Create a new prompt version addressing the patterns'));
  console.log(chalk.dim('4. A/B test: npm run test:scan -- --compare=v1,v2'));
}

/**
 * Format accuracy percentage with color.
 */
function formatAccuracy(accuracy: number): string {
  if (accuracy >= 90) return chalk.green(accuracy.toFixed(1));
  if (accuracy >= 70) return chalk.yellow(accuracy.toFixed(1));
  return chalk.red(accuracy.toFixed(1));
}

/**
 * Get failure rate indicator.
 */
function getFailureIndicator(failureRate: number): string {
  if (failureRate === 0) return chalk.green('✓');
  if (failureRate < 0.1) return chalk.yellow('○');
  if (failureRate < 0.3) return chalk.yellow('⚠');
  return chalk.red('✗ focus here');
}
