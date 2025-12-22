/**
 * Tests for categoryEmoji utility
 *
 * Story 11.2: Quick Save Card Component (AC #8)
 * Tests category to emoji mapping.
 */

import { describe, it, expect } from 'vitest';
import { getCategoryEmoji, getAllCategoryEmojis } from '../../../src/utils/categoryEmoji';

describe('categoryEmoji', () => {
  describe('getCategoryEmoji', () => {
    it('returns correct emoji for Supermarket', () => {
      expect(getCategoryEmoji('Supermarket')).toBe('🛒');
    });

    it('returns correct emoji for Restaurant', () => {
      expect(getCategoryEmoji('Restaurant')).toBe('🍽️');
    });

    it('returns correct emoji for Pharmacy', () => {
      expect(getCategoryEmoji('Pharmacy')).toBe('💊');
    });

    it('returns correct emoji for GasStation', () => {
      expect(getCategoryEmoji('GasStation')).toBe('⛽');
    });

    it('returns correct emoji for Entertainment', () => {
      expect(getCategoryEmoji('Entertainment')).toBe('🎬');
    });

    it('returns default emoji for Other category', () => {
      expect(getCategoryEmoji('Other')).toBe('📦');
    });

    it('returns default emoji for unknown category', () => {
      expect(getCategoryEmoji('UnknownCategory')).toBe('📦');
    });

    it('returns default emoji for empty string', () => {
      expect(getCategoryEmoji('')).toBe('📦');
    });

    // Test all food & dining categories
    describe('Food & Dining categories', () => {
      it('returns correct emoji for Bakery', () => {
        expect(getCategoryEmoji('Bakery')).toBe('🥐');
      });

      it('returns correct emoji for Butcher', () => {
        expect(getCategoryEmoji('Butcher')).toBe('🥩');
      });

      it('returns correct emoji for StreetVendor', () => {
        expect(getCategoryEmoji('StreetVendor')).toBe('🌮');
      });
    });

    // Test all health & wellness categories
    describe('Health & Wellness categories', () => {
      it('returns correct emoji for Medical', () => {
        expect(getCategoryEmoji('Medical')).toBe('🏥');
      });

      it('returns correct emoji for Veterinary', () => {
        expect(getCategoryEmoji('Veterinary')).toBe('🐾');
      });

      it('returns correct emoji for HealthBeauty', () => {
        expect(getCategoryEmoji('HealthBeauty')).toBe('💄');
      });
    });

    // Test retail categories
    describe('Retail categories', () => {
      it('returns correct emoji for Electronics', () => {
        expect(getCategoryEmoji('Electronics')).toBe('📱');
      });

      it('returns correct emoji for Clothing', () => {
        expect(getCategoryEmoji('Clothing')).toBe('👕');
      });

      it('returns correct emoji for HomeGoods', () => {
        expect(getCategoryEmoji('HomeGoods')).toBe('🏠');
      });

      it('returns correct emoji for Jewelry', () => {
        expect(getCategoryEmoji('Jewelry')).toBe('💎');
      });
    });

    // Test services categories
    describe('Services categories', () => {
      it('returns correct emoji for BankingFinance', () => {
        expect(getCategoryEmoji('BankingFinance')).toBe('🏦');
      });

      it('returns correct emoji for Education', () => {
        expect(getCategoryEmoji('Education')).toBe('📖');
      });

      it('returns correct emoji for TravelAgency', () => {
        expect(getCategoryEmoji('TravelAgency')).toBe('✈️');
      });
    });
  });

  describe('getAllCategoryEmojis', () => {
    it('returns an array of category-emoji pairs', () => {
      const all = getAllCategoryEmojis();
      expect(Array.isArray(all)).toBe(true);
      expect(all.length).toBeGreaterThan(0);
    });

    it('each item has category and emoji properties', () => {
      const all = getAllCategoryEmojis();
      all.forEach(item => {
        expect(item).toHaveProperty('category');
        expect(item).toHaveProperty('emoji');
        expect(typeof item.category).toBe('string');
        expect(typeof item.emoji).toBe('string');
      });
    });

    it('includes Supermarket category', () => {
      const all = getAllCategoryEmojis();
      const supermarket = all.find(item => item.category === 'Supermarket');
      expect(supermarket).toBeDefined();
      expect(supermarket?.emoji).toBe('🛒');
    });

    it('includes all expected categories', () => {
      const all = getAllCategoryEmojis();
      const categories = all.map(item => item.category);

      // Check for some key categories
      expect(categories).toContain('Supermarket');
      expect(categories).toContain('Restaurant');
      expect(categories).toContain('Pharmacy');
      expect(categories).toContain('GasStation');
      expect(categories).toContain('Other');
    });

    it('returns consistent results on multiple calls', () => {
      const first = getAllCategoryEmojis();
      const second = getAllCategoryEmojis();
      expect(first).toEqual(second);
    });
  });
});
