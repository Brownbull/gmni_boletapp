import { describe, it, expect } from 'vitest';
import {
  ACTIVE_PROMPT,
  PROMPT_V1,
  PROMPT_V2,
  getPrompt,
  listPrompts,
  replacePromptVariables,
  buildPrompt,
  STORE_CATEGORIES,
  ITEM_CATEGORIES,
  getCurrencyContext,
  getReceiptTypeDescription,
  buildCompleteV2Prompt,
  CURRENCY_CONTEXTS,
} from '../index';
import type { PromptConfig } from '../types';
import type { ReceiptType } from '../v2-multi-currency-receipt-types';

describe('Shared Prompts Library', () => {
  describe('ACTIVE_PROMPT', () => {
    it('should be defined', () => {
      expect(ACTIVE_PROMPT).toBeDefined();
    });

    it('should have all required PromptConfig fields', () => {
      expect(ACTIVE_PROMPT.id).toBeDefined();
      expect(ACTIVE_PROMPT.name).toBeDefined();
      expect(ACTIVE_PROMPT.description).toBeDefined();
      expect(ACTIVE_PROMPT.version).toBeDefined();
      expect(ACTIVE_PROMPT.createdAt).toBeDefined();
      expect(ACTIVE_PROMPT.prompt).toBeDefined();
    });

    it('should have a non-empty prompt string', () => {
      expect(ACTIVE_PROMPT.prompt.length).toBeGreaterThan(50);
    });

    it('should contain {{currency}} placeholder', () => {
      expect(ACTIVE_PROMPT.prompt).toContain('{{currency}}');
    });

    it('should contain {{date}} placeholder', () => {
      expect(ACTIVE_PROMPT.prompt).toContain('{{date}}');
    });

    it('should reference PROMPT_V2 (current active)', () => {
      expect(ACTIVE_PROMPT).toBe(PROMPT_V2);
    });
  });

  describe('PROMPT_V1', () => {
    it('should have id "v1-original"', () => {
      expect(PROMPT_V1.id).toBe('v1-original');
    });

    it('should have version "1.0.0"', () => {
      expect(PROMPT_V1.version).toBe('1.0.0');
    });

    it('should contain all store categories in prompt', () => {
      const prompt = PROMPT_V1.prompt;
      STORE_CATEGORIES.forEach((category) => {
        expect(prompt).toContain(category);
      });
    });

    it('should contain all item categories in prompt', () => {
      const prompt = PROMPT_V1.prompt;
      ITEM_CATEGORIES.forEach((category) => {
        expect(prompt).toContain(category);
      });
    });

    it('should require JSON output', () => {
      expect(PROMPT_V1.prompt).toContain('JSON');
    });

    it('should require integer prices', () => {
      expect(PROMPT_V1.prompt).toContain('INTEGERS');
    });
  });

  describe('getPrompt()', () => {
    it('should return v1-original when requested', () => {
      const result = getPrompt('v1-original');
      expect(result).toBe(PROMPT_V1);
    });

    it('should throw error for unknown prompt ID', () => {
      expect(() => getPrompt('unknown-prompt')).toThrow(
        'Prompt "unknown-prompt" not found'
      );
    });

    it('should include available prompts in error message', () => {
      try {
        getPrompt('invalid');
        expect.fail('Should have thrown');
      } catch (error) {
        expect((error as Error).message).toContain('v1-original');
      }
    });

    it('should return correct type', () => {
      const result: PromptConfig = getPrompt('v1-original');
      expect(result.id).toBe('v1-original');
    });
  });

  describe('listPrompts()', () => {
    it('should return an array', () => {
      const result = listPrompts();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should include PROMPT_V1', () => {
      const result = listPrompts();
      expect(result).toContain(PROMPT_V1);
    });

    it('should return at least one prompt', () => {
      const result = listPrompts();
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('should return PromptConfig objects', () => {
      const result = listPrompts();
      result.forEach((prompt) => {
        expect(prompt.id).toBeDefined();
        expect(prompt.name).toBeDefined();
        expect(prompt.prompt).toBeDefined();
      });
    });
  });

  describe('replacePromptVariables()', () => {
    it('should replace {{currency}} placeholder', () => {
      const template = 'Currency: {{currency}}';
      const result = replacePromptVariables(template, {
        currency: 'CLP',
        date: '2025-12-11',
      });
      expect(result).toBe('Currency: CLP');
    });

    it('should replace {{date}} placeholder', () => {
      const template = 'Today: {{date}}';
      const result = replacePromptVariables(template, {
        currency: 'CLP',
        date: '2025-12-11',
      });
      expect(result).toBe('Today: 2025-12-11');
    });

    it('should replace both placeholders', () => {
      const template = 'Context: {{currency}}. Today: {{date}}.';
      const result = replacePromptVariables(template, {
        currency: 'USD',
        date: '2025-01-15',
      });
      expect(result).toBe('Context: USD. Today: 2025-01-15.');
    });

    it('should work with PROMPT_V1', () => {
      const result = replacePromptVariables(PROMPT_V1.prompt, {
        currency: 'CLP',
        date: '2025-12-11',
      });
      expect(result).not.toContain('{{currency}}');
      expect(result).not.toContain('{{date}}');
      expect(result).toContain('CLP');
      expect(result).toContain('2025-12-11');
    });

    it('should replace first occurrence (use buildCompleteV2Prompt for V2)', () => {
      // Note: replacePromptVariables only replaces first occurrence
      // For V2 prompts with multiple placeholders, use buildCompleteV2Prompt
      const template = 'First: {{currency}}, Second: {{currency}}';
      const result = replacePromptVariables(template, {
        currency: 'USD',
        date: '2025-12-11',
      });
      expect(result).toBe('First: USD, Second: {{currency}}');
    });
  });

  describe('Category constants', () => {
    it('should have 14 store categories', () => {
      expect(STORE_CATEGORIES).toHaveLength(14);
    });

    it('should include common store types', () => {
      expect(STORE_CATEGORIES).toContain('Supermarket');
      expect(STORE_CATEGORIES).toContain('Restaurant');
      expect(STORE_CATEGORIES).toContain('Pharmacy');
      expect(STORE_CATEGORIES).toContain('Other');
    });

    it('should have 9 item categories', () => {
      expect(ITEM_CATEGORIES).toHaveLength(9);
    });

    it('should include common item types', () => {
      expect(ITEM_CATEGORIES).toContain('Fresh Food');
      expect(ITEM_CATEGORIES).toContain('Pantry');
      expect(ITEM_CATEGORIES).toContain('Drinks');
      expect(ITEM_CATEGORIES).toContain('Other');
    });
  });

  describe('PROMPT_V2 - Multi-Currency & Receipt Types', () => {
    it('should have id "v2-multi-currency-types"', () => {
      expect(PROMPT_V2.id).toBe('v2-multi-currency-types');
    });

    it('should have version "2.1.0"', () => {
      expect(PROMPT_V2.version).toBe('2.1.0');
    });

    it('should contain {{currency}} placeholder', () => {
      expect(PROMPT_V2.prompt).toContain('{{currency}}');
    });

    it('should contain {{date}} placeholder', () => {
      expect(PROMPT_V2.prompt).toContain('{{date}}');
    });

    it('should contain {{receiptType}} placeholder', () => {
      expect(PROMPT_V2.prompt).toContain('{{receiptType}}');
    });

    it('should be registered in prompt registry', () => {
      const result = getPrompt('v2-multi-currency-types');
      expect(result).toBe(PROMPT_V2);
    });

    it('should be included in listPrompts()', () => {
      const prompts = listPrompts();
      expect(prompts).toContain(PROMPT_V2);
    });

    it('should contain all store categories', () => {
      STORE_CATEGORIES.forEach((category) => {
        expect(PROMPT_V2.prompt).toContain(category);
      });
    });

    it('should contain all item categories', () => {
      ITEM_CATEGORIES.forEach((category) => {
        expect(PROMPT_V2.prompt).toContain(category);
      });
    });

    it('should mention integer conversion for prices', () => {
      expect(PROMPT_V2.prompt).toContain('INTEGER');
    });

    it('should include JSON output format instructions', () => {
      expect(PROMPT_V2.prompt).toContain('JSON');
      expect(PROMPT_V2.prompt).toContain('merchant');
      expect(PROMPT_V2.prompt).toContain('total');
      expect(PROMPT_V2.prompt).toContain('items');
    });
  });

  describe('getCurrencyContext()', () => {
    it('should return context for CLP', () => {
      const result = getCurrencyContext('CLP');
      expect(result).toContain('Chilean Peso');
      expect(result).toContain('integers');
    });

    it('should return context for USD', () => {
      const result = getCurrencyContext('USD');
      expect(result).toContain('US Dollar');
      expect(result).toContain('cents');
    });

    it('should return context for EUR', () => {
      const result = getCurrencyContext('EUR');
      expect(result).toContain('Euro');
    });

    it('should handle lowercase currency codes', () => {
      const result = getCurrencyContext('usd');
      expect(result).toContain('US Dollar');
    });

    it('should return generic context for unknown currencies', () => {
      const result = getCurrencyContext('XYZ');
      expect(result).toContain('XYZ');
      expect(result).toContain('integer');
    });

    it('should have context for Latin American currencies', () => {
      expect(CURRENCY_CONTEXTS).toHaveProperty('MXN');
      expect(CURRENCY_CONTEXTS).toHaveProperty('ARS');
      expect(CURRENCY_CONTEXTS).toHaveProperty('COP');
      expect(CURRENCY_CONTEXTS).toHaveProperty('PEN');
      expect(CURRENCY_CONTEXTS).toHaveProperty('BRL');
    });
  });

  describe('getReceiptTypeDescription()', () => {
    it('should return description for supermarket', () => {
      const result = getReceiptTypeDescription('supermarket');
      expect(result).toContain('supermarket');
      expect(result).toContain('grocery');
    });

    it('should return description for restaurant', () => {
      const result = getReceiptTypeDescription('restaurant');
      expect(result).toContain('restaurant');
    });

    it('should return description for utility_bill', () => {
      const result = getReceiptTypeDescription('utility_bill');
      expect(result).toContain('utility');
    });

    it('should return description for online_purchase', () => {
      const result = getReceiptTypeDescription('online_purchase');
      expect(result).toContain('online');
    });

    it('should return description for parking', () => {
      const result = getReceiptTypeDescription('parking');
      expect(result).toContain('parking');
    });

    it('should return auto-detect description for "auto"', () => {
      const result = getReceiptTypeDescription('auto');
      expect(result).toContain('auto-detect');
    });

    it('should default to auto when no type provided', () => {
      const result = getReceiptTypeDescription();
      expect(result).toContain('auto-detect');
    });
  });

  describe('buildCompleteV2Prompt()', () => {
    it('should replace all placeholders', () => {
      const result = buildCompleteV2Prompt({
        currency: 'CLP',
        date: '2025-12-11',
        receiptType: 'supermarket',
      });

      expect(result).not.toContain('{{currency}}');
      expect(result).not.toContain('{{date}}');
      expect(result).not.toContain('{{receiptType}}');
    });

    it('should include currency context', () => {
      const result = buildCompleteV2Prompt({
        currency: 'USD',
        date: '2025-12-11',
      });

      expect(result).toContain('US Dollar');
    });

    it('should include date', () => {
      const result = buildCompleteV2Prompt({
        currency: 'CLP',
        date: '2025-12-11',
      });

      expect(result).toContain('2025-12-11');
    });

    it('should include receipt type description', () => {
      const result = buildCompleteV2Prompt({
        currency: 'CLP',
        date: '2025-12-11',
        receiptType: 'parking',
      });

      expect(result).toContain('parking');
    });

    it('should default to auto receipt type', () => {
      const result = buildCompleteV2Prompt({
        currency: 'CLP',
        date: '2025-12-11',
      });

      expect(result).toContain('auto-detect');
    });

    it('should handle international currencies', () => {
      const currencies = ['EUR', 'MXN', 'ARS', 'BRL'];
      currencies.forEach((currency) => {
        const result = buildCompleteV2Prompt({
          currency,
          date: '2025-12-11',
        });
        expect(result).not.toContain('{{currency}}');
      });
    });

    it('should handle all receipt types', () => {
      const types: ReceiptType[] = [
        'supermarket',
        'restaurant',
        'pharmacy',
        'gas_station',
        'general_store',
        'utility_bill',
        'parking',
        'transport_ticket',
        'online_purchase',
        'subscription',
        'auto',
      ];

      types.forEach((type) => {
        const result = buildCompleteV2Prompt({
          currency: 'CLP',
          date: '2025-12-11',
          receiptType: type,
        });
        expect(result).not.toContain('{{receiptType}}');
      });
    });
  });

  describe('Prompt Registry - V2 inclusion', () => {
    it('should now have 2 prompts registered', () => {
      const prompts = listPrompts();
      expect(prompts).toHaveLength(2);
    });

    it('should include both V1 and V2', () => {
      const prompts = listPrompts();
      const ids = prompts.map((p) => p.id);
      expect(ids).toContain('v1-original');
      expect(ids).toContain('v2-multi-currency-types');
    });

    it('error message should list both prompts', () => {
      try {
        getPrompt('invalid');
        expect.fail('Should have thrown');
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain('v1-original');
        expect(message).toContain('v2-multi-currency-types');
      }
    });
  });

  describe('buildPrompt() - Generic Prompt Builder', () => {
    it('should use ACTIVE_PROMPT by default', () => {
      const result = buildPrompt({ currency: 'CLP' });
      // ACTIVE_PROMPT is V2, which has specific structure
      expect(result).toContain('CURRENCY CONTEXT');
      expect(result).toContain('Chilean Peso');
    });

    it('should use default currency (CLP) when not provided', () => {
      const result = buildPrompt();
      expect(result).toContain('Chilean Peso');
    });

    it('should use today\'s date by default', () => {
      const today = new Date().toISOString().split('T')[0];
      const result = buildPrompt();
      expect(result).toContain(today);
    });

    it('should use auto receipt type by default', () => {
      const result = buildPrompt();
      expect(result).toContain('auto-detect');
    });

    it('should replace currency with provided value', () => {
      const result = buildPrompt({ currency: 'USD' });
      expect(result).toContain('US Dollar');
      expect(result).not.toContain('{{currency}}');
    });

    it('should replace date with provided value', () => {
      const result = buildPrompt({ date: '2025-01-15' });
      expect(result).toContain('2025-01-15');
      expect(result).not.toContain('{{date}}');
    });

    it('should replace receiptType with provided value', () => {
      const result = buildPrompt({ receiptType: 'restaurant' });
      expect(result).toContain('restaurant bill');
      expect(result).not.toContain('{{receiptType}}');
    });

    it('should replace ALL placeholders (no leftover {{}})', () => {
      const result = buildPrompt({
        currency: 'EUR',
        date: '2025-12-12',
        receiptType: 'supermarket',
      });
      expect(result).not.toContain('{{currency}}');
      expect(result).not.toContain('{{date}}');
      expect(result).not.toContain('{{receiptType}}');
    });

    it('should work with a specific prompt version via promptConfig', () => {
      const result = buildPrompt({
        currency: 'CLP',
        date: '2025-12-12',
        promptConfig: PROMPT_V1,
      });
      // V1 prompt structure is different from V2
      expect(result).toContain('CLP'); // V1 doesn't expand currency context
      expect(result).toContain('2025-12-12');
    });

    it('should handle unknown currencies with generic message', () => {
      const result = buildPrompt({ currency: 'XYZ' });
      expect(result).toContain('XYZ');
      expect(result).toContain('integer');
    });

    it('should handle various receipt types', () => {
      const types: Array<'parking' | 'pharmacy' | 'gas_station' | 'hotel'> = [
        'parking',
        'pharmacy',
        'gas_station',
        'hotel',
      ];

      types.forEach((type) => {
        const result = buildPrompt({ receiptType: type });
        expect(result).not.toContain('{{receiptType}}');
      });
    });

    it('should handle international currencies', () => {
      const currencies = ['EUR', 'MXN', 'ARS', 'BRL', 'GBP'];

      currencies.forEach((currency) => {
        const result = buildPrompt({ currency });
        expect(result).not.toContain('{{currency}}');
      });
    });
  });
});
