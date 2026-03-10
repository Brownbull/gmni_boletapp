/**
 * Unit tests for categoryTranslations.ts
 * Story 14.15c: Category Group Filters
 * Updated for V4 taxonomy (Story 17-2)
 *
 * Tests the translation functions for store category groups,
 * including the V4 group translations.
 */

import { describe, it, expect } from 'vitest';
import {
  translateCategory,
  translateStoreCategory,
  translateItemGroup,
  translateSubcategory,
  getTranslatedStoreCategoryOptions,
  // Group translations
  translateStoreCategoryGroup,
  getStoreCategoryGroupEmoji,
  STORE_CATEGORY_GROUP_EMOJIS,
  STORE_CATEGORY_GROUP_TRANSLATIONS,
} from '../../../src/utils/categoryTranslations';
import { ALL_STORE_CATEGORY_GROUPS } from '../../../src/config/categoryColors';

// ============================================================================
// V4 Store Category Group Translations
// ============================================================================

describe('categoryTranslations - V4 Group Translations', () => {
  describe('STORE_CATEGORY_GROUP_TRANSLATIONS', () => {
    it('has translations for all 12 store category groups', () => {
      for (const group of ALL_STORE_CATEGORY_GROUPS) {
        expect(STORE_CATEGORY_GROUP_TRANSLATIONS).toHaveProperty(group);
        expect(STORE_CATEGORY_GROUP_TRANSLATIONS[group]).toHaveProperty('en');
        expect(STORE_CATEGORY_GROUP_TRANSLATIONS[group]).toHaveProperty('es');
      }
    });
  });

  describe('translateStoreCategoryGroup', () => {
    it('translates supermercados group to English', () => {
      const result = translateStoreCategoryGroup('supermercados', 'en');
      expect(result).toBe('Supermarkets');
    });

    it('translates supermercados group to Spanish', () => {
      const result = translateStoreCategoryGroup('supermercados', 'es');
      expect(result).toBe('Supermercados');
    });

    it('translates salud-bienestar group to English', () => {
      const result = translateStoreCategoryGroup('salud-bienestar', 'en');
      expect(result).toBe('Health & Wellness');
    });

    it('translates salud-bienestar group to Spanish', () => {
      const result = translateStoreCategoryGroup('salud-bienestar', 'es');
      expect(result).toBe('Salud y Bienestar');
    });

    it('translates all groups to English', () => {
      for (const group of ALL_STORE_CATEGORY_GROUPS) {
        const result = translateStoreCategoryGroup(group, 'en');
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
      }
    });

    it('translates all groups to Spanish', () => {
      for (const group of ALL_STORE_CATEGORY_GROUPS) {
        const result = translateStoreCategoryGroup(group, 'es');
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
      }
    });

    it('returns original key for unknown groups', () => {
      const result = translateStoreCategoryGroup('unknown-group', 'en');
      expect(result).toBe('unknown-group');
    });

    it('returns empty string for empty input', () => {
      const result = translateStoreCategoryGroup('', 'en');
      expect(result).toBe('');
    });
  });

  describe('STORE_CATEGORY_GROUP_EMOJIS', () => {
    it('has emojis for all 12 store category groups', () => {
      for (const group of ALL_STORE_CATEGORY_GROUPS) {
        expect(STORE_CATEGORY_GROUP_EMOJIS).toHaveProperty(group);
        expect(typeof STORE_CATEGORY_GROUP_EMOJIS[group]).toBe('string');
      }
    });
  });

  describe('getStoreCategoryGroupEmoji', () => {
    it('returns emoji for supermercados group', () => {
      const emoji = getStoreCategoryGroupEmoji('supermercados');
      expect(typeof emoji).toBe('string');
      expect(emoji.length).toBeGreaterThan(0);
    });

    it('returns emoji for salud-bienestar group', () => {
      const emoji = getStoreCategoryGroupEmoji('salud-bienestar');
      expect(typeof emoji).toBe('string');
      expect(emoji.length).toBeGreaterThan(0);
    });

    it('returns emoji for all groups', () => {
      for (const group of ALL_STORE_CATEGORY_GROUPS) {
        const emoji = getStoreCategoryGroupEmoji(group);
        expect(emoji).toBeTruthy();
        expect(typeof emoji).toBe('string');
      }
    });

    it('returns default box emoji for unknown groups', () => {
      const emoji = getStoreCategoryGroupEmoji('unknown-group');
      // Should return the fallback emoji
      expect(typeof emoji).toBe('string');
      expect(emoji.length).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// Existing Category Translation Tests (for completeness)
// ============================================================================

describe('categoryTranslations - Store Categories', () => {
  describe('translateStoreCategory', () => {
    it('translates Supermarket to Spanish', () => {
      expect(translateStoreCategory('Supermarket', 'es')).toBe('Supermercado');
    });

    it('translates Restaurant to Spanish', () => {
      expect(translateStoreCategory('Restaurant', 'es')).toBe('Restaurante');
    });

    it('translates V4 ClothingStore to Spanish', () => {
      expect(translateStoreCategory('ClothingStore', 'es')).toBe('Tienda de Ropa');
    });

    it('returns English for unknown categories', () => {
      expect(translateStoreCategory('UnknownCategory', 'es')).toBe('UnknownCategory');
    });
  });
});

describe('categoryTranslations - Item Groups', () => {
  describe('translateItemGroup', () => {
    it('translates Produce to Spanish', () => {
      expect(translateItemGroup('Produce', 'es')).toBe('Frutas y Verduras');
    });

    it('translates V4 DairyEggs to Spanish', () => {
      const result = translateItemGroup('DairyEggs', 'es');
      // Contains accented a
      expect(result).toContain('cteos y Huevos');
    });

    it('translates V4 BeautyCosmetics to Spanish', () => {
      const result = translateItemGroup('BeautyCosmetics', 'es');
      expect(result).toContain('Belleza');
    });

    it('still translates legacy Dairy & Eggs key', () => {
      const result = translateItemGroup('Dairy & Eggs', 'es');
      expect(result).toContain('cteos y Huevos');
    });
  });
});

describe('categoryTranslations - Universal Function', () => {
  describe('translateCategory', () => {
    it('finds store categories first', () => {
      expect(translateCategory('Supermarket', 'es')).toBe('Supermercado');
    });

    it('falls back to item groups', () => {
      expect(translateCategory('Produce', 'es')).toBe('Frutas y Verduras');
    });

    it('falls back to subcategories', () => {
      expect(translateCategory('Fruits', 'es')).toBe('Frutas');
    });

    it('returns original for unknown', () => {
      expect(translateCategory('CompletelyUnknown', 'es')).toBe('CompletelyUnknown');
    });
  });
});
