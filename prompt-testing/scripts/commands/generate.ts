/**
 * Generate Command - Create expected.json files from Cloud Function
 *
 * Generates expected.json test case files by calling the Cloud Function
 * and auto-filling metadata from the file/folder context.
 *
 * Usage:
 *   npm run test:scan:generate -- --image=jumbo-001.jpg
 *   npm run test:scan:generate -- --folder=test-data/receipts/supermarket/
 *   npm run test:scan:generate -- --image=jumbo-001.jpg --force
 *
 * @see docs/sprint-artifacts/epic8/story-8.6-generate-validate-commands.md
 */

import * as fs from 'fs';
import * as path from 'path';
import { scanReceipt } from '../lib/scanner';
import { log } from '../lib/reporter';
import { CONFIG } from '../config';
import { DEV_PROMPT, PRODUCTION_PROMPT } from '../../prompts';
import type { StoreType } from '../lib/schema';
import type { GenerateOptions } from '../types';

// ============================================================================
// Store Type Mapping
// ============================================================================

/**
 * Map directory names (with hyphens) to StoreType enum values (with underscores).
 * Directory names use hyphens for filesystem friendliness.
 */
const DIRECTORY_TO_STORE_TYPE: Record<string, StoreType> = {
  supermarket: 'supermarket',
  pharmacy: 'pharmacy',
  restaurant: 'restaurant',
  'gas-station': 'gas_station',
  convenience: 'convenience',
  other: 'other',
};

/**
 * Map a directory name to a valid StoreType.
 * Returns 'other' if the directory name is not recognized.
 */
function mapStoreType(dirName: string): StoreType {
  return DIRECTORY_TO_STORE_TYPE[dirName.toLowerCase()] || 'other';
}

/**
 * Check if a directory name is a valid store type directory.
 */
function isValidStoreTypeDirectory(dirName: string): boolean {
  return dirName.toLowerCase() in DIRECTORY_TO_STORE_TYPE;
}

// ============================================================================
// File Discovery
// ============================================================================

/**
 * Find all image files in a directory.
 * Supports: jpg, jpeg, png
 */
function findImageFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const files = fs.readdirSync(dirPath);
  const imageExtensions = ['.jpg', '.jpeg', '.png'];

  return files
    .filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return imageExtensions.includes(ext);
    })
    .map((file) => path.join(dirPath, file));
}

/**
 * Find the image file from a filename or path.
 * Supports:
 * - Full paths: /path/to/image.jpg
 * - Relative paths: other/estacionamiento.jpg
 * - Paths without extension: other/estacionamiento (auto-detects .jpg, .jpeg, .png)
 * - Simple filenames: estacionamiento.jpg (searches in all store type dirs)
 */
function findImageFile(imageArg: string): string | null {
  const imageExtensions = ['.jpg', '.jpeg', '.png'];

  /**
   * Try to find an image file, with or without extension.
   */
  function tryFindWithExtension(basePath: string): string | null {
    // If path has an image extension, check it directly
    const ext = path.extname(basePath).toLowerCase();
    if (imageExtensions.includes(ext)) {
      if (fs.existsSync(basePath)) {
        return basePath;
      }
      return null;
    }

    // No extension - try adding common image extensions
    for (const imageExt of imageExtensions) {
      const pathWithExt = basePath + imageExt;
      if (fs.existsSync(pathWithExt)) {
        return pathWithExt;
      }
    }
    return null;
  }

  // If it's an absolute path, use directly
  if (path.isAbsolute(imageArg)) {
    return tryFindWithExtension(imageArg);
  }

  // If it contains path separators, try relative to test data dir first, then project root
  if (imageArg.includes('/') || imageArg.includes('\\')) {
    // Try relative to test data dir (e.g., "other/estacionamiento")
    const testDataPath = path.join(process.cwd(), CONFIG.testDataDir, imageArg);
    const foundInTestData = tryFindWithExtension(testDataPath);
    if (foundInTestData) {
      return foundInTestData;
    }

    // Try relative to project root
    const projectPath = path.join(process.cwd(), imageArg);
    const foundInProject = tryFindWithExtension(projectPath);
    if (foundInProject) {
      return foundInProject;
    }

    return null;
  }

  // Simple filename - search in all store type subdirectories
  const testDataDir = path.join(process.cwd(), CONFIG.testDataDir);
  const storeTypes = Object.keys(DIRECTORY_TO_STORE_TYPE);

  for (const storeType of storeTypes) {
    const basePath = path.join(testDataDir, storeType, imageArg);
    const found = tryFindWithExtension(basePath);
    if (found) {
      return found;
    }
  }

  return null;
}

// ============================================================================
// Input File Handling
// ============================================================================

