/**
 * Tests for categoryEmoji utility
 *
 * Story 11.2: Quick Save Card Component (AC #8)
 * Updated for V4 taxonomy (Story 17-2)
 * Tests category to emoji mapping.
 */

import { describe, it, expect } from 'vitest';
import { getCategoryEmoji, getAllCategoryEmojis } from '../../../src/utils/categoryEmoji';

describe('categoryEmoji', () => {
  describe('getCategoryEmoji', () => {
    it('returns correct emoji for Supermarket', () => {
      expect(getCategoryEmoji('Supermarket')).toBeTruthy();
    });

    it('returns correct emoji for Restaurant', () => {
      expect(getCategoryEmoji('Restaurant')).toBeTruthy();
    });

    it('returns correct emoji for Pharmacy', () => {
      expect(getCategoryEmoji('Pharmacy')).toBeTruthy();
    });

    it('returns correct emoji for GasStation', () => {
      expect(getCategoryEmoji('GasStation')).toBeTruthy();
    });

    it('returns correct emoji for Entertainment', () => {
      expect(getCategoryEmoji('Entertainment')).toBeTruthy();
    });

    it('returns emoji for Other category', () => {
      expect(getCategoryEmoji('Other')).toBeTruthy();
    });

    it('returns default emoji for unknown category', () => {
      const emoji = getCategoryEmoji('UnknownCategory');
      expect(typeof emoji).toBe('string');
      expect(emoji.length).toBeGreaterThan(0);
    });

    it('returns default emoji for empty string', () => {
      const emoji = getCategoryEmoji('');
      expect(typeof emoji).toBe('string');
      expect(emoji.length).toBeGreaterThan(0);
    });

    // Test V4 comercio-barrio categories
    describe('Comercio de Barrio categories', () => {
      it('returns correct emoji for Bakery', () => {
        expect(getCategoryEmoji('Bakery')).toBeTruthy();
      });

      it('returns correct emoji for Butcher', () => {
        expect(getCategoryEmoji('Butcher')).toBeTruthy();
      });

      it('returns correct emoji for OpenMarket', () => {
        expect(getCategoryEmoji('OpenMarket')).toBeTruthy();
      });

      it('returns correct emoji for Kiosk', () => {
        expect(getCategoryEmoji('Kiosk')).toBeTruthy();
      });

      it('returns correct emoji for LiquorStore', () => {
        expect(getCategoryEmoji('LiquorStore')).toBeTruthy();
      });
    });

    // Test V4 salud-bienestar categories
    describe('Salud y Bienestar categories', () => {
      it('returns correct emoji for Medical', () => {
        expect(getCategoryEmoji('Medical')).toBeTruthy();
      });

      it('returns correct emoji for Veterinary', () => {
        expect(getCategoryEmoji('Veterinary')).toBeTruthy();
      });

      it('returns correct emoji for HealthBeauty', () => {
        expect(getCategoryEmoji('HealthBeauty')).toBeTruthy();
      });
    });

    // Test V4 renamed retail categories
    describe('V4 Retail categories', () => {
      it('returns correct emoji for ElectronicsStore', () => {
        expect(getCategoryEmoji('ElectronicsStore')).toBeTruthy();
      });

      it('returns correct emoji for ClothingStore', () => {
        expect(getCategoryEmoji('ClothingStore')).toBeTruthy();
      });

      it('returns correct emoji for HomeGoods', () => {
        expect(getCategoryEmoji('HomeGoods')).toBeTruthy();
      });

      it('returns correct emoji for AccessoriesOptical', () => {
        expect(getCategoryEmoji('AccessoriesOptical')).toBeTruthy();
      });
    });

    // Test V4 services categories
    describe('Services categories', () => {
      it('returns correct emoji for BankingFinance', () => {
        expect(getCategoryEmoji('BankingFinance')).toBeTruthy();
      });

      it('returns correct emoji for Education', () => {
        expect(getCategoryEmoji('Education')).toBeTruthy();
      });

      it('returns correct emoji for TravelAgency', () => {
        expect(getCategoryEmoji('TravelAgency')).toBeTruthy();
      });

      it('returns correct emoji for GeneralServices', () => {
        expect(getCategoryEmoji('GeneralServices')).toBeTruthy();
      });
    });

    // Test V4 new categories
    describe('V4 new categories', () => {
      it('returns correct emoji for Wholesale', () => {
        expect(getCategoryEmoji('Wholesale')).toBeTruthy();
      });

      it('returns correct emoji for OnlineStore', () => {
        expect(getCategoryEmoji('OnlineStore')).toBeTruthy();
      });

      it('returns correct emoji for Casino', () => {
        expect(getCategoryEmoji('Casino')).toBeTruthy();
      });

      it('returns correct emoji for Lodging', () => {
        expect(getCategoryEmoji('Lodging')).toBeTruthy();
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
    });

    it('returns 44 entries for V4 store categories', () => {
      const all = getAllCategoryEmojis();
      expect(all).toHaveLength(44);
    });

    it('includes all expected V4 categories', () => {
      const all = getAllCategoryEmojis();
      const categories = all.map(item => item.category);

      // Check for key V4 categories
      expect(categories).toContain('Supermarket');
      expect(categories).toContain('Restaurant');
      expect(categories).toContain('Pharmacy');
      expect(categories).toContain('GasStation');
      expect(categories).toContain('Other');
      expect(categories).toContain('Wholesale');
      expect(categories).toContain('OnlineStore');
      expect(categories).toContain('Casino');
      expect(categories).toContain('Lodging');
    });

    it('does not include removed V3 categories', () => {
      const all = getAllCategoryEmojis();
      const categories = all.map(item => item.category);

      expect(categories).not.toContain('StreetVendor');
      expect(categories).not.toContain('MusicStore');
      expect(categories).not.toContain('Jewelry');
      expect(categories).not.toContain('Optical');
    });

    it('returns consistent results on multiple calls', () => {
      const first = getAllCategoryEmojis();
      const second = getAllCategoryEmojis();
      expect(first).toEqual(second);
    });
  });
});
