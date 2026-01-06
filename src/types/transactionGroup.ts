/**
 * Transaction Group Types
 *
 * Story 14.15: Transaction Selection Mode & Groups
 * Epic 14: Core Implementation
 *
 * Custom user-defined groups for organizing transactions.
 * Each transaction can belong to only ONE group at a time.
 *
 * @example
 * ```typescript
 * const group: TransactionGroup = {
 *   id: 'abc123',
 *   name: '🎄 Navidad 2024',
 *   transactionCount: 15,
 *   totalAmount: 245000,
 *   createdAt: Timestamp.now(),
 *   updatedAt: Timestamp.now(),
 * };
 * ```
 */

import type { Timestamp } from 'firebase/firestore';

/**
 * A user-defined transaction group.
 *
 * Groups allow users to organize transactions by projects, events,
 * or personal categories (e.g., "🏠 Gastos del Hogar", "🚗 Viaje Valparaíso").
 */
export interface TransactionGroup {
    /** Firestore document ID */
    id?: string;

    /** Group name (may include emoji prefix) */
    name: string;

    /** Group color (hex code, e.g., "#10b981") for visual identification */
    color?: string;

    /** Number of transactions in this group (denormalized for display) */
    transactionCount: number;

    /** Total amount of all transactions in this group (denormalized for display) */
    totalAmount: number;

    /** Currency code for totalAmount (e.g., "CLP", "USD") */
    currency?: string;

    /** Timestamp when the group was created */
    createdAt: Timestamp;

    /** Timestamp when the group was last modified */
    updatedAt: Timestamp;
}

/**
 * Data required to create a new transaction group.
 * Omits auto-generated fields (id, counts, timestamps).
 */
export type CreateTransactionGroupInput = Pick<TransactionGroup, 'name'> & {
    /** Optional currency for the group */
    currency?: string;
    /** Optional color for the group (hex code) */
    color?: string;
};

/**
 * Data that can be updated on an existing group.
 */
export type UpdateTransactionGroupInput = Partial<Pick<TransactionGroup, 'name' | 'currency' | 'color'>>;

/**
 * Type guard to check if a group has transactions
 */
export function groupHasTransactions(group: TransactionGroup): boolean {
    return group.transactionCount > 0;
}

/**
 * Extract emoji from group name if present at the start.
 * Returns empty string if no emoji found.
 *
 * @example
 * extractGroupEmoji('🎄 Navidad 2024') // '🎄'
 * extractGroupEmoji('Gastos del Hogar') // ''
 */
export function extractGroupEmoji(name: string): string {
    // Match emoji at the start of the string
    // This regex matches most common emoji patterns
    const emojiRegex = /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/u;
    const match = name.match(emojiRegex);
    return match ? match[0] : '';
}

/**
 * Extract group name without emoji prefix.
 *
 * @example
 * extractGroupLabel('🎄 Navidad 2024') // 'Navidad 2024'
 * extractGroupLabel('Gastos del Hogar') // 'Gastos del Hogar'
 */
export function extractGroupLabel(name: string): string {
    const emoji = extractGroupEmoji(name);
    if (emoji) {
        // Remove emoji and any leading whitespace
        return name.slice(emoji.length).trimStart();
    }
    return name;
}
