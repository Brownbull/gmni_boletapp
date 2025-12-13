/**
 * Ground Truth Computation Module
 *
 * Computes the expected "ground truth" values by merging AI extraction
 * results with human corrections. Per ADR-011, corrections override
 * AI values only where specified.
 *
 * Ground Truth Algorithm:
 * 1. Start with aiExtraction values
 * 2. Apply corrections (corrections.field ?? aiExtraction.field)
 * 3. Handle item corrections (modify, delete, add)
 *
 * @see docs/sprint-artifacts/epic8/architecture-epic8.md#ADR-011
 */

import type { TestCaseFile, AIExtraction, Corrections, AIExtractionItem } from './schema';

// ============================================================================
// Types
// ============================================================================

/**
 * Ground truth item - the expected item after applying corrections.
 */
export interface GroundTruthItem {
  name: string;
  price: number;
  category?: string;
}

/**
 * Complete ground truth computed from AI extraction + corrections.
 * This is what we compare the actual scan results against.
 */
export interface GroundTruth {
  /** Expected merchant name */
  merchant: string;

  /** Expected date (YYYY-MM-DD format) */
  date: string;

  /** Expected total amount */
  total: number;

  /** Expected category */
  category: string;

  /** Expected items list */
  items: GroundTruthItem[];

  /** Source of this ground truth (for debugging) */
  _source: {
    hasAiExtraction: boolean;
    hasCorrections: boolean;
    correctedFields: string[];
    itemsModified: number;
    itemsDeleted: number;
    itemsAdded: number;
  };
}

// ============================================================================
// Main Function
// ============================================================================

/**
 * Computes ground truth from a test case file by merging AI extraction
 * with human corrections.
 *
 * Algorithm per ADR-011:
 * - For each top-level field: groundTruth.field = corrections.field ?? aiExtraction.field
 * - For items:
 *   1. Start with aiExtraction.items
 *   2. Apply corrections.items modifications
 *   3. Remove items marked with delete: true
 *   4. Add items from corrections.addItems
 *
 * @param testCase - The test case file to compute ground truth from
 * @returns Computed ground truth values
 * @throws Error if test case has neither aiExtraction nor corrections
 *
 * @example
 * ```typescript
 * const testCase = {
 *   metadata: { ... },
 *   aiExtraction: {
 *     merchant: "JUMB0",  // AI typo
 *     date: "2024-01-15",
 *     total: 15990,
 *     items: [{ name: "Milk", price: 1990 }]
 *   },
 *   corrections: {
 *     merchant: "JUMBO"  // Human correction
 *   }
 * };
 * const groundTruth = computeGroundTruth(testCase);
 * // groundTruth.merchant === "JUMBO" (corrected)
 * // groundTruth.date === "2024-01-15" (from AI)
 * ```
 */
