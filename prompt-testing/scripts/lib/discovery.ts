/**
 * Test Case Discovery
 *
 * Scans the test-data/receipts/ directory for test cases (image + expected.json pairs).
 * Supports filtering by store type and specific image.
 *
 * @see docs/sprint-artifacts/epic8/architecture-epic8.md#Test-Data-Location
 */

import * as fs from 'fs';
import * as path from 'path';
import { CONFIG, isValidStoreType } from '../config';
import type { StoreType } from '../types';

// ============================================================================
// Types
// ============================================================================

/**
 * Discovered test case with paths to image and expected.json.
 */
export interface TestCase {
  /** Unique test ID (e.g., "jumbo-001") */
  testId: string;

  /** Store type from directory (e.g., "supermarket") */
  storeType: StoreType;

  /** Absolute path to the image file */
  imagePath: string;

  /** Absolute path to the expected.json file */
  expectedPath: string;
}

/**
 * Options for discovering test cases.
 */
export interface DiscoveryOptions {
  /** Filter to a single image by filename (e.g., "jumbo-001.jpg") */
  image?: string;

  /** Filter by store type (e.g., "supermarket") */
  type?: string;

  /** Custom test data folder (overrides CONFIG.testDataDir) */
  folder?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Supported image extensions */
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];

/** Expected JSON file suffix */
const EXPECTED_SUFFIX = '.expected.json';

// ============================================================================
// Discovery Functions
// ============================================================================

/**
 * Discover test cases from the test data directory.
 *
 * Test cases are found by scanning for image files with matching expected.json.
 * Structure: {testDataDir}/{storeType}/{testId}.{ext} + {testId}.expected.json
 *
 * @param options - Discovery options for filtering
 * @returns Array of discovered test cases
 * @throws Error if test data directory doesn't exist
 *
 * @example
 * ```typescript
 * // Find all test cases
 * const all = discoverTestCases({});
 *
 * // Find single test by image
 * const single = discoverTestCases({ image: 'jumbo-001.jpg' });
 *
 * // Filter by store type
 * const supermarkets = discoverTestCases({ type: 'supermarket' });
 * ```
 */
export function discoverTestCases(options: DiscoveryOptions): TestCase[] {
  const testDataDir = options.folder || CONFIG.testDataDir;

  // Verify test data directory exists
  if (!fs.existsSync(testDataDir)) {
    throw new Error(`Test data directory not found: ${testDataDir}`);
  }

  // Validate store type if provided
  if (options.type && !isValidStoreType(options.type)) {
    throw new Error(
      `Invalid store type: ${options.type}. ` +
      `Valid types: ${CONFIG.validStoreTypes.join(', ')}`
    );
  }

  const testCases: TestCase[] = [];

  // Get store type directories to scan
  const storeTypeDirs = options.type
    ? [options.type]
    : getSubdirectories(testDataDir);

  for (const storeType of storeTypeDirs) {
    const storeDir = path.join(testDataDir, storeType);

    if (!fs.existsSync(storeDir)) {
      continue;
    }

    const files = fs.readdirSync(storeDir);

    // Find image files
    for (const file of files) {
      const ext = path.extname(file).toLowerCase();

      if (!IMAGE_EXTENSIONS.includes(ext)) {
        continue;
      }

      const testId = path.basename(file, ext);
      const imagePath = path.join(storeDir, file);
      const expectedPath = path.join(storeDir, `${testId}.expected.json`);

      // If filtering by image, check if this matches
      if (options.image) {
        const searchName = options.image.toLowerCase();
        const fileName = file.toLowerCase();
        const testIdLower = testId.toLowerCase();

        // Match by exact filename or testId
        if (fileName !== searchName && testIdLower !== searchName.replace(/\.[^.]+$/, '')) {
          continue;
        }
      }

      // Check if expected.json exists
      if (!fs.existsSync(expectedPath)) {
        // Skip images without expected.json (they need to be generated first)
        continue;
      }

      testCases.push({
        testId,
        storeType: storeType as StoreType,
        imagePath: path.resolve(imagePath),
        expectedPath: path.resolve(expectedPath),
      });
    }
  }

  // Sort by store type then test ID for consistent ordering
  testCases.sort((a, b) => {
    const storeCompare = a.storeType.localeCompare(b.storeType);
    if (storeCompare !== 0) return storeCompare;
    return a.testId.localeCompare(b.testId);
  });

  return testCases;
}

/**
 * Get subdirectories of a directory.
 */
function getSubdirectories(dir: string): string[] {
  try {
    return fs.readdirSync(dir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
  } catch {
    return [];
  }
}

/**
 * Load and validate the expected.json file for a test case.
 *
 * @param expectedPath - Path to the expected.json file
 * @returns Parsed and validated test case file
 * @throws Error if file cannot be read or is invalid
 */
export function loadExpectedJson(expectedPath: string): unknown {
  try {
    const content = fs.readFileSync(expectedPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load ${expectedPath}: ${error.message}`);
    }
    throw new Error(`Failed to load ${expectedPath}`);
  }
}

/**
 * Load image file as a Buffer.
 *
 * @param imagePath - Path to the image file
 * @returns Image data as Buffer
 * @throws Error if file cannot be read
 */
export function loadImageBuffer(imagePath: string): Buffer {
  try {
    return fs.readFileSync(imagePath);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to load image ${imagePath}: ${error.message}`);
    }
    throw new Error(`Failed to load image ${imagePath}`);
  }
}

/**
 * Get summary of discovered test cases by store type.
 */
export function getTestCaseSummary(testCases: TestCase[]): Record<string, number> {
  const summary: Record<string, number> = {};

  for (const tc of testCases) {
    summary[tc.storeType] = (summary[tc.storeType] || 0) + 1;
  }

  return summary;
}
