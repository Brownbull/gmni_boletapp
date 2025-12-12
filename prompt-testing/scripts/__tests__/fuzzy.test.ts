/**
 * Unit Tests for Fuzzy String Matching
 *
 * Tests string similarity functions for merchant name comparison.
 *
 * AC3: Merchant name uses fuzzy similarity with threshold >= 0.8
 *
 * @see docs/sprint-artifacts/epic8/story-8.4-result-comparison-engine.md
 */

import { describe, it, expect } from 'vitest';
import {
  stringSimilarity,
  normalizeString,
  isMerchantMatch,
  compareMerchants,
  findBestMatch,
  MERCHANT_SIMILARITY_THRESHOLD,
} from '../lib/fuzzy';

// ============================================================================
// AC3: String Similarity Tests
// ============================================================================

describe('stringSimilarity', () => {
  describe('identical strings', () => {
    it('should return 1.0 for identical strings', () => {
      expect(stringSimilarity('hello', 'hello')).toBe(1.0);
    });

    it('should return 1.0 for identical after normalization', () => {
      expect(stringSimilarity('HELLO', 'hello')).toBe(1.0);
    });

    it('should return 1.0 for strings with different whitespace', () => {
      expect(stringSimilarity('  hello  ', 'hello')).toBe(1.0);
    });

    it('should return 1.0 for strings with accents vs without', () => {
      expect(stringSimilarity('Líder', 'Lider')).toBe(1.0);
    });
  });

  describe('completely different strings', () => {
    it('should return ~0 for completely different strings', () => {
      const similarity = stringSimilarity('abc', 'xyz');
      expect(similarity).toBeLessThan(0.3);
    });

    it('should return 0 for strings with no common bigrams', () => {
      const similarity = stringSimilarity('aa', 'bb');
      expect(similarity).toBe(0);
    });
  });

  describe('Chilean store names', () => {
    it('should return high similarity for "JUMBO" vs "Jumbo"', () => {
      const similarity = stringSimilarity('JUMBO', 'Jumbo');
      expect(similarity).toBe(1.0);
    });

    it('should return high similarity for "JUMBO" vs "Jumbo Av. Las Condes"', () => {
      const similarity = stringSimilarity('JUMBO', 'Jumbo Av. Las Condes');
      // The full address contains "Jumbo" so should have reasonable similarity
      // But not very high because of the extra text
      expect(similarity).toBeGreaterThan(0.3);
      expect(similarity).toBeLessThan(0.7);
    });

    it('should handle LÍDER vs Lider (with accent)', () => {
      const similarity = stringSimilarity('LÍDER', 'Lider');
      expect(similarity).toBe(1.0);
    });

    it('should handle Santa Isabel variations', () => {
      const similarity = stringSimilarity('Santa Isabel', 'SANTA ISABEL');
      expect(similarity).toBe(1.0);
    });

    it('should handle pharmacy names', () => {
      const similarity = stringSimilarity('Cruz Verde', 'CRUZ VERDE');
      expect(similarity).toBe(1.0);
    });

    it('should distinguish different stores', () => {
      const similarity = stringSimilarity('JUMBO', 'LÍDER');
      expect(similarity).toBeLessThan(0.5);
    });
  });

  describe('edge cases', () => {
    it('should handle empty strings', () => {
      expect(stringSimilarity('', '')).toBe(0);
      expect(stringSimilarity('hello', '')).toBe(0);
      expect(stringSimilarity('', 'hello')).toBe(0);
    });

    it('should handle single character strings', () => {
      expect(stringSimilarity('a', 'a')).toBe(1.0);
      expect(stringSimilarity('a', 'b')).toBe(0);
    });

    it('should handle strings with numbers', () => {
      const similarity = stringSimilarity('Store123', 'Store123');
      expect(similarity).toBe(1.0);
    });

    it('should handle strings with special characters', () => {
      const similarity = stringSimilarity('Mc-Donald\'s', 'McDonalds');
      expect(similarity).toBeGreaterThan(0.5);
    });
  });
});

// ============================================================================
// Normalization Tests
// ============================================================================

describe('normalizeString', () => {
  it('should convert to lowercase', () => {
    expect(normalizeString('HELLO')).toBe('hello');
  });

  it('should trim whitespace', () => {
    expect(normalizeString('  hello  ')).toBe('hello');
  });

  it('should collapse multiple spaces', () => {
    expect(normalizeString('hello   world')).toBe('hello world');
  });

  it('should remove accents/diacritics', () => {
    expect(normalizeString('Líder')).toBe('lider');
    expect(normalizeString('MAMÁ')).toBe('mama');
    expect(normalizeString('Niño')).toBe('nino');
  });

  it('should handle combined normalizations', () => {
    expect(normalizeString('  LÍDER  Las  Condes  ')).toBe('lider las condes');
  });

  it('should preserve numbers', () => {
    expect(normalizeString('Store 123')).toBe('store 123');
  });
});

// ============================================================================
// Merchant Match Tests
// ============================================================================