/**
 * Input variables for a test case.
 * Loaded from .input.json file before generation.
 */
interface TestInput {
  currency?: string;
  receiptType?: string;
}

/**
 * Default input values when no .input.json file exists.
 */
const DEFAULT_INPUT: TestInput = {
  currency: 'CLP',
  receiptType: 'auto',
};

/**
 * Read input variables from .input.json file if it exists.
 * Returns defaults if file doesn't exist.
 *
 * @param imagePath - Path to the image file
 * @returns Input variables for the test
 */
function readInputFile(imagePath: string): TestInput {
  const inputPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '.input.json');

  if (!fs.existsSync(inputPath)) {
    return { ...DEFAULT_INPUT };
  }

  try {
    const content = fs.readFileSync(inputPath, 'utf-8');
    const parsed = JSON.parse(content) as TestInput;

    return {
      currency: parsed.currency || DEFAULT_INPUT.currency,
      receiptType: parsed.receiptType || DEFAULT_INPUT.receiptType,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.warn(`Failed to read ${path.relative(process.cwd(), inputPath)}: ${errorMessage}`);
    return { ...DEFAULT_INPUT };
  }
}

// ============================================================================
// Generate Logic
// ============================================================================

/**
 * Generate expected.json for a single image file.
 *
 * Reads input variables from .input.json if it exists (mirrors app flow:
 * user settings exist before scanning). If no input file exists, uses
 * defaults (CLP currency, auto receipt type).
 *
 * @param imagePath - Full path to the image file
 * @param force - If true, overwrite existing expected.json
 * @returns true if generated successfully, false otherwise
 */
async function generateForImage(imagePath: string, force: boolean): Promise<boolean> {
  // Determine file paths
  const expectedPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '.expected.json');
  const inputPath = imagePath.replace(/\.(jpg|jpeg|png)$/i, '.input.json');
  const relativeImagePath = path.relative(process.cwd(), imagePath);

  // Check if expected.json already exists
  if (fs.existsSync(expectedPath) && !force) {
    log.warn(`${path.relative(process.cwd(), expectedPath)} already exists. Use --force to overwrite.`);
    return false;
  }

  // Extract metadata from path
  const dirName = path.basename(path.dirname(imagePath));
  const filename = path.basename(imagePath);
  const testId = filename.replace(/\.(jpg|jpeg|png)$/i, '');

  // Validate store type directory
  if (!isValidStoreTypeDirectory(dirName)) {
    log.warn(`Unknown store type directory '${dirName}'. Using 'other'. Valid types: ${Object.keys(DIRECTORY_TO_STORE_TYPE).join(', ')}`);
  }

  const storeType = mapStoreType(dirName);

  // Read input variables (from .input.json or defaults)
  const input = readInputFile(imagePath);
  const hasInputFile = fs.existsSync(inputPath);

  if (hasInputFile) {
    log.dim(`Using input: currency=${input.currency}, receiptType=${input.receiptType}`);
  } else {
    log.dim(`No input file found, using defaults: currency=${input.currency}, receiptType=${input.receiptType}`);
  }

  // Show which prompt version the Cloud Function will use
  const isSamePrompt = DEV_PROMPT.id === PRODUCTION_PROMPT.id;
  if (isSamePrompt) {
    log.dim(`Prompt: ${DEV_PROMPT.name} (${DEV_PROMPT.id} v${DEV_PROMPT.version})`);
  } else {
    log.dim(`DEV Prompt: ${DEV_PROMPT.name} (${DEV_PROMPT.id} v${DEV_PROMPT.version})`);
    log.dim(`PROD Prompt: ${PRODUCTION_PROMPT.name} (${PRODUCTION_PROMPT.id} v${PRODUCTION_PROMPT.version})`);
  }

  log.info(`Generating expected.json for ${testId}...`);

  try {
    // Read image as buffer
    const imageBuffer = fs.readFileSync(imagePath);

    // Call Cloud Function with input variables
    const result = await scanReceipt(imageBuffer, {
      currency: input.currency,
      receiptType: input.receiptType,
    });

    // Build test case file structure with all fields from AI response
    const testCase = {
      metadata: {
        testId,
        storeType,
        difficulty: 'medium' as const, // Default, human can adjust
        region: 'CL' as const,
        source: 'manual-collection' as const,
        addedAt: new Date().toISOString(),
      },
      input: {
        currency: input.currency,
        receiptType: input.receiptType,
      },
      aiExtraction: {
        merchant: result.merchant,
        date: result.date,
        time: result.time, // 24h format HH:MM, default "04:04" if not found
        total: result.total,
        currency: result.currency,
        category: result.category,
        country: result.country,
        city: result.city,
        items: result.items,
        aiMetadata: result.metadata, // receiptType, confidence from AI
        model: 'gemini-2.0-flash',
        modelVersion: 'latest',
        promptId: DEV_PROMPT.id,
        promptVersion: DEV_PROMPT.version,
        extractedAt: new Date().toISOString(),
      },
      corrections: {}, // Empty - human fills if needed
    };

    // Write file
    fs.writeFileSync(expectedPath, JSON.stringify(testCase, null, 2) + '\n');
    log.success(`Created ${path.relative(process.cwd(), expectedPath)}`);

    // Show summary of what was extracted
    const itemCount = result.items?.length || 0;
    const location = result.country || result.city ? `${result.city || '?'}, ${result.country || '?'}` : 'not detected';
    log.dim(`  → ${result.merchant} | ${result.total} ${result.currency || input.currency} | ${itemCount} items | Location: ${location}`);

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error(`Failed to generate for ${relativeImagePath}: ${errorMessage}`);
    return false;
  }
}

