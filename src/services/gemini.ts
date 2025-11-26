import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../config/firebase';
import { Transaction } from '../types/transaction';

// Initialize Firebase Functions
const functions = getFunctions(app);

// Type definition for Cloud Function request
interface AnalyzeReceiptRequest {
    images: string[];
    currency: string;
}

/**
 * Analyzes receipt images using Firebase Cloud Function
 * The actual Gemini API call happens server-side for security
 *
 * @param images - Array of base64 encoded images
 * @param currency - Currency code (e.g., "CLP")
 * @returns Promise<Transaction> - Parsed transaction data
 * @throws Error if analysis fails or user is not authenticated
 */
export async function analyzeReceipt(
    images: string[],
    currency: string
): Promise<Transaction> {
    try {
        // Call the Cloud Function
        const analyzeReceiptFn = httpsCallable<AnalyzeReceiptRequest, Transaction>(
            functions,
            'analyzeReceipt'
        );

        const result = await analyzeReceiptFn({ images, currency });

        return result.data;
    } catch (error: any) {
        // Handle Firebase Functions errors
        console.error('Error calling analyzeReceipt Cloud Function:', error);

        // Provide user-friendly error messages
        if (error.code === 'unauthenticated') {
            throw new Error('You must be logged in to scan receipts.');
        }

        if (error.code === 'invalid-argument') {
            throw new Error('Invalid receipt data. Please try again.');
        }

        // Re-throw with original message or generic message
        throw new Error(
            error.message || 'Failed to analyze receipt. Please try again or enter manually.'
        );
    }
}
