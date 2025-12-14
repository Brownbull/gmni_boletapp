/**
 * Unit Tests for Category Translations
 *
 * Story 9.12: UI Content Translation
 * Tests the translateCategory function and related translation utilities.
 *
 * @see docs/sprint-artifacts/epic9/story-9.12-ui-content-translation.md
 */

import { describe, it, expect } from 'vitest';
import {
    translateCategory,
    translateStoreCategory,
    translateItemGroup,
    translateSubcategory,
    getTranslatedStoreCategoryOptions,
    STORE_CATEGORY_TRANSLATIONS,
    ITEM_GROUP_TRANSLATIONS,
    SUBCATEGORY_TRANSLATIONS,
} from '../../src/utils/categoryTranslations';

describe('categoryTranslations', () => {
    // =========================================================================
    // translateCategory - General function
    // =========================================================================
    describe('translateCategory', () => {
        it('should translate store categories to Spanish', () => {
            expect(translateCategory('Supermarket', 'es')).toBe('Supermercado');
            expect(translateCategory('Restaurant', 'es')).toBe('Restaurante');
            expect(translateCategory('Pharmacy', 'es')).toBe('Farmacia');
            expect(translateCategory('GasStation', 'es')).toBe('Bencinera');
        });

        it('should translate item groups to Spanish', () => {
            expect(translateCategory('Dairy & Eggs', 'es')).toBe('Lacteos y Huevos');
            expect(translateCategory('Produce', 'es')).toBe('Frutas y Verduras');
            expect(translateCategory('Beverages', 'es')).toBe('Bebidas');
            expect(translateCategory('Frozen Foods', 'es')).toBe('Congelados');
        });

        it('should translate subcategories to Spanish', () => {
            expect(translateCategory('Milk', 'es')).toBe('Leche');
            expect(translateCategory('Cheese', 'es')).toBe('Queso');
            expect(translateCategory('Bread', 'es')).toBe('Pan');
        });

        it('should return English for lang=en', () => {
            expect(translateCategory('Supermarket', 'en')).toBe('Supermarket');
            expect(translateCategory('Dairy & Eggs', 'en')).toBe('Dairy & Eggs');
            expect(translateCategory('Milk', 'en')).toBe('Milk');
        });

        it('should fallback to original key for unknown categories (AC #8)', () => {
            expect(translateCategory('UnknownCategory', 'es')).toBe('UnknownCategory');
            expect(translateCategory('Some Random Text', 'es')).toBe('Some Random Text');
            expect(translateCategory('CustomSubcategory', 'es')).toBe('CustomSubcategory');
        });

        it('should handle empty/null keys gracefully', () => {
            expect(translateCategory('', 'es')).toBe('');
            expect(translateCategory('', 'en')).toBe('');
        });

        it('should prioritize store category over item group with same name', () => {
            // Both Bakery exist in store and item categories
            // Store category version should take priority
            const result = translateCategory('Bakery', 'es');
            expect(result).toBe('Panaderia');
        });
    });

    // =========================================================================
    // translateStoreCategory - Store category specific
    // =========================================================================
    describe('translateStoreCategory', () => {
        it('should translate all major store categories to Spanish', () => {
            const testCases: Record<string, string> = {
                'Supermarket': 'Supermercado',
                'Restaurant': 'Restaurante',
                'Pharmacy': 'Farmacia',
                'GasStation': 'Bencinera',
                'Electronics': 'Electronica',
                'Clothing': 'Ropa',
                'Other': 'Otro',
            };

            Object.entries(testCases).forEach(([key, expected]) => {
                expect(translateStoreCategory(key, 'es')).toBe(expected);
            });
        });

        it('should handle legacy values for backward compatibility', () => {
            expect(translateStoreCategory('Gas Station', 'es')).toBe('Bencinera');
            expect(translateStoreCategory('Parking', 'es')).toBe('Estacionamiento');
        });

        it('should return original for unknown store categories', () => {
            expect(translateStoreCategory('NotACategory', 'es')).toBe('NotACategory');
        });

        it('should handle empty string', () => {
            expect(translateStoreCategory('', 'es')).toBe('');
        });
    });

    // =========================================================================
    // translateItemGroup - Item category/group specific
    // =========================================================================
    describe('translateItemGroup', () => {
        it('should translate all major item groups to Spanish', () => {
            const testCases: Record<string, string> = {
                'Produce': 'Frutas y Verduras',
                'Meat & Seafood': 'Carnes y Mariscos',
                'Dairy & Eggs': 'Lacteos y Huevos',
                'Beverages': 'Bebidas',
                'Snacks': 'Snacks',
                'Household': 'Hogar',
                'Personal Care': 'Cuidado Personal',
            };

            Object.entries(testCases).forEach(([key, expected]) => {
                expect(translateItemGroup(key, 'es')).toBe(expected);
            });
        });

        it('should return original for unknown groups', () => {
            expect(translateItemGroup('CustomGroup', 'es')).toBe('CustomGroup');
        });
    });

    // =========================================================================
    // translateSubcategory - Subcategory specific
    // =========================================================================
    describe('translateSubcategory', () => {
        it('should translate common subcategories to Spanish', () => {
            const testCases: Record<string, string> = {
                'Milk': 'Leche',
                'Cheese': 'Queso',
                'Bread': 'Pan',
                'Chicken': 'Pollo',
                'Water': 'Agua',
                'Coffee': 'Cafe',
            };

            Object.entries(testCases).forEach(([key, expected]) => {
                expect(translateSubcategory(key, 'es')).toBe(expected);
            });
        });

        it('should return original for AI-generated subcategories (best-effort)', () => {
            expect(translateSubcategory('Artisan Cheese', 'es')).toBe('Artisan Cheese');
            expect(translateSubcategory('Greek Yogurt', 'es')).toBe('Greek Yogurt');
        });
    });

    // =========================================================================
    // getTranslatedStoreCategoryOptions - Dropdown options (AC #6)
    // =========================================================================
    describe('getTranslatedStoreCategoryOptions', () => {
        const testCategories = ['Supermarket', 'Restaurant', 'Pharmacy'] as const;

        it('should return options with English values and Spanish labels', () => {
            const options = getTranslatedStoreCategoryOptions(testCategories, 'es');

            expect(options).toHaveLength(3);
            expect(options[0]).toEqual({ value: 'Supermarket', label: 'Supermercado' });
            expect(options[1]).toEqual({ value: 'Restaurant', label: 'Restaurante' });
            expect(options[2]).toEqual({ value: 'Pharmacy', label: 'Farmacia' });
        });

        it('should return options with English values and English labels', () => {
            const options = getTranslatedStoreCategoryOptions(testCategories, 'en');

            expect(options).toHaveLength(3);
            expect(options[0]).toEqual({ value: 'Supermarket', label: 'Supermarket' });
            expect(options[1]).toEqual({ value: 'Restaurant', label: 'Restaurant' });
            expect(options[2]).toEqual({ value: 'Pharmacy', label: 'Pharmacy' });
        });

        it('should store value in English (AC #7)', () => {
            const options = getTranslatedStoreCategoryOptions(testCategories, 'es');

            options.forEach(opt => {
                // Value should always be the English key
                expect(testCategories).toContain(opt.value);
                // Label may be translated
                expect(typeof opt.label).toBe('string');
            });
        });
    });

    // =========================================================================
    // Translation completeness checks
    // =========================================================================
    describe('translation completeness', () => {
        it('should have Spanish translations for all store categories', () => {
            Object.keys(STORE_CATEGORY_TRANSLATIONS).forEach(key => {
                const translations = STORE_CATEGORY_TRANSLATIONS[key];
                expect(translations.es).toBeDefined();
                expect(translations.es.length).toBeGreaterThan(0);
            });
        });

        it('should have Spanish translations for all item groups', () => {
            Object.keys(ITEM_GROUP_TRANSLATIONS).forEach(key => {
                const translations = ITEM_GROUP_TRANSLATIONS[key];
                expect(translations.es).toBeDefined();
                expect(translations.es.length).toBeGreaterThan(0);
            });
        });

        it('should have Spanish translations for all subcategories', () => {
            Object.keys(SUBCATEGORY_TRANSLATIONS).forEach(key => {
                const translations = SUBCATEGORY_TRANSLATIONS[key];
                expect(translations.es).toBeDefined();
                expect(translations.es.length).toBeGreaterThan(0);
            });
        });
    });

    // =========================================================================
    // Edge cases
    // =========================================================================
    describe('edge cases', () => {
        it('should handle case-sensitive category names', () => {
            // Categories are case-sensitive (match exactly as stored)
            expect(translateCategory('supermarket', 'es')).toBe('supermarket'); // Not found
            expect(translateCategory('Supermarket', 'es')).toBe('Supermercado'); // Found
        });

        it('should handle special characters in category names', () => {
            expect(translateCategory('Dairy & Eggs', 'es')).toBe('Lacteos y Huevos');
            expect(translateCategory('Meat & Seafood', 'es')).toBe('Carnes y Mariscos');
            expect(translateCategory('Tax & Fees', 'es')).toBe('Impuestos y Cargos');
        });

        it('should not modify the original key when falling back', () => {
            const originalKey = 'My Custom Category';
            const result = translateCategory(originalKey, 'es');
            expect(result).toBe(originalKey);
            expect(result === originalKey).toBe(true);
        });
    });
});
