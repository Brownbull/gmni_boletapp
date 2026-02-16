/**
 * Unit tests for CountryFlag component
 *
 * Story 14.35b: Country flag display component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CountryFlag } from '@features/history/components/CountryFlag';

describe('CountryFlag', () => {
    describe('basic rendering', () => {
        it('should render flag emoji for Chile', () => {
            render(<CountryFlag country="Chile" />);
            expect(screen.getByRole('img')).toHaveTextContent('🇨🇱');
        });

        it('should render flag emoji for United States', () => {
            render(<CountryFlag country="United States" />);
            expect(screen.getByRole('img')).toHaveTextContent('🇺🇸');
        });

        it('should render white flag for unknown country', () => {
            render(<CountryFlag country="Atlantis" />);
            expect(screen.getByRole('img')).toHaveTextContent('🏳️');
        });

        it('should render white flag for null country', () => {
            render(<CountryFlag country={null} />);
            expect(screen.getByRole('img')).toHaveTextContent('🏳️');
        });

        it('should render white flag for undefined country', () => {
            render(<CountryFlag country={undefined} />);
            expect(screen.getByRole('img')).toHaveTextContent('🏳️');
        });
    });

    describe('size variants', () => {
        it('should apply small size class', () => {
            render(<CountryFlag country="Chile" size="small" />);
            const flag = screen.getByRole('img');
            expect(flag).toHaveClass('text-xs');
        });

        it('should apply medium size class by default', () => {
            render(<CountryFlag country="Chile" />);
            const flag = screen.getByRole('img');
            expect(flag).toHaveClass('text-base');
        });

        it('should apply medium size class when explicitly set', () => {
            render(<CountryFlag country="Chile" size="medium" />);
            const flag = screen.getByRole('img');
            expect(flag).toHaveClass('text-base');
        });

        it('should apply large size class', () => {
            render(<CountryFlag country="Chile" size="large" />);
            const flag = screen.getByRole('img');
            expect(flag).toHaveClass('text-xl');
        });
    });

    describe('accessibility', () => {
        it('should have role="img" for accessibility', () => {
            render(<CountryFlag country="Chile" />);
            expect(screen.getByRole('img')).toBeInTheDocument();
        });

        it('should have default aria-label with country name', () => {
            render(<CountryFlag country="Chile" />);
            expect(screen.getByRole('img')).toHaveAttribute(
                'aria-label',
                'Flag of Chile'
            );
        });

        it('should use custom aria-label when provided', () => {
            render(
                <CountryFlag
                    country="Chile"
                    ariaLabel="Transaction from Chile"
                />
            );
            expect(screen.getByRole('img')).toHaveAttribute(
                'aria-label',
                'Transaction from Chile'
            );
        });

        it('should have fallback aria-label for null country', () => {
            render(<CountryFlag country={null} />);
            expect(screen.getByRole('img')).toHaveAttribute(
                'aria-label',
                'Unknown location'
            );
        });
    });

    describe('className prop', () => {
        it('should apply custom className', () => {
            render(<CountryFlag country="Chile" className="mr-2" />);
            const flag = screen.getByRole('img');
            expect(flag).toHaveClass('mr-2');
        });

        it('should combine custom className with base classes', () => {
            render(<CountryFlag country="Chile" className="mr-2" size="large" />);
            const flag = screen.getByRole('img');
            expect(flag).toHaveClass('mr-2', 'text-xl', 'inline-block');
        });

        it('should handle empty className', () => {
            render(<CountryFlag country="Chile" className="" />);
            const flag = screen.getByRole('img');
            expect(flag).toHaveClass('inline-block');
        });
    });

    describe('edge cases', () => {
        it('should handle ISO codes', () => {
            render(<CountryFlag country="CL" />);
            expect(screen.getByRole('img')).toHaveTextContent('🇨🇱');
        });

        it('should handle lowercase country names', () => {
            render(<CountryFlag country="chile" />);
            expect(screen.getByRole('img')).toHaveTextContent('🇨🇱');
        });

        it('should handle country names with extra whitespace', () => {
            render(<CountryFlag country="  Chile  " />);
            expect(screen.getByRole('img')).toHaveTextContent('🇨🇱');
        });

        it('should handle empty string country', () => {
            render(<CountryFlag country="" />);
            expect(screen.getByRole('img')).toHaveTextContent('🏳️');
        });
    });
});
