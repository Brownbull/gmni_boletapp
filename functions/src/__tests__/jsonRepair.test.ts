/**
 * Unit tests for JSON repair utility.
 * TD-18-17: Handles Gemini malformed JSON patterns.
 */

import { repairJson, parseJsonWithRepair } from '../utils/jsonRepair'

describe('repairJson', () => {
  describe('unquoted keys', () => {
    it('quotes a single unquoted key', () => {
      expect(repairJson('{merchant: "Store"}')).toBe('{"merchant": "Store"}')
    })

    it('quotes multiple unquoted keys', () => {
      const input = '{merchant: "Store", total: 5000}'
      const result = JSON.parse(repairJson(input))
      expect(result).toEqual({ merchant: 'Store', total: 5000 })
    })

    it('quotes nested unquoted keys', () => {
      const input = '{items: [{name: "Apple", price: 100}]}'
      const result = JSON.parse(repairJson(input))
      expect(result).toEqual({ items: [{ name: 'Apple', price: 100 }] })
    })

    it('does not modify already-quoted keys', () => {
      const input = '{"merchant": "Store", "total": 5000}'
      expect(repairJson(input)).toBe(input)
    })

    it('handles keys with underscores and numbers', () => {
      const input = '{item_count: 3, tax_2: 500}'
      const result = JSON.parse(repairJson(input))
      expect(result).toEqual({ item_count: 3, tax_2: 500 })
    })
  })

  describe('single quotes', () => {
    it('converts single-quoted string values to double quotes', () => {
      const input = "{'merchant': 'Store'}"
      const result = JSON.parse(repairJson(input))
      expect(result).toEqual({ merchant: 'Store' })
    })

    it('handles escaped single quotes within values', () => {
      const input = "{'name': 'O\\'Higgins'}"
      const result = repairJson(input)
      // Should produce valid JSON
      expect(() => JSON.parse(result)).not.toThrow()
    })

    it('does not modify already double-quoted strings', () => {
      const input = '{"merchant": "Store"}'
      expect(repairJson(input)).toBe(input)
    })
  })

  describe('trailing commas', () => {
    it('removes trailing comma before closing brace', () => {
      const input = '{"merchant": "Store", "total": 5000,}'
      const result = JSON.parse(repairJson(input))
      expect(result).toEqual({ merchant: 'Store', total: 5000 })
    })

    it('removes trailing comma before closing bracket', () => {
      const input = '{"items": ["Apple", "Banana",]}'
      const result = JSON.parse(repairJson(input))
      expect(result).toEqual({ items: ['Apple', 'Banana'] })
    })

    it('removes trailing comma with whitespace and newlines', () => {
      const input = '{"items": [\n  "Apple",\n  "Banana",\n]}'
      const result = JSON.parse(repairJson(input))
      expect(result).toEqual({ items: ['Apple', 'Banana'] })
    })

    it('does not remove commas between elements', () => {
      const input = '{"a": 1, "b": 2}'
      expect(repairJson(input)).toBe(input)
    })
  })

  describe('inline comments', () => {
    it('strips // line comments', () => {
      const input = '{"total": 5000 // Chilean pesos\n}'
      const result = JSON.parse(repairJson(input))
      expect(result).toEqual({ total: 5000 })
    })

    it('strips /* block comments */', () => {
      const input = '{"total": /* amount */ 5000}'
      const result = JSON.parse(repairJson(input))
      expect(result).toEqual({ total: 5000 })
    })

    it('strips // comment after extracted header', () => {
      const input = '{"merchant": "Store" // extracted from header\n, "total": 5000}'
      const result = JSON.parse(repairJson(input))
      expect(result).toEqual({ merchant: 'Store', total: 5000 })
    })

    it('preserves :// in URLs (does not strip protocol separators)', () => {
      const input = '{url: "https://store.cl/path"}'
      const result = JSON.parse(repairJson(input))
      expect(result).toEqual({ url: 'https://store.cl/path' })
    })
  })

  describe('combined malformations', () => {
    it('repairs input with all four issues simultaneously', () => {
      const input = "{merchant: 'Store', // from header\nitems: [{name: 'Apple', price: 100,}],}"
      const result = JSON.parse(repairJson(input))
      expect(result).toEqual({
        merchant: 'Store',
        items: [{ name: 'Apple', price: 100 }],
      })
    })

    it('handles realistic Gemini receipt output', () => {
      const input = `{
  merchant: "Lider Express",
  date: "2026-04-02",
  total: 15990,
  items: [
    {name: "Leche", quantity: 2, price: 1290,},
    {name: "Pan", quantity: 1, price: 990,},
  ], // items from receipt
}`
      const result = JSON.parse(repairJson(input))
      expect(result.merchant).toBe('Lider Express')
      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(15990)
    })
  })

  describe('passthrough for valid JSON', () => {
    it('passes valid JSON through unchanged', () => {
      const input = '{"merchant": "Store", "total": 5000}'
      expect(repairJson(input)).toBe(input)
    })

    it('passes complex valid JSON through unchanged', () => {
      const input = JSON.stringify({
        merchant: 'Store',
        items: [{ name: 'Apple', price: 100 }],
        total: 100,
      })
      expect(repairJson(input)).toBe(input)
    })
  })
})

describe('parseJsonWithRepair', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('parses valid JSON without triggering repair', () => {
    const input = '{"merchant": "Store"}'
    expect(parseJsonWithRepair(input)).toEqual({ merchant: 'Store' })
  })

  it('preserves valid JSON with apostrophes (try-native-first)', () => {
    const input = '{"name": "O\'Higgins Store"}'
    const result = parseJsonWithRepair(input)
    expect(result).toEqual({ name: "O'Higgins Store" })
  })

  it('preserves valid JSON with URLs (try-native-first)', () => {
    const input = '{"website": "https://store.cl/path"}'
    const result = parseJsonWithRepair(input)
    expect(result).toEqual({ website: 'https://store.cl/path' })
  })

  it('repairs and parses malformed JSON', () => {
    const input = '{merchant: "Store", total: 5000,}'
    expect(parseJsonWithRepair(input)).toEqual({ merchant: 'Store', total: 5000 })
  })

  it('logs warning when repair is applied', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation()
    const input = '{merchant: "Store"}'
    parseJsonWithRepair(input)
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('JSON repair applied')
    )
    warnSpy.mockRestore()
  })

  it('does not log when JSON is valid', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation()
    const input = '{"merchant": "Store"}'
    parseJsonWithRepair(input)
    expect(warnSpy).not.toHaveBeenCalled()
    warnSpy.mockRestore()
  })

  it('throws original SyntaxError when repair also fails', () => {
    const input = '{{{completely broken'
    expect(() => parseJsonWithRepair(input)).toThrow(SyntaxError)
  })

  it('throws original error, not post-repair error', () => {
    expect.assertions(1)
    const input = '{"unclosed": '
    try {
      parseJsonWithRepair(input)
    } catch (error) {
      expect(error).toBeInstanceOf(SyntaxError)
    }
  })
})
