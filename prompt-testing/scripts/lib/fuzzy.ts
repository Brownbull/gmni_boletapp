/**
 * Fuzzy String Matching Module
 *
 * Provides string similarity functions for comparing merchant names
 * and other text fields where exact matching is too strict.
 *
 * Uses Dice coefficient (Sørensen–Dice) for similarity calculation,
 * which compares bigram (2-character) sets between strings.
 *
 * @see docs/sprint-artifacts/epic8/story-8.4-result-comparison-engine.md
 */

import { CONFIG } from '../config';

// ============================================================================
// Constants
// ============================================================================

/**
 * Minimum similarity threshold for merchant name matching.
 * A score >= 0.8 is considered a match.
 */
export const MERCHANT_SIMILARITY_THRESHOLD = CONFIG.thresholds.merchant.fuzzyThreshold ?? 0.8;

// ============================================================================
// String Normalization
// ============================================================================

/**
 * Normalizes a string for comparison by:
 * 1. Converting to lowercase
 * 2. Trimming whitespace
 * 3. Collapsing multiple spaces to single space
 * 4. Removing accents/diacritics (for Chilean stores like Líder → Lider)
 *
 * @param str - String to normalize
 * @returns Normalized string
 *
 * @example
 * normalizeString("  JUMBO  Las  Condes  ") // "jumbo las condes"
 * normalizeString("LÍDER") // "lider"
 */
export function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
}

// ============================================================================
// Bigram Generation
// ============================================================================

/**
 * Generates bigrams (pairs of consecutive characters) from a string.
 * Used for Dice coefficient calculation.
 *
 * @param str - Input string (should be normalized first)
 * @returns Map of bigrams to their counts
 *
 * @example
 * getBigrams("hello") // Map { "he" => 1, "el" => 1, "ll" => 1, "lo" => 1 }
 */
function getBigrams(str: string): Map<string, number> {
  const bigrams = new Map<string, number>();

  for (let i = 0; i < str.length - 1; i++) {
    const bigram = str.substring(i, i + 2);
    bigrams.set(bigram, (bigrams.get(bigram) || 0) + 1);
  }

  return bigrams;
}

/**
 * Counts the intersection of two bigram maps.
 *
 * @param bigrams1 - First bigram map
 * @param bigrams2 - Second bigram map
 * @returns Count of shared bigrams (taking frequency into account)
 */
function countIntersection(bigrams1: Map<string, number>, bigrams2: Map<string, number>): number {
  let intersection = 0;

  for (const [bigram, count1] of bigrams1) {
    const count2 = bigrams2.get(bigram) || 0;
    intersection += Math.min(count1, count2);
  }

  return intersection;
}

// ============================================================================
// Similarity Calculation
// ============================================================================

/**
 * Calculates Dice coefficient (Sørensen–Dice) similarity between two strings.
 *
 * Formula: 2 * |intersection| / (|set1| + |set2|)
 *
 * The coefficient ranges from 0 (no similarity) to 1 (identical).
 *
 * @param str1 - First string
 * @param str2 - Second string
 * @returns Similarity score between 0 and 1
 *
 * @example
 * stringSimilarity("JUMBO", "Jumbo") // 1.0 (after normalization)
 * stringSimilarity("JUMBO", "Jumbo Av. Las Condes") // ~0.5
 * stringSimilarity("JUMBO", "WALMART") // ~0.0
 */
export function stringSimilarity(str1: string, str2: string): number {
  // Normalize both strings
  const normalized1 = normalizeString(str1);
  const normalized2 = normalizeString(str2);

  // Handle empty strings edge case first
  if (normalized1.length === 0 || normalized2.length === 0) {
    return 0.0;
  }

  // Handle identical strings
  if (normalized1 === normalized2) {
    return 1.0;
  }

  // Single character strings can't form bigrams
  if (normalized1.length === 1 && normalized2.length === 1) {
    return normalized1 === normalized2 ? 1.0 : 0.0;
  }

  // If one string is a single character, check if it's contained in the other
  if (normalized1.length === 1) {
    return normalized2.includes(normalized1) ? 0.5 : 0.0;
  }
  if (normalized2.length === 1) {
    return normalized1.includes(normalized2) ? 0.5 : 0.0;
  }

  // Generate bigrams
  const bigrams1 = getBigrams(normalized1);
  const bigrams2 = getBigrams(normalized2);

  // Calculate total bigrams
  const total1 = normalized1.length - 1;
  const total2 = normalized2.length - 1;

  // Calculate intersection
  const intersection = countIntersection(bigrams1, bigrams2);

  // Dice coefficient formula
  return (2 * intersection) / (total1 + total2);
}

// ============================================================================
// Merchant Comparison
// ============================================================================

/**
 * Checks if two merchant names are considered a match based on fuzzy similarity.
 *
 * Uses the MERCHANT_SIMILARITY_THRESHOLD (default 0.8) to determine if
 * the similarity is high enough to be considered a match.
 *
 * @param expected - Expected merchant name
 * @param actual - Actual merchant name from AI
 * @param threshold - Optional custom threshold (default: MERCHANT_SIMILARITY_THRESHOLD)
 * @returns Whether the merchants are considered a match
 *
 * @example
 * isMerchantMatch("JUMBO", "Jumbo") // true (similarity = 1.0)
 * isMerchantMatch("JUMBO", "Jumbo Las Condes") // depends on similarity score
 * isMerchantMatch("JUMBO", "WALMART") // false (similarity < 0.8)
 */
export function isMerchantMatch(
  expected: string,
  actual: string,
  threshold: number = MERCHANT_SIMILARITY_THRESHOLD
): boolean {
  return stringSimilarity(expected, actual) >= threshold;
}

/**
 * Compares two merchant names and returns detailed comparison result.
 *
 * @param expected - Expected merchant name
 * @param actual - Actual merchant name from AI
 * @param threshold - Optional custom threshold (default: MERCHANT_SIMILARITY_THRESHOLD)
 * @returns Object with similarity score and match status
 *
 * @example
 * compareMerchants("JUMBO", "Jumbo Las Condes")
 * // { expected: "JUMBO", actual: "Jumbo Las Condes", similarity: 0.52, match: false }
 */
export function compareMerchants(
  expected: string,
  actual: string,
  threshold: number = MERCHANT_SIMILARITY_THRESHOLD
): {
  expected: string;
  actual: string;
  similarity: number;
  match: boolean;
} {
  const similarity = stringSimilarity(expected, actual);
  return {
    expected,
    actual,
    similarity,
    match: similarity >= threshold,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Finds the best match for a string from a list of candidates.
 *
 * @param target - String to match
 * @param candidates - List of candidate strings
 * @returns Best matching candidate with similarity score, or null if no candidates
 *
 * @example
 * findBestMatch("JUMBO", ["Jumbo", "Lider", "Walmart"])
 * // { candidate: "Jumbo", similarity: 1.0, index: 0 }
 */
export function findBestMatch(
  target: string,
  candidates: string[]
): { candidate: string; similarity: number; index: number } | null {
  if (candidates.length === 0) {
    return null;
  }

  let bestMatch = {
    candidate: candidates[0],
    similarity: stringSimilarity(target, candidates[0]),
    index: 0,
  };

  for (let i = 1; i < candidates.length; i++) {
    const similarity = stringSimilarity(target, candidates[i]);
    if (similarity > bestMatch.similarity) {
      bestMatch = { candidate: candidates[i], similarity, index: i };
    }
  }

  return bestMatch;
}
