/**
 * JSON repair utility for Gemini AI responses.
 *
 * TD-18-17: Gemini occasionally returns malformed JSON with unquoted keys,
 * single quotes, trailing commas, or inline comments. This utility repairs
 * these patterns before JSON.parse.
 *
 * Runs server-side only (Cloud Functions). Reusable for both receipt and
 * statement scanning pipelines.
 */

/**
 * Repair known Gemini JSON malformation patterns.
 *
 * Applied in order:
 * 1. Strip inline comments (// and block)
 * 2. Quote unquoted property keys
 * 3. Convert single-quoted strings to double-quoted
 * 4. Remove trailing commas before } or ]
 *
 * @param text - Raw text that should be JSON but may have malformations
 * @returns Repaired text suitable for JSON.parse
 */
export function repairJson(text: string): string {
  // Guard against pathological input (ReDoS mitigation — Gemini responses are ~few KB)
  if (text.length > 524_288) {
    throw new Error('jsonRepair: input exceeds 512KB limit')
  }

  let result = text

  // 1. Strip // line comments — skip :// (URLs) to avoid corrupting string values
  //    Limitation: not fully string-aware. Safe for Gemini receipt/statement output
  //    which has no URL fields. If schema adds URLs, upgrade to string-aware parser.
  result = result.replace(/(?<!:)\/\/[^\n]*/g, '')

  // 2. Strip /* block comments */
  result = result.replace(/\/\*[\s\S]*?\*\//g, '')

  // 3. Quote unquoted property keys: {key: or ,key: → {"key": or ,"key":
  //    Matches word chars after { or , (with optional whitespace)
  result = result.replace(/([\{,]\s*)([a-zA-Z_]\w*)\s*:/g, '$1"$2":')

  // 4. Convert single-quoted strings to double-quoted
  //    Matches 'content' and replaces with "content"
  //    Handles escaped single quotes inside
  result = result.replace(/'((?:[^'\\]|\\.)*)'/g, (_, content: string) => {
    // Escape any unescaped double quotes inside the value
    const escaped = content.replace(/(?<!\\)"/g, '\\"')
    // Unescape escaped single quotes (no longer needed in double-quoted string)
    const cleaned = escaped.replace(/\\'/g, "'")
    return `"${cleaned}"`
  })

  // 5. Remove trailing commas before } or ]
  result = result.replace(/,\s*([\}\]])/g, '$1')

  return result
}

/**
 * Parse JSON with automatic repair fallback.
 *
 * Tries native JSON.parse first (zero overhead on well-formed input).
 * On failure, applies repairJson and retries. If repair also fails,
 * throws the ORIGINAL error for accurate debugging.
 *
 * @param text - Text to parse as JSON
 * @returns Parsed JSON value
 * @throws Original SyntaxError if repair cannot fix the input
 */
export function parseJsonWithRepair(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch (originalError) {
    const repaired = repairJson(text)
    try {
      const result = JSON.parse(repaired)
      console.warn('jsonRepair: JSON repair applied — Gemini returned malformed JSON')
      return result
    } catch {
      throw originalError
    }
  }
}
