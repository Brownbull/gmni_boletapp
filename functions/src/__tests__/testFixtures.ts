/**
 * Shared test fixtures for Cloud Function tests.
 * Keeps malformed-JSON test data DRY across analyzeReceipt and processReceiptScan suites.
 */

/** Malformed Gemini response with all four malformation types:
 *  markdown fence, unquoted keys, trailing commas, inline comments */
export const MALFORMED_GEMINI_JSON =
  '```json\n{\n  merchant: "Lider Express",\n  date: "2026-04-02",\n  total: 15990,\n  currency: "CLP",\n  category: "Groceries",\n  items: [\n    {name: "Leche Entera 1L", totalPrice: 1290, quantity: 2, category: "Dairy",},\n    {name: "Pan Molde Integral", totalPrice: 990, quantity: 1, category: "Bakery",},\n  ], // items extracted from receipt\n  metadata: {\n    receiptType: "receipt",\n    confidence: 0.88,\n  }\n}\n```'
