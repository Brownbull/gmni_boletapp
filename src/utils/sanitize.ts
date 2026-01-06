/**
 * Input Sanitization Utilities
 *
 * Story 14.15: Scan Flow Integration - Security Enhancement
 *
 * Provides functions to sanitize user input before storing in Firestore.
 * Protects against XSS, injection attacks, and ensures data integrity.
 */

/**
 * Characters that could be used for script injection or special formatting
 * Note: Using simpler patterns to avoid ReDoS (catastrophic backtracking)
 */
const DANGEROUS_PATTERNS = [
  /<script[\s\S]*?<\/script>/gi, // Script tags (non-greedy match)
  /<[^>]*on\w+\s*=/gi, // Event handlers like onclick, onload, etc.
  /javascript:/gi, // JavaScript protocol
  /data:/gi, // Data URLs (can contain scripts)
  /vbscript:/gi, // VBScript protocol
];

/**
 * Control characters that should be removed (except newlines and tabs in some contexts)
 */
const CONTROL_CHAR_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Sanitizes a text input string for safe storage and display.
 *
 * This function:
 * 1. Trims leading/trailing whitespace
 * 2. Removes control characters (except newlines/tabs)
 * 3. Removes dangerous HTML/script patterns
 * 4. Normalizes multiple spaces to single space
 * 5. Limits string length to prevent DoS
 *
 * @param input - The raw user input string
 * @param options - Configuration options
 * @returns The sanitized string
 *
 * @example
 * sanitizeInput('  Hello World  ') // Returns "Hello World"
 * sanitizeInput('<script>alert("xss")</script>Test') // Returns "Test"
 * sanitizeInput('Name\x00with\x01control') // Returns "Namewithcontrol"
 */
export function sanitizeInput(
  input: string | null | undefined,
  options: {
    /** Maximum allowed length (default: 1000) */
    maxLength?: number;
    /** Allow newlines in the text (default: false) */
    allowNewlines?: boolean;
    /** Allow tabs in the text (default: false) */
    allowTabs?: boolean;
  } = {}
): string {
  const { maxLength = 1000, allowNewlines = false, allowTabs = false } = options;

  // Handle null/undefined
  if (input == null) return '';

  let result = String(input);

  // 1. Remove dangerous patterns (script tags, event handlers, etc.)
  for (const pattern of DANGEROUS_PATTERNS) {
    result = result.replace(pattern, '');
  }

  // 2. Remove control characters
  result = result.replace(CONTROL_CHAR_REGEX, '');

  // 3. Handle newlines and tabs based on options
  if (!allowNewlines) {
    result = result.replace(/[\r\n]/g, ' ');
  }
  if (!allowTabs) {
    result = result.replace(/\t/g, ' ');
  }

  // 4. Normalize multiple spaces to single space
  result = result.replace(/\s+/g, ' ');

  // 5. Trim whitespace
  result = result.trim();

  // 6. Limit length to prevent DoS
  if (result.length > maxLength) {
    result = result.substring(0, maxLength);
  }

  return result;
}

/**
 * Sanitizes a merchant name with appropriate settings.
 *
 * @param name - The merchant name from user input
 * @returns Sanitized merchant name
 */
export function sanitizeMerchantName(name: string | null | undefined): string {
  return sanitizeInput(name, { maxLength: 200 });
}

/**
 * Sanitizes an item name with appropriate settings.
 *
 * @param name - The item name from user input
 * @returns Sanitized item name
 */
export function sanitizeItemName(name: string | null | undefined): string {
  return sanitizeInput(name, { maxLength: 200 });
}

/**
 * Sanitizes a location (city/country) name.
 *
 * @param location - The location string from user input
 * @returns Sanitized location string
 */
export function sanitizeLocation(location: string | null | undefined): string {
  return sanitizeInput(location, { maxLength: 100 });
}

/**
 * Sanitizes a subcategory string.
 *
 * @param subcategory - The subcategory from user input
 * @returns Sanitized subcategory string
 */
export function sanitizeSubcategory(subcategory: string | null | undefined): string {
  return sanitizeInput(subcategory, { maxLength: 100 });
}

/**
 * Validates and sanitizes a numeric string input.
 * Returns the sanitized string or empty string if invalid.
 *
 * @param value - The numeric string from user input
 * @returns Sanitized numeric string
 */
export function sanitizeNumericInput(value: string | null | undefined): string {
  if (value == null) return '';

  // Remove anything that's not a digit, decimal point, or minus sign
  const cleaned = String(value).replace(/[^\d.-]/g, '');

  // Ensure only one decimal point and one minus at the start
  const parts = cleaned.split('.');
  let result = parts[0];
  if (parts.length > 1) {
    result += '.' + parts.slice(1).join('');
  }

  // Ensure minus is only at the start
  if (result.includes('-')) {
    const isNegative = result.startsWith('-');
    result = result.replace(/-/g, '');
    if (isNegative) {
      result = '-' + result;
    }
  }

  return result;
}
