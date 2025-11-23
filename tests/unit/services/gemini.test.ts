/**
 * Gemini AI Service Unit Tests
 *
 * Tests the receipt scanning functionality using mocked Gemini API responses.
 * Covers 6+ test cases as defined in Story 2.5.
 *
 * Risk Level: HIGH (AI-powered core feature)
 * Coverage: Gemini API integration, OCR processing, error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { analyzeReceipt } from '../../../src/services/gemini';
import geminiResponses from '../../fixtures/gemini-responses.json';

// Mock the global fetch function
global.fetch = vi.fn();

describe('Gemini AI Service', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
  });

  /**
   * Test 1: Image upload preprocesses correctly
   * Verifies that base64 images are correctly formatted for the API
   */
  it('should preprocess base64 images correctly', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => geminiResponses.successfulReceipt
    } as Response);

    const base64Image = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlbaWmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD5/ooooA//2Q==';

    await analyzeReceipt([base64Image], 'USD');

    // Verify fetch was called with correct payload structure
    expect(mockFetch).toHaveBeenCalledOnce();
    const callArgs = mockFetch.mock.calls[0];
    const requestBody = JSON.parse(callArgs[1]?.body as string);

    expect(requestBody.contents).toBeDefined();
    expect(requestBody.contents[0].parts).toHaveLength(2); // text prompt + image
    expect(requestBody.contents[0].parts[1].inlineData).toBeDefined();
    expect(requestBody.contents[0].parts[1].inlineData.mimeType).toBe('image/jpeg');
    expect(requestBody.contents[0].parts[1].inlineData.data).not.toContain('data:image'); // Base64 prefix should be stripped
  });

  /**
   * Test 2: Gemini API called with correct payload
   * Verifies that the API is called with the proper structure and prompt
   */
  it('should call Gemini API with correct payload structure', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => geminiResponses.successfulReceipt
    } as Response);

    const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    await analyzeReceipt([testImage], 'CLP');

    expect(mockFetch).toHaveBeenCalledOnce();
    const callArgs = mockFetch.mock.calls[0];

    // Verify URL structure
    expect(callArgs[0]).toContain('generativelanguage.googleapis.com');
    expect(callArgs[0]).toContain('generateContent');

    // Verify request body
    const requestBody = JSON.parse(callArgs[1]?.body as string);
    expect(requestBody.contents[0].parts[0].text).toContain('CLP'); // Currency in prompt
    expect(requestBody.contents[0].parts[0].text).toContain('Analyze receipt');
  });

  /**
   * Test 3: OCR result parsed successfully
   * Verifies that the Gemini response is correctly parsed into a Transaction object
   */
  it('should parse OCR result successfully', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => geminiResponses.successfulReceipt
    } as Response);

    const testImage = 'data:image/jpeg;base64,test';
    const result = await analyzeReceipt([testImage], 'USD');

    expect(result).toBeDefined();
    expect(result.merchant).toBe('Whole Foods Market');
    expect(result.date).toBe('2025-11-23');
    expect(result.total).toBe(8743);
    expect(result.category).toBe('Supermarket');
    expect(result.items).toHaveLength(3);
  });

  /**
   * Test 4: Transaction fields extracted (date, total, category)
   * Verifies that all required transaction fields are extracted correctly
   */
  it('should extract all transaction fields correctly', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => geminiResponses.restaurantReceipt
    } as Response);

    const testImage = 'data:image/jpeg;base64,test';
    const result = await analyzeReceipt([testImage], 'USD');

    // Verify all required fields
    expect(result.merchant).toBe('Pizza Palace');
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/); // ISO date format
    expect(typeof result.total).toBe('number');
    expect(result.total).toBe(4200);
    expect(result.category).toBe('Restaurant');

    // Verify items array
    expect(Array.isArray(result.items)).toBe(true);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].name).toBe('Large Pepperoni Pizza');
    expect(result.items[0].price).toBe(1899);
  });

  /**
   * Test 5: Error handling for invalid images
   * Verifies that invalid image errors are properly handled
   */
  it('should handle invalid image errors', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => geminiResponses.invalidImageError
    } as Response);

    const invalidImage = 'data:text/plain;base64,notanimage';

    await expect(analyzeReceipt([invalidImage], 'USD')).rejects.toThrow();
  });

  /**
   * Test 6: Error handling for Gemini API failures
   * Verifies that API errors (auth, quota, service errors) are properly handled
   */
  it('should handle Gemini API authentication errors', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => geminiResponses.apiKeyError
    } as Response);

    const testImage = 'data:image/jpeg;base64,test';

    await expect(analyzeReceipt([testImage], 'USD')).rejects.toThrow();
  });

  it('should handle Gemini API quota exceeded errors', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => geminiResponses.quotaExceededError
    } as Response);

    const testImage = 'data:image/jpeg;base64,test';

    await expect(analyzeReceipt([testImage], 'USD')).rejects.toThrow();
  });

  it('should handle Gemini API service errors', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => geminiResponses.serviceError
    } as Response);

    const testImage = 'data:image/jpeg;base64,test';

    await expect(analyzeReceipt([testImage], 'USD')).rejects.toThrow();
  });

  /**
   * Bonus Test: Handle malformed JSON responses
   * Verifies that malformed responses are handled gracefully
   */
  it('should handle malformed JSON responses', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => geminiResponses.malformedResponse
    } as Response);

    const testImage = 'data:image/jpeg;base64,test';

    // The cleanJson utility extracts "{}" from malformed text, which parses as empty object
    const result = await analyzeReceipt([testImage], 'USD');
    expect(result).toEqual({});
  });

  /**
   * Bonus Test: Handle multiple images
   * Verifies that multiple images can be sent in a single request
   */
  it('should handle multiple images in a single request', async () => {
    const mockFetch = vi.mocked(global.fetch);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => geminiResponses.successfulReceipt
    } as Response);

    const images = [
      'data:image/jpeg;base64,image1',
      'data:image/png;base64,image2',
      'data:image/webp;base64,image3'
    ];

    await analyzeReceipt(images, 'USD');

    expect(mockFetch).toHaveBeenCalledOnce();
    const callArgs = mockFetch.mock.calls[0];
    const requestBody = JSON.parse(callArgs[1]?.body as string);

    // Should have 1 text prompt + 3 images = 4 parts
    expect(requestBody.contents[0].parts).toHaveLength(4);
    expect(requestBody.contents[0].parts[1].inlineData.mimeType).toBe('image/jpeg');
    expect(requestBody.contents[0].parts[2].inlineData.mimeType).toBe('image/png');
    expect(requestBody.contents[0].parts[3].inlineData.mimeType).toBe('image/webp');
  });
});
