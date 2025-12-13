/**
 * Validate Command - Check all expected.json files against schema
 *
 * Validates test case files to ensure they conform to the TestCaseFileSchema.
 * Reports detailed errors including file path and field path for each violation.
 *
 * Usage:
 *   npm run test:scan:validate
 *   npm run test:scan:validate -- --file=supermarket/jumbo-001.expected.json
 *
 * @see docs/sprint-artifacts/epic8/story-8.6-generate-validate-commands.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { ZodError } from 'zod';
import { TestCaseFileSchema } from '../lib/schema';
import { log } from '../lib/reporter';
import { CONFIG } from '../config';
import type { ValidateOptions } from '../types';
import chalk from 'chalk';

// ============================================================================
// Types
// ============================================================================

/**
 * Validation error for a single file.
 */
interface FileValidationError {
  /** Relative file path */
  file: string;
  /** List of validation errors */
  errors: string[];
}

// ============================================================================
// File Discovery
// ============================================================================

/**
 * Find all expected.json files recursively in a directory.
 */
function findExpectedJsonFiles(dirPath: string): string[] {
  const results: string[] = [];

  if (!fs.existsSync(dirPath)) {
    return results;
  }

  function scanDir(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.expected.json')) {
        results.push(fullPath);
      }
    }
  }

  scanDir(dirPath);
  return results.sort();
}

// ============================================================================
// Validation Logic
// ============================================================================

/**
 * Format Zod errors into human-readable strings.
 * Shows field path and error message for each validation failure.
 */
function formatZodErrors(error: ZodError): string[] {
  return error.errors.map((e) => {
    const fieldPath = e.path.length > 0 ? e.path.join('.') : '(root)';
    return `${fieldPath}: ${e.message}`;
  });
}

/**
 * Validate a single expected.json file.
 *
 * @param filePath - Full path to the file
 * @returns Null if valid, FileValidationError if invalid
 */
function validateFile(filePath: string): FileValidationError | null {
  const relativePath = path.relative(process.cwd(), filePath);

  try {
    // Read and parse JSON
    const content = fs.readFileSync(filePath, 'utf-8');
    let data: unknown;

    try {
      data = JSON.parse(content);
    } catch {
      return {
        file: relativePath,
        errors: ['Invalid JSON: Failed to parse file'],
      };
    }

    // Validate against schema
    TestCaseFileSchema.parse(data);

    return null; // Valid
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        file: relativePath,
        errors: formatZodErrors(error),
      };
    }

    // Other errors (file read, etc.)
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      file: relativePath,
      errors: [errorMessage],
    };
  }
}

// ============================================================================
// Display Functions
// ============================================================================

/**
 * Display validation results.
 */
function displayResults(
  validCount: number,
  invalidCount: number,
  errors: FileValidationError[]
): void {
  console.log('');
  console.log('━'.repeat(40));

  // Summary
  const total = validCount + invalidCount;
  if (invalidCount === 0) {
    console.log(chalk.green(`✓ All ${total} file(s) valid`));
  } else {
    console.log(chalk.red(`✗ ${invalidCount}/${total} file(s) invalid`));
  }

  // Show errors
  if (errors.length > 0) {
    console.log('');
    console.log(chalk.red('Validation Errors:'));

    for (const { file, errors: fileErrors } of errors) {
      console.log('');
      console.log(chalk.yellow(file));
      for (const err of fileErrors) {
        console.log(`  ${chalk.red('✗')} ${err}`);
      }
    }
  }
}

// ============================================================================
// Command Entry Point
// ============================================================================

/**
 * Validate command entry point.
 *
 * @param options - Command options from CLI
 */
export async function validateCommand(options: ValidateOptions = {}): Promise<void> {
  const { file } = options;

  log.header('Validate Test Case Files');

  let filesToValidate: string[] = [];

  if (file) {
    // Validate single file
    let filePath = file;

    // Try to resolve path
    if (!path.isAbsolute(file)) {
      // Try relative to test-data
      const testDataPath = path.join(process.cwd(), CONFIG.testDataDir, file);
      if (fs.existsSync(testDataPath)) {
        filePath = testDataPath;
      } else {
        // Try relative to cwd
        filePath = path.join(process.cwd(), file);
      }
    }

    if (!fs.existsSync(filePath)) {
      log.error(`File not found: ${file}`);
      process.exit(2);
    }

    filesToValidate = [filePath];
  } else {
    // Find all expected.json files
    const testDataDir = path.join(process.cwd(), CONFIG.testDataDir);
    filesToValidate = findExpectedJsonFiles(testDataDir);
  }

  if (filesToValidate.length === 0) {
    log.warn('No expected.json files found');
    log.dim(`Searched in: ${CONFIG.testDataDir}`);
    process.exit(0);
  }

  log.info(`Found ${filesToValidate.length} expected.json file(s)`);
  console.log('');

  // Validate each file
  let validCount = 0;
  let invalidCount = 0;
  const errors: FileValidationError[] = [];

  for (const filePath of filesToValidate) {
    const relativePath = path.relative(process.cwd(), filePath);
    const result = validateFile(filePath);

    if (result === null) {
      log.success(relativePath);
      validCount++;
    } else {
      log.fail(relativePath);
      invalidCount++;
      errors.push(result);
    }
  }

  // Display results
  displayResults(validCount, invalidCount, errors);

  // Exit with appropriate code
  if (invalidCount > 0) {
    process.exit(1);
  }

  process.exit(0);
}
