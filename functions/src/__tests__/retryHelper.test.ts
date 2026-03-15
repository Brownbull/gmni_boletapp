import {
  GoogleGenerativeAIFetchError,
  GoogleGenerativeAIRequestInputError,
  GoogleGenerativeAIResponseError,
} from '@google/generative-ai'
import * as functions from 'firebase-functions'
import { withRetry, isTransientGeminiError } from '../utils/retryHelper'

// Suppress console.warn during tests (retry logging)
beforeEach(() => {
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  jest.restoreAllMocks()
})

describe('isTransientGeminiError', () => {
  it('returns true for 5xx server errors', () => {
    expect(isTransientGeminiError(
      new GoogleGenerativeAIFetchError('fail', 503, 'Service Unavailable')
    )).toBe(true)
    expect(isTransientGeminiError(
      new GoogleGenerativeAIFetchError('fail', 500, 'Internal Server Error')
    )).toBe(true)
    expect(isTransientGeminiError(
      new GoogleGenerativeAIFetchError('fail', 502, 'Bad Gateway')
    )).toBe(true)
  })

  it('returns true for network errors (no HTTP status)', () => {
    // GoogleGenerativeAIFetchError with undefined status = network failure
    const networkErr = new GoogleGenerativeAIFetchError('ECONNRESET')
    expect(isTransientGeminiError(networkErr)).toBe(true)
  })

  it('returns true for errors with transient message keywords', () => {
    const err = new Error('socket hang up')
    expect(isTransientGeminiError(err)).toBe(true)

    const err2 = new Error('ETIMEDOUT')
    expect(isTransientGeminiError(err2)).toBe(true)

    const err3 = new Error('The model is overloaded')
    expect(isTransientGeminiError(err3)).toBe(true)

    const err4 = new Error('Service unavailable')
    expect(isTransientGeminiError(err4)).toBe(true)
  })

  it('returns false for 400 client errors', () => {
    expect(isTransientGeminiError(
      new GoogleGenerativeAIFetchError('bad request', 400, 'Bad Request')
    )).toBe(false)
  })

  it('returns false for 429 rate limit', () => {
    expect(isTransientGeminiError(
      new GoogleGenerativeAIFetchError('rate limited', 429, 'Too Many Requests')
    )).toBe(false)
  })

  it('returns false for 401/403 auth errors', () => {
    expect(isTransientGeminiError(
      new GoogleGenerativeAIFetchError('unauthorized', 401, 'Unauthorized')
    )).toBe(false)
    expect(isTransientGeminiError(
      new GoogleGenerativeAIFetchError('forbidden', 403, 'Forbidden')
    )).toBe(false)
  })

  it('returns false for GoogleGenerativeAIRequestInputError', () => {
    expect(isTransientGeminiError(
      new GoogleGenerativeAIRequestInputError('bad input')
    )).toBe(false)
  })

  it('returns false for GoogleGenerativeAIResponseError', () => {
    expect(isTransientGeminiError(
      new GoogleGenerativeAIResponseError('safety block', { candidates: [] } as any)
    )).toBe(false)
  })

  it('returns false for HttpsError', () => {
    expect(isTransientGeminiError(
      new functions.https.HttpsError('internal', 'our own validation error')
    )).toBe(false)
  })

  it('returns false for generic errors without transient keywords', () => {
    expect(isTransientGeminiError(new Error('something broke'))).toBe(false)
  })
})

describe('withRetry', () => {
  it('returns result on first success without delay', async () => {
    const fn = jest.fn().mockResolvedValue('success')

    const result = await withRetry(fn, isTransientGeminiError, {
      maxRetries: 1,
      delayMs: 2000,
    })

    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on transient error and returns success', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new GoogleGenerativeAIFetchError('fail', 503, 'Service Unavailable'))
      .mockResolvedValueOnce('retry-success')

    const result = await withRetry(fn, isTransientGeminiError, {
      maxRetries: 1,
      delayMs: 50, // Short delay for tests
    })

    expect(result).toBe('retry-success')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('throws after exhausting retries on transient error', async () => {
    const error = new GoogleGenerativeAIFetchError('fail', 503, 'Service Unavailable')
    const fn = jest.fn().mockRejectedValue(error)

    await expect(
      withRetry(fn, isTransientGeminiError, { maxRetries: 1, delayMs: 50 })
    ).rejects.toThrow(error)

    expect(fn).toHaveBeenCalledTimes(2) // original + 1 retry
  })

  it('throws immediately on permanent error without retrying', async () => {
    const error = new GoogleGenerativeAIRequestInputError('bad input')
    const fn = jest.fn().mockRejectedValue(error)

    await expect(
      withRetry(fn, isTransientGeminiError, { maxRetries: 1, delayMs: 50 })
    ).rejects.toThrow(error)

    expect(fn).toHaveBeenCalledTimes(1) // no retry
  })

  it('throws immediately on 429 rate limit without retrying', async () => {
    const error = new GoogleGenerativeAIFetchError('rate limited', 429, 'Too Many Requests')
    const fn = jest.fn().mockRejectedValue(error)

    await expect(
      withRetry(fn, isTransientGeminiError, { maxRetries: 1, delayMs: 50 })
    ).rejects.toThrow(error)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('throws immediately on HttpsError without retrying', async () => {
    const error = new functions.https.HttpsError('internal', 'validation failed')
    const fn = jest.fn().mockRejectedValue(error)

    await expect(
      withRetry(fn, isTransientGeminiError, { maxRetries: 1, delayMs: 50 })
    ).rejects.toThrow(error)

    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries network errors (no status code)', async () => {
    const fn = jest.fn()
      .mockRejectedValueOnce(new GoogleGenerativeAIFetchError('ECONNRESET'))
      .mockResolvedValueOnce('recovered')

    const result = await withRetry(fn, isTransientGeminiError, {
      maxRetries: 1,
      delayMs: 50,
    })

    expect(result).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('respects maxRetries=0 (no retries)', async () => {
    const error = new GoogleGenerativeAIFetchError('fail', 503, 'Service Unavailable')
    const fn = jest.fn().mockRejectedValue(error)

    await expect(
      withRetry(fn, isTransientGeminiError, { maxRetries: 0, delayMs: 50 })
    ).rejects.toThrow(error)

    expect(fn).toHaveBeenCalledTimes(1)
  })
})
