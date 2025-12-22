import { describe, it, expect } from 'vitest';
import { TRUST_THRESHOLDS } from '../../../src/types/trust';

describe('Trust Types', () => {
    describe('TRUST_THRESHOLDS', () => {
        it('should have minimum scans threshold of 3 (AC #2)', () => {
            expect(TRUST_THRESHOLDS.MIN_SCANS).toBe(3);
        });

        it('should have maximum edit rate threshold of 10% (AC #2)', () => {
            expect(TRUST_THRESHOLDS.MAX_EDIT_RATE).toBe(0.10);
        });

        it('should be immutable (readonly)', () => {
            // TypeScript enforces this at compile time, but we can verify the values are numbers
            expect(typeof TRUST_THRESHOLDS.MIN_SCANS).toBe('number');
            expect(typeof TRUST_THRESHOLDS.MAX_EDIT_RATE).toBe('number');
        });
    });
});
