/**
 * Retry helper for Cloud Function API calls.
 *
 * TD-18-4: Wraps async functions with configurable retry logic.
 * Only retries transient errors (network, 5xx, overload).
 * Never retries permanent errors (4xx, validation, rate limit).
 */

import {
  GoogleGenerativeAIFetchError,
  GoogleGenerativeAIRequestInputError,
  GoogleGenerativeAIResponseError,
} from '@google/generative-ai'
import * as functions from 'firebase-functions'

/** Default retry delay for Gemini API calls (milliseconds) */
export const GEMINI_RETRY_DELAY_MS = 2000

export interface RetryOptions {
  /** Maximum number of retries (0 = no retries) */
  maxRetries: number
  /** Delay between retries in milliseconds */
  delayMs: number
}

/** Transient error message keywords that indicate retriable failures */
const TRANSIENT_KEYWORDS = [
  'econnreset',
  'etimedout',
  'enotfound',
  'socket hang up',
  'overloaded',
  'unavailable',
]

/**
 * Classify whether a Gemini API error is transient (retriable).
 *
 * RETRY (transient):
 * - GoogleGenerativeAIFetchError with 5xx status (server errors)
 * - GoogleGenerativeAIFetchError with no status (network failure)
 * - Errors with transient message keywords (ECONNRESET, ETIMEDOUT, etc.)
 *
 * NO RETRY (permanent):
 * - GoogleGenerativeAIRequestInputError (bad input)
 * - GoogleGenerativeAIResponseError (safety block, parse error)
 * - GoogleGenerativeAIFetchError with 4xx status (client errors, rate limit)
 * - HttpsError (our own validation errors)
 * - Anything else
 */
export function isTransientGeminiError(error: unknown): boolean {
  // Never retry our own validation errors
  if (error instanceof functions.https.HttpsError) {
    return false
  }

  // Never retry input errors (bad image, invalid request)
  if (error instanceof GoogleGenerativeAIRequestInputError) {
    return false
  }

  // Never retry response errors (safety block, deterministic)
  if (error instanceof GoogleGenerativeAIResponseError) {
    return false
  }

  // Classify fetch errors by HTTP status
  if (error instanceof GoogleGenerativeAIFetchError) {
    const status = error.status
    // No status = network failure (no HTTP response received) → transient
    if (status === undefined) {
      return true
    }
    // 5xx = server error → transient
    if (status >= 500 && status < 600) {
      return true
    }
    // 4xx (including 429 rate limit) = client/quota error → permanent
    return false
  }

  // For generic errors, check message for transient keywords
  if (error instanceof Error) {
    const msg = error.message.toLowerCase()
    return TRANSIENT_KEYWORDS.some(keyword => msg.includes(keyword))
  }

  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Execute an async function with retry logic.
 *
 * @param fn - Async function to execute
 * @param shouldRetry - Error classifier (returns true for retriable errors)
 * @param options - Retry configuration
 * @returns Result of fn() on success
 * @throws Original error if all retries exhausted or error is permanent
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  shouldRetry: (error: unknown) => boolean,
  options: RetryOptions
): Promise<T> {
  let lastError: unknown
  const attempts = 1 + options.maxRetries // original + retries

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry if error is permanent or we've exhausted retries
      if (!shouldRetry(error) || attempt >= attempts) {
        throw error
      }

      const errMsg = error instanceof Error ? error.message.slice(0, 200) : String(error).slice(0, 200)
      console.warn(
        `withRetry: attempt ${attempt}/${attempts} failed, retrying in ${options.delayMs}ms`,
        errMsg
      )

      await sleep(options.delayMs)
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError
}
