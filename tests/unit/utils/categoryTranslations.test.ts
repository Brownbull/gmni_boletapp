/**
 * Unit tests for categoryTranslations.ts
 * Story 14.15c: Category Group Filters
 *
 * Tests the translation functions for store category groups,
 * including the new group translations added in Story 14.15c.
 */

import { describe, it, expect } from 'vitest';
import {
  translateCategory,
  translateStoreCategory,
  translateItemGroup,
  translateSubcategory,
  getTranslatedStoreCategoryOptions,
  // Story 14.15c: Group translations
  translateStoreCategoryGroup,
  getStoreCategoryGroupEmoji,
  STORE_CATEGORY_GROUP_EMOJIS,
  STORE_CATEGORY_GROUP_TRANSLATIONS,
} from '../../../src/utils/categoryTranslations';
import { ALL_STORE_CATEGORY_GROUPS } from '../../../src/config/categoryColors';

// ============================================================================
// Story 14.15c: Store Category Group Translations
// ============================================================================

describe('categoryTranslations - Story 14.15c Group Translations', () => {
  describe('STORE_CATEGORY_GROUP_TRANSLATIONS', () => {
    it('has translations for all 8 store category groups', () => {
      for (const group of ALL_STORE_CATEGORY_GROUPS) {
        expect(STORE_CATEGORY_GROUP_TRANSLATIONS).toHaveProperty(group);
        expect(STORE_CATEGORY_GROUP_TRANSLATIONS[group]).toHaveProperty('en');
        expect(STORE_CATEGORY_GROUP_TRANSLATIONS[group]).toHaveProperty('es');
      }
    });
  });

  describe('translateStoreCategoryGroup', () => {
    it('translates food-dining group to English', () => {
      const result = translateStoreCategoryGroup('food-dining', 'en');
      expect(result).toBe('Food & Dining');
    });

    it('translates food-dining group to Spanish', () => {
      const result = translateStoreCategoryGroup('food-dining', 'es');
      expect(result).toBe('Alimentación');
    });

    it('translates health-wellness group to English', () => {
      const result = translateStoreCategoryGroup('health-wellness', 'en');
      expect(result).toBe('Health & Wellness');
    });

    it('translates health-wellness group to Spanish', () => {
      const result = translateStoreCategoryGroup('health-wellness', 'es');
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
    it('has emojis for all 8 store category groups', () => {
      for (const group of ALL_STORE_CATEGORY_GROUPS) {
        expect(STORE_CATEGORY_GROUP_EMOJIS).toHaveProperty(group);
        expect(typeof STORE_CATEGORY_GROUP_EMOJIS[group]).toBe('string');
      }
    });

    it('uses correct emojis for key groups', () => {
      expect(STORE_CATEGORY_GROUP_EMOJIS['food-dining']).toBe('🍽️');
      expect(STORE_CATEGORY_GROUP_EMOJIS['health-wellness']).toBe('💊');
      expect(STORE_CATEGORY_GROUP_EMOJIS['automotive']).toBe('⛽');
    });
  });

  describe('getStoreCategoryGroupEmoji', () => {
    it('returns emoji for food-dining group', () => {
      const emoji = getStoreCategoryGroupEmoji('food-dining');
      expect(emoji).toBe('🍽️');
    });

    it('returns emoji for health-wellness group', () => {
      const emoji = getStoreCategoryGroupEmoji('health-wellness');
      expect(emoji).toBe('💊');
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
      expect(emoji).toBe('📦');
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

    it('translates Dairy & Eggs to Spanish', () => {
      expect(translateItemGroup('Dairy & Eggs', 'es')).toBe('Lacteos y Huevos');
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
