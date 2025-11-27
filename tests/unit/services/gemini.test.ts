/**
 * Gemini AI Service Unit Tests
 *
 * Tests the receipt scanning functionality using mocked Firebase Cloud Functions.
 * The actual Gemini API calls happen server-side - this tests the client-side interface.
 *
 * Risk Level: HIGH (AI-powered core feature)
 * Coverage: Cloud Function integration, error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Firebase modules before importing the service
vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  httpsCallable: vi.fn()
}));

vi.mock('../../../src/config/firebase', () => ({
  app: {}
}));

// Import after mocking
import { httpsCallable } from 'firebase/functions';
import { analyzeReceipt } from '../../../src/services/gemini';
import geminiResponses from '../../fixtures/gemini-responses.json';

describe('Gemini AI Service (Cloud Function)', () => {
  const mockCallable = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup httpsCallable to return a mock function
    vi.mocked(httpsCallable).mockReturnValue(mockCallable);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /**
   * Test 1: Cloud Function called with correct parameters
   */
  it('should call Cloud Function with images and currency', async () => {
    mockCallable.mockResolvedValueOnce({
      data: {
        merchant: 'Test Store',
        date: '2025-11-23',
        total: 1000,
        category: 'Supermarket',
        items: []
      }
    });

    const images = ['data:image/jpeg;base64,test123'];
    await analyzeReceipt(images, 'USD');

    expect(httpsCallable).toHaveBeenCalledWith(expect.anything(), 'analyzeReceipt');
    expect(mockCallable).toHaveBeenCalledWith({ images, currency: 'USD' });
  });

  /**
   * Test 2: Successful receipt analysis
   */
  it('should return parsed transaction data on success', async () => {
    const expectedTransaction = {
      merchant: 'Whole Foods Market',
      date: '2025-11-23',
      total: 8743,
      category: 'Supermarket',
      items: [
        { name: 'Organic Bananas', price: 299, category: 'Produce' },
        { name: 'Almond Milk', price: 549, category: 'Dairy' },
        { name: 'Whole Grain Bread', price: 499, category: 'Bakery' }
      ]
    };

    mockCallable.mockResolvedValueOnce({ data: expectedTransaction });

    const result = await analyzeReceipt(['data:image/jpeg;base64,test'], 'USD');

    expect(result).toEqual(expectedTransaction);
    expect(result.merchant).toBe('Whole Foods Market');
    expect(result.total).toBe(8743);
    expect(result.items).toHaveLength(3);
  });

  /**
   * Test 3: Transaction fields extracted correctly
   */
  it('should extract all required transaction fields', async () => {
    mockCallable.mockResolvedValueOnce({
      data: {
        merchant: 'Pizza Palace',
        date: '2025-11-22',
        total: 4200,
        category: 'Restaurant',
        items: [{ name: 'Large Pepperoni Pizza', price: 1899, category: 'Food' }]
      }
    });

    const result = await analyzeReceipt(['data:image/jpeg;base64,test'], 'CLP');

    expect(result.merchant).toBe('Pizza Palace');
    expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof result.total).toBe('number');
    expect(result.category).toBe('Restaurant');
    expect(Array.isArray(result.items)).toBe(true);
  });

  /**
   * Test 4: Handle authentication errors
   */
  it('should handle unauthenticated errors', async () => {
    const authError = { code: 'unauthenticated', message: 'User not authenticated' };
    mockCallable.mockRejectedValueOnce(authError);

    await expect(analyzeReceipt(['data:image/jpeg;base64,test'], 'USD'))
      .rejects.toThrow('You must be logged in to scan receipts.');
  });

  /**
   * Test 5: Handle invalid argument errors
   */
  it('should handle invalid argument errors', async () => {
    const invalidArgError = { code: 'invalid-argument', message: 'Invalid image data' };
    mockCallable.mockRejectedValueOnce(invalidArgError);

    await expect(analyzeReceipt(['invalid'], 'USD'))
      .rejects.toThrow('Invalid receipt data. Please try again.');
  });

  /**
   * Test 6: Handle rate limiting errors
   */
  it('should handle rate limiting errors', async () => {
    const rateLimitError = { code: 'resource-exhausted', message: 'Rate limit exceeded' };
    mockCallable.mockRejectedValueOnce(rateLimitError);

    await expect(analyzeReceipt(['data:image/jpeg;base64,test'], 'USD'))
      .rejects.toThrow('Too many requests. Please wait a moment and try again.');
  });

  /**
   * Test 7: Handle generic errors
   */
  it('should handle generic errors with fallback message', async () => {
    mockCallable.mockRejectedValueOnce(new Error('Network error'));

    await expect(analyzeReceipt(['data:image/jpeg;base64,test'], 'USD'))
      .rejects.toThrow('Failed to analyze receipt. Please try again or enter manually.');
  });

  /**
   * Test 8: Handle errors with custom message
   */
  it('should preserve custom error messages from server', async () => {
    const customError = { code: 'internal', message: 'Custom server error message' };
    mockCallable.mockRejectedValueOnce(customError);

    await expect(analyzeReceipt(['data:image/jpeg;base64,test'], 'USD'))
      .rejects.toThrow('Custom server error message');
  });

  /**
   * Test 9: Handle multiple images
   */
  it('should handle multiple images in a single request', async () => {
    mockCallable.mockResolvedValueOnce({
      data: {
        merchant: 'Multi-page Receipt Store',
        date: '2025-11-23',
        total: 5000,
        category: 'Retail',
        items: []
      }
    });

    const images = [
      'data:image/jpeg;base64,page1',
      'data:image/jpeg;base64,page2',
      'data:image/jpeg;base64,page3'
    ];

    await analyzeReceipt(images, 'USD');

    expect(mockCallable).toHaveBeenCalledWith({
      images,
      currency: 'USD'
    });
  });

  /**
   * Test 10: Currency is passed correctly
   */
  it('should pass currency parameter to Cloud Function', async () => {
    mockCallable.mockResolvedValueOnce({
      data: {
        merchant: 'Chilean Store',
        date: '2025-11-23',
        total: 100000,
        category: 'Retail',
        items: []
      }
    });

    await analyzeReceipt(['data:image/jpeg;base64,test'], 'CLP');

    expect(mockCallable).toHaveBeenCalledWith({
      images: ['data:image/jpeg;base64,test'],
      currency: 'CLP'
    });
  });
});