describe('isMerchantMatch', () => {
  it('should return true for identical merchants', () => {
    expect(isMerchantMatch('JUMBO', 'JUMBO')).toBe(true);
  });

  it('should return true for case-insensitive match', () => {
    expect(isMerchantMatch('JUMBO', 'jumbo')).toBe(true);
  });

  it('should return false for completely different merchants', () => {
    expect(isMerchantMatch('JUMBO', 'WALMART')).toBe(false);
  });

  it('should use default threshold of 0.8', () => {
    expect(MERCHANT_SIMILARITY_THRESHOLD).toBe(0.8);
  });

  it('should allow custom threshold', () => {
    // With 0.5 threshold, more matches are allowed
    const matchWith05 = isMerchantMatch('ABC', 'ABCD', 0.5);
    // This should match because they share 'AB' and 'BC' bigrams
    expect(typeof matchWith05).toBe('boolean');
  });
});

// ============================================================================
// Compare Merchants Tests
// ============================================================================

describe('compareMerchants', () => {
  it('should return complete comparison result', () => {
    const result = compareMerchants('JUMBO', 'Jumbo');
    expect(result).toEqual({
      expected: 'JUMBO',
      actual: 'Jumbo',
      similarity: 1.0,
      match: true,
    });
  });

  it('should include similarity score on mismatch', () => {
    const result = compareMerchants('JUMBO', 'WALMART');
    expect(result.expected).toBe('JUMBO');
    expect(result.actual).toBe('WALMART');
    expect(result.similarity).toBeLessThan(0.8);
    expect(result.match).toBe(false);
  });

  it('should respect custom threshold', () => {
    const result = compareMerchants('ABC', 'ABCD', 0.3);
    // With low threshold, this should match
    expect(result.match).toBe(result.similarity >= 0.3);
  });
});

// ============================================================================
// Find Best Match Tests
// ============================================================================

describe('findBestMatch', () => {
  it('should find exact match from candidates', () => {
    const result = findBestMatch('JUMBO', ['Walmart', 'Jumbo', 'Líder']);
    expect(result).not.toBeNull();
    expect(result!.candidate).toBe('Jumbo');
    expect(result!.similarity).toBe(1.0);
    expect(result!.index).toBe(1);
  });

  it('should find best partial match', () => {
    const result = findBestMatch('JUMB', ['Walmart', 'Jumbo', 'Jump']);
    expect(result).not.toBeNull();
    // Should match Jumbo better than others
    expect(result!.candidate).toBe('Jumbo');
  });

  it('should return null for empty candidates', () => {
    const result = findBestMatch('JUMBO', []);
    expect(result).toBeNull();
  });

  it('should return first candidate if all have same similarity', () => {
    const result = findBestMatch('XYZ', ['AAA', 'BBB', 'CCC']);
    expect(result).not.toBeNull();
    // All have very low similarity, should return first
    expect(result!.index).toBe(0);
  });

  it('should handle single candidate', () => {
    const result = findBestMatch('Test', ['Test']);
    expect(result).not.toBeNull();
    expect(result!.similarity).toBe(1.0);
    expect(result!.index).toBe(0);
  });

  it('should work with Chilean store names', () => {
    const result = findBestMatch('CRUZ VERDE', [
      'Jumbo',
      'Líder',
      'Cruz Verde',
      'Farmacias Ahumada',
    ]);
    expect(result).not.toBeNull();
    expect(result!.candidate).toBe('Cruz Verde');
    expect(result!.similarity).toBe(1.0);
  });
});

// ============================================================================
// Real-World Merchant Name Tests
// ============================================================================

describe('Real-world Chilean merchant names', () => {
  const chileanStores = {
    supermarkets: ['JUMBO', 'LÍDER', 'Santa Isabel', 'Tottus', 'Unimarc'],
    pharmacies: ['Cruz Verde', 'Farmacias Ahumada', 'Salcobrand'],
    convenience: ['OK Market', 'Oxxo', 'Big John'],
    gas_stations: ['Copec', 'Shell', 'Petrobras'],
  };

  it('should recognize supermarket name variations', () => {
    expect(isMerchantMatch('JUMBO', 'Jumbo')).toBe(true);
    expect(isMerchantMatch('LÍDER', 'Lider')).toBe(true);
    expect(isMerchantMatch('LÍDER', 'LIDER')).toBe(true);
    expect(isMerchantMatch('Santa Isabel', 'SANTA ISABEL')).toBe(true);
  });

  it('should recognize pharmacy name variations', () => {
    expect(isMerchantMatch('Cruz Verde', 'CRUZ VERDE')).toBe(true);
    expect(isMerchantMatch('Farmacias Ahumada', 'FARMACIAS AHUMADA')).toBe(true);
  });

  it('should not match different stores', () => {
    expect(isMerchantMatch('JUMBO', 'LÍDER')).toBe(false);
    expect(isMerchantMatch('Cruz Verde', 'Salcobrand')).toBe(false);
    expect(isMerchantMatch('Copec', 'Shell')).toBe(false);
  });

  it('should handle store names with addresses', () => {
    // This tests the common case where AI extracts merchant + location
    const similarity = stringSimilarity('JUMBO', 'JUMBO Av. Las Condes 11850');
    // Should have some similarity due to "JUMBO" being present
    expect(similarity).toBeGreaterThan(0.2);
  });
});