export function computeGroundTruth(testCase: TestCaseFile): GroundTruth {
  const { aiExtraction, corrections } = testCase;

  // Validate that we have at least one source
  if (!aiExtraction && !corrections) {
    throw new Error(
      `Test case ${testCase.metadata.testId}: Cannot compute ground truth without aiExtraction or corrections`
    );
  }

  // Track what was corrected (for debugging/reporting)
  const correctedFields: string[] = [];
  let itemsModified = 0;
  let itemsDeleted = 0;
  let itemsAdded = 0;

  // Default values if no aiExtraction
  const defaultAi: AIExtraction = {
    merchant: '',
    date: '',
    total: 0,
    category: 'other',
    items: [],
    model: 'unknown',
    modelVersion: 'unknown',
    extractedAt: new Date().toISOString(),
  };

  const ai = aiExtraction || defaultAi;
  const corr = corrections || {};

  // Compute top-level fields with corrections taking precedence
  const merchant = computeField('merchant', ai.merchant, corr.merchant, correctedFields);
  const date = computeField('date', ai.date, corr.date, correctedFields);
  const total = computeField('total', ai.total, corr.total, correctedFields);
  const category = computeField('category', ai.category, corr.category, correctedFields);

  // Compute items
  const items = computeItems(ai.items, corr.items, corr.addItems, (mod, del, add) => {
    itemsModified = mod;
    itemsDeleted = del;
    itemsAdded = add;
  });

  return {
    merchant,
    date,
    total,
    category,
    items,
    _source: {
      hasAiExtraction: !!aiExtraction,
      hasCorrections: !!corrections,
      correctedFields,
      itemsModified,
      itemsDeleted,
      itemsAdded,
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Computes a single field value, preferring correction over AI value.
 *
 * @param fieldName - Name of the field (for tracking)
 * @param aiValue - Value from AI extraction
 * @param correctionValue - Value from corrections (may be undefined)
 * @param correctedFields - Array to track which fields were corrected
 * @returns The final field value
 */
function computeField<T>(
  fieldName: string,
  aiValue: T,
  correctionValue: T | undefined,
  correctedFields: string[]
): T {
  if (correctionValue !== undefined) {
    correctedFields.push(fieldName);
    return correctionValue;
  }
  return aiValue;
}

/**
 * Computes the final items list by applying corrections.
 *
 * Process:
 * 1. Start with AI-extracted items
 * 2. Apply modifications from corrections.items
 * 3. Remove items marked with delete: true
 * 4. Add items from corrections.addItems
 *
 * @param aiItems - Items from AI extraction
 * @param itemCorrections - Per-item corrections (keyed by index)
 * @param addItems - New items to add
 * @param statsCallback - Callback to report modification stats
 * @returns Final list of ground truth items
 */
function computeItems(
  aiItems: AIExtractionItem[],
  itemCorrections: Corrections['items'],
  addItems: Corrections['addItems'],
  statsCallback: (modified: number, deleted: number, added: number) => void
): GroundTruthItem[] {
  let modified = 0;
  let deleted = 0;

  // Start with AI items
  const items: GroundTruthItem[] = [];

  for (let i = 0; i < aiItems.length; i++) {
    const aiItem = aiItems[i];
    const correction = itemCorrections?.[String(i)];

    // Check if item should be deleted
    if (correction?.delete) {
      deleted++;
      continue; // Skip this item
    }

    // Apply corrections to this item
    const item: GroundTruthItem = {
      name: correction?.name ?? aiItem.name,
      price: correction?.price ?? aiItem.price,
      category: correction?.category ?? aiItem.category,
    };

    // Track if any field was modified
    if (correction?.name !== undefined || correction?.price !== undefined || correction?.category !== undefined) {
      modified++;
    }

    items.push(item);
  }

  // Add new items that AI missed
  const added = addItems?.length ?? 0;
  if (addItems) {
    for (const addItem of addItems) {
      items.push({
        name: addItem.name,
        price: addItem.price,
        category: addItem.category,
      });
    }
  }

  // Report stats
  statsCallback(modified, deleted, added);

  return items;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if a test case has any corrections.
 *
 * @param testCase - Test case to check
 * @returns True if corrections exist and are not empty
 */
export function hasCorrections(testCase: TestCaseFile): boolean {
  const { corrections } = testCase;
  if (!corrections) return false;

  return (
    corrections.merchant !== undefined ||
    corrections.date !== undefined ||
    corrections.total !== undefined ||
    corrections.category !== undefined ||
    (corrections.items !== undefined && Object.keys(corrections.items).length > 0) ||
    (corrections.addItems !== undefined && corrections.addItems.length > 0)
  );
}

/**
 * Summarizes the ground truth computation for logging/debugging.
 *
 * @param groundTruth - Computed ground truth
 * @returns Human-readable summary string
 */
export function summarizeGroundTruth(groundTruth: GroundTruth): string {
  const { _source } = groundTruth;
  const parts: string[] = [];

  if (_source.hasAiExtraction && _source.hasCorrections) {
    parts.push('AI + Corrections');
  } else if (_source.hasAiExtraction) {
    parts.push('AI only');
  } else {
    parts.push('Corrections only');
  }

  if (_source.correctedFields.length > 0) {
    parts.push(`corrected: [${_source.correctedFields.join(', ')}]`);
  }

  if (_source.itemsModified > 0 || _source.itemsDeleted > 0 || _source.itemsAdded > 0) {
    const itemChanges: string[] = [];
    if (_source.itemsModified > 0) itemChanges.push(`${_source.itemsModified} modified`);
    if (_source.itemsDeleted > 0) itemChanges.push(`${_source.itemsDeleted} deleted`);
    if (_source.itemsAdded > 0) itemChanges.push(`${_source.itemsAdded} added`);
    parts.push(`items: ${itemChanges.join(', ')}`);
  }

  return parts.join(' | ');
}
