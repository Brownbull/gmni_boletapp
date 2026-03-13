/**
 * Statement Scanning Prompt — V1 Spike
 *
 * Story 18-1: Gemini PDF feasibility validation for Chilean credit card statements.
 *
 * KEY DIFFERENCES from receipt prompt (V4):
 * - Input: credit card statement (not a receipt)
 * - Output: MULTIPLE transactions (not one)
 * - Fields: date, merchant/description, amount, type (cargo/abono)
 * - Statement metadata: bank, period, card info, totals
 *
 * This prompt is for spike testing only — not registered in the prompt registry.
 */

import {
  STORE_CATEGORIES_GROUPED,
} from '../../shared/schema/categories';

/**
 * Build the statement extraction prompt.
 *
 * Variables:
 * - {{date}}: Today's date in YYYY-MM-DD format
 */
export function buildStatementPrompt(date: string): string {
  return `Analyze this credit card statement document. Extract ALL transactions listed.

This is a Chilean credit card statement (cartola/estado de cuenta). It contains multiple purchase transactions (cargos), payments (abonos), and possibly fees/interest.

TODAY: ${date}

TASK: Extract every transaction line from the statement into a structured JSON array.

OUTPUT: Strict JSON only. No markdown, no explanation.
{
  "statementInfo": {
    "bank": "<bank/issuer name>",
    "cardType": "<card type if visible, e.g., CMR Visa, Banco de Chile Mastercard>",
    "cardLastFour": "<last 4 digits if visible, or null>",
    "period": "<billing period, e.g., '2025-03-01 to 2025-03-31'>",
    "closingDate": "<statement closing date YYYY-MM-DD or null>",
    "dueDate": "<payment due date YYYY-MM-DD or null>",
    "totalDebit": <total charges/cargos as integer or null>,
    "totalCredit": <total payments/abonos as integer or null>,
    "currency": "<detected currency code, usually CLP>"
  },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "description": "<merchant or transaction description (max 80 chars)>",
      "amount": <integer, positive for charges, negative for payments/credits>,
      "type": "<cargo | abono | interes | comision | seguro | otro>",
      "installment": "<e.g., '3/6' if installment visible, or null>",
      "category": "<store category KEY from list below>",
      "originalCurrency": "<if foreign transaction, original currency code, else null>",
      "originalAmount": <if foreign transaction, original amount as integer, else null>
    }
  ],
  "metadata": {
    "totalTransactions": <count of transactions extracted>,
    "confidence": <0.0-1.0>,
    "pageCount": <number of pages in the document>,
    "warnings": ["<any issues encountered, e.g., 'partially illegible section'>"]
  }
}

STORE CATEGORIES — pick exactly one KEY per transaction:
${STORE_CATEGORIES_GROUPED}

PRICE CONVERSION:
- Convert ALL monetary values to INTEGER smallest units (no dots, no commas)
- Chilean Pesos (CLP): use as-is (e.g., $15.990 → 15990, $1.234.567 → 1234567)
- Foreign currencies: convert to integer smallest units (e.g., USD $15.99 → 1599)

TRANSACTION TYPE CLASSIFICATION:
- "cargo": purchase/charge (compra, cuota, gasto)
- "abono": payment/credit (pago, abono, devolución)
- "interes": interest charge (interés)
- "comision": fee/commission (comisión, cargo por servicio)
- "seguro": insurance (seguro, prima)
- "otro": anything that doesn't fit above

DATE RULES:
- Extract the TRANSACTION date (fecha de compra/transacción), not the posting date
- If only one date per line, use that
- Format: YYYY-MM-DD
- If year is ambiguous, infer from the statement period

CHILEAN STATEMENT RULES:
- "CMR" = Banco Falabella credit card (CMR Visa / CMR Mastercard)
- "Cuota X de Y" or "X/Y" = installment payment, extract as installment field
- Amounts with dots are thousands separators (e.g., 15.990 = 15990 CLP)
- "TC" or "Tarjeta de Crédito" = credit card transaction
- "Compra en" = purchase at (the merchant follows)
- "Pago" or "Abono" = payment made toward the card balance
- Foreign transactions may show "USD", "EUR" etc. with the original amount

RULES:
1. Extract ALL visible transactions — do not skip any line items
2. Maintain the order they appear in the statement
3. For installments, the amount is the installment amount (cuota), not the total purchase
4. If a transaction description is cut off, include what's visible
5. Category assignment: use the merchant/description to pick the best store category
6. If you cannot determine the category, use "Other"
7. Charges (cargos) are POSITIVE amounts, payments (abonos) are NEGATIVE
8. VALIDATION: totalDebit should roughly equal the sum of positive transaction amounts`;
}
