/**
 * Statement Prompt Type Definitions
 *
 * Defines the StatementPromptConfig interface and output types
 * for versioned statement extraction prompts.
 *
 * Statement prompts differ from receipt prompts:
 * - Input: PDF (not image)
 * - Output: MULTIPLE transactions (not one)
 * - Fields: statementInfo + transactions[] + metadata
 */

/**
 * Configuration for a versioned statement prompt.
 * Parallel to PromptConfig for receipts but with statement-specific metadata.
 */
export interface StatementPromptConfig {
  /** Unique identifier, e.g., "s1-statement-extraction" */
  id: string;

  /** Human-readable name, e.g., "Statement Extraction V1" */
  name: string;

  /** Description of this prompt version */
  description: string;

  /** Semantic version string, e.g., "1.0.0" */
  version: string;

  /** ISO date when this prompt was created */
  createdAt: string;

  /**
   * The prompt template with placeholders.
   * Variables: {{date}} (injected at runtime)
   */
  prompt: string;
}

// ============================================================================
// Statement Output Types (what Gemini returns)
// ============================================================================

export interface StatementTransaction {
  date: string;
  description: string;
  amount: number;
  type: 'cargo' | 'abono' | 'interes' | 'comision' | 'seguro' | 'otro';
  installment: string | null;
  category: string;
  originalCurrency: string | null;
  originalAmount: number | null;
}

export interface StatementInfo {
  bank: string;
  cardType: string;
  cardLastFour: string | null;
  period: string;
  closingDate: string | null;
  dueDate: string | null;
  totalDebit: number | null;
  totalCredit: number | null;
  currency: string;
}

export interface StatementMetadata {
  totalTransactions: number;
  confidence: number;
  pageCount: number;
  warnings: string[];
}

export interface StatementResult {
  statementInfo: StatementInfo;
  transactions: StatementTransaction[];
  metadata: StatementMetadata;
}