/**
 * Generate expected.json for all images in a folder.
 *
 * @param folderPath - Path to the folder containing images
 * @param force - If true, overwrite existing expected.json files
 */
async function generateForFolder(folderPath: string, force: boolean): Promise<void> {
  // Resolve folder path
  let resolvedPath = folderPath;
  if (!path.isAbsolute(folderPath)) {
    resolvedPath = path.join(process.cwd(), folderPath);
  }

  if (!fs.existsSync(resolvedPath)) {
    log.error(`Folder not found: ${folderPath}`);
    process.exit(2);
  }

  // Find all images in folder
  const imageFiles = findImageFiles(resolvedPath);

  if (imageFiles.length === 0) {
    log.warn(`No image files found in ${folderPath}`);
    process.exit(0);
  }

  log.header('Generate Expected.json Files');
  log.info(`Found ${imageFiles.length} image(s) in ${path.relative(process.cwd(), resolvedPath)}`);
  console.log('');

  // Filter out images that already have expected.json (unless force)
  const imagesToProcess = force
    ? imageFiles
    : imageFiles.filter((img) => {
        const expectedPath = img.replace(/\.(jpg|jpeg|png)$/i, '.expected.json');
        return !fs.existsSync(expectedPath);
      });

  if (imagesToProcess.length === 0) {
    log.info('All images already have expected.json files. Use --force to regenerate.');
    process.exit(0);
  }

  if (!force && imagesToProcess.length < imageFiles.length) {
    const skipped = imageFiles.length - imagesToProcess.length;
    log.dim(`Skipping ${skipped} image(s) that already have expected.json files.`);
    console.log('');
  }

  // Process each image
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < imagesToProcess.length; i++) {
    const imagePath = imagesToProcess[i];
    const testId = path.basename(imagePath).replace(/\.(jpg|jpeg|png)$/i, '');

    log.dim(`[${i + 1}/${imagesToProcess.length}] Processing ${testId}...`);

    const success = await generateForImage(imagePath, force);

    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay between API calls to avoid rate limiting
    if (i < imagesToProcess.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Summary
  console.log('');
  console.log('━'.repeat(40));
  console.log(`Generated: ${successCount}, Skipped/Failed: ${failCount}`);

  if (failCount > 0) {
    process.exit(1);
  }
}

// ============================================================================
// Command Entry Point
// ============================================================================

/**
 * Generate command entry point.
 *
 * @param options - Command options from CLI
 */
export async function generateCommand(options: GenerateOptions): Promise<void> {
  const { image, folder, force = false } = options;

  // Validate arguments
  if (!image && !folder) {
    log.error('Provide image path or --folder=/path');
    console.log('');
    console.log('Usage:');
    console.log('  npm run test:scan:generate -- other/estacionamiento');
    console.log('  npm run test:scan:generate -- other/estacionamiento.jpg');
    console.log('  npm run test:scan:generate -- --folder=prompt-testing/test-cases/supermarket/');
    console.log('  npm run test:scan:generate -- other/estacionamiento --force');
    process.exit(2);
  }

  if (image && folder) {
    log.error('Provide either --image or --folder, not both');
    process.exit(2);
  }

  // Process single image
  if (image) {
    const imagePath = findImageFile(image);

    if (!imagePath) {
      log.error(`Image not found: ${image}`);
      log.dim(`Searched in test-data/receipts/{store-type}/ subdirectories`);
      process.exit(2);
    }

    log.header('Generate Expected.json');
    const success = await generateForImage(imagePath, force);
    process.exit(success ? 0 : 1);
  }

  // Process folder
  if (folder) {
    await generateForFolder(folder, force);
  }
}
