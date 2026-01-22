/**
 * Story 14c-refactor.17: ThemeContext Tests
 *
 * Tests for the ThemeContext that manages theme and locale settings.
 *
 * Features tested:
 * - Light/dark theme
 * - Color theme (mono, normal, professional)
 * - Font settings (color mode, size, family)
 * - Locale settings (language, currency, date format)
 * - localStorage persistence
 *
 * Architecture Reference: Epic 14c-refactor - App Decomposition
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import React from 'react';
import {
    ThemeProvider,
    useTheme,
    useThemeOptional,
} from '../../../src/contexts/ThemeContext';
import type { FontFamily } from '../../../src/types/settings';

// =============================================================================
// Test Setup
// =============================================================================

function createWrapper(fontFamily: FontFamily = 'outfit') {
    return function Wrapper({ children }: { children: React.ReactNode }) {
        return (
            <ThemeProvider fontFamily={fontFamily}>
                {children}
            </ThemeProvider>
        );
    };
}

// =============================================================================
// localStorage Mock
// =============================================================================

let mockStorage: Record<string, string>;
let mockLocalStorage: Storage;

function setupMockLocalStorage() {
    mockStorage = {};
    mockLocalStorage = {
        getItem: vi.fn((key: string) => mockStorage[key] ?? null),
        setItem: vi.fn((key: string, value: string) => {
            mockStorage[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete mockStorage[key];
        }),
        clear: vi.fn(() => {
            mockStorage = {};
        }),
        length: 0,
        key: vi.fn(() => null),
    };
    vi.stubGlobal('localStorage', mockLocalStorage);
}

// =============================================================================
// Tests
// =============================================================================

describe('ThemeContext (Story 14c-refactor.9)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setupMockLocalStorage();
    });

    afterEach(() => {
        vi.clearAllMocks();
        vi.unstubAllGlobals();
    });

    // ===========================================================================
    // Initial State Tests (with default localStorage)
    // ===========================================================================

    describe('Initial State (defaults)', () => {
        it('should start with light theme by default', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(result.current.theme).toBe('light');
        });

        it('should start with mono color theme by default', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(result.current.colorTheme).toBe('mono');
        });

        it('should start with colorful font color mode by default', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(result.current.fontColorMode).toBe('colorful');
        });

        it('should start with small font size by default', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(result.current.fontSize).toBe('small');
        });

        it('should start with Spanish language by default', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(result.current.lang).toBe('es');
        });

        it('should start with CLP currency by default', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(result.current.currency).toBe('CLP');
        });

        it('should start with LatAm date format by default', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(result.current.dateFormat).toBe('LatAm');
        });

        it('should use fontFamily from props', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper('space'),
            });

            expect(result.current.fontFamily).toBe('space');
        });

        it('should provide all setter functions', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(typeof result.current.setTheme).toBe('function');
            expect(typeof result.current.setColorTheme).toBe('function');
            expect(typeof result.current.setFontColorMode).toBe('function');
            expect(typeof result.current.setFontSize).toBe('function');
            expect(typeof result.current.setLang).toBe('function');
            expect(typeof result.current.setCurrency).toBe('function');
            expect(typeof result.current.setDateFormat).toBe('function');
        });
    });

    // ===========================================================================
    // localStorage Loading Tests
    // ===========================================================================

    describe('localStorage Loading', () => {
        it('should load theme from localStorage', () => {
            mockStorage['theme'] = 'dark';

            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(result.current.theme).toBe('dark');
        });

        it('should load colorTheme from localStorage', () => {
            mockStorage['colorTheme'] = 'professional';

            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(result.current.colorTheme).toBe('professional');
        });

        it('should migrate ghibli colorTheme to normal', () => {
            mockStorage['colorTheme'] = 'ghibli';

            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(result.current.colorTheme).toBe('normal');
        });

        it('should migrate default colorTheme to professional', () => {
            mockStorage['colorTheme'] = 'default';

            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(result.current.colorTheme).toBe('professional');
        });

        it('should load fontColorMode from localStorage', () => {
            mockStorage['fontColorMode'] = 'plain';

            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(result.current.fontColorMode).toBe('plain');
        });

        it('should load fontSize from localStorage', () => {
            mockStorage['fontSize'] = 'normal';

            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(result.current.fontSize).toBe('normal');
        });

        it('should load lang from localStorage', () => {
            mockStorage['lang'] = 'en';

            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(result.current.lang).toBe('en');
        });

        it('should load currency from localStorage', () => {
            mockStorage['currency'] = 'USD';

            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(result.current.currency).toBe('USD');
        });

        it('should load dateFormat from localStorage', () => {
            mockStorage['dateFormat'] = 'US';

            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            expect(result.current.dateFormat).toBe('US');
        });
    });

    // ===========================================================================
    // Theme Setting Tests
    // ===========================================================================

    describe('Theme Setting', () => {
        it('should set theme to dark', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setTheme('dark');
            });

            expect(result.current.theme).toBe('dark');
            expect(mockStorage['theme']).toBe('dark');
        });

        it('should set theme to light', () => {
            mockStorage['theme'] = 'dark';

            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setTheme('light');
            });

            expect(result.current.theme).toBe('light');
            expect(mockStorage['theme']).toBe('light');
        });
    });

    // ===========================================================================
    // Color Theme Setting Tests
    // ===========================================================================

    describe('Color Theme Setting', () => {
        it('should set colorTheme to normal', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setColorTheme('normal');
            });

            expect(result.current.colorTheme).toBe('normal');
            expect(mockStorage['colorTheme']).toBe('normal');
        });

        it('should set colorTheme to professional', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setColorTheme('professional');
            });

            expect(result.current.colorTheme).toBe('professional');
            expect(mockStorage['colorTheme']).toBe('professional');
        });

        it('should set colorTheme to mono', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setColorTheme('mono');
            });

            expect(result.current.colorTheme).toBe('mono');
            expect(mockStorage['colorTheme']).toBe('mono');
        });
    });

    // ===========================================================================
    // Font Settings Tests
    // ===========================================================================

    describe('Font Settings', () => {
        it('should set fontColorMode to plain', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setFontColorMode('plain');
            });

            expect(result.current.fontColorMode).toBe('plain');
            expect(mockStorage['fontColorMode']).toBe('plain');
        });

        it('should set fontSize to normal', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setFontSize('normal');
            });

            expect(result.current.fontSize).toBe('normal');
            expect(mockStorage['fontSize']).toBe('normal');
        });
    });

    // ===========================================================================
    // Locale Settings Tests
    // ===========================================================================

    describe('Locale Settings', () => {
        it('should set lang to en', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setLang('en');
            });

            expect(result.current.lang).toBe('en');
            expect(mockStorage['lang']).toBe('en');
        });

        it('should set currency to USD', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setCurrency('USD');
            });

            expect(result.current.currency).toBe('USD');
            expect(mockStorage['currency']).toBe('USD');
        });

        it('should set currency to EUR', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setCurrency('EUR');
            });

            expect(result.current.currency).toBe('EUR');
            expect(mockStorage['currency']).toBe('EUR');
        });

        it('should set dateFormat to US', () => {
            const { result } = renderHook(() => useTheme(), {
                wrapper: createWrapper(),
            });

            act(() => {
                result.current.setDateFormat('US');
            });

            expect(result.current.dateFormat).toBe('US');
            expect(mockStorage['dateFormat']).toBe('US');
        });
    });

    // ===========================================================================
    // Error Handling Tests
    // ===========================================================================

    describe('Error Handling', () => {
        it('should throw error when useTheme is used outside provider', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            expect(() => {
                renderHook(() => useTheme());
            }).toThrow('useTheme must be used within a ThemeProvider');

            consoleSpy.mockRestore();
        });

        it('should return null when useThemeOptional is used outside provider', () => {
            const { result } = renderHook(() => useThemeOptional());

            expect(result.current).toBeNull();
        });
    });

    // ===========================================================================
    // Component Integration Tests
    // ===========================================================================

    describe('Component Integration', () => {
        it('should provide context to child components', () => {
            function TestChild() {
                const { theme, lang, currency } = useTheme();
                return (
                    <div>
                        <div data-testid="theme">{theme}</div>
                        <div data-testid="lang">{lang}</div>
                        <div data-testid="currency">{currency}</div>
                    </div>
                );
            }

            render(
                <ThemeProvider>
                    <TestChild />
                </ThemeProvider>
            );

            expect(screen.getByTestId('theme')).toHaveTextContent('light');
            expect(screen.getByTestId('lang')).toHaveTextContent('es');
            expect(screen.getByTestId('currency')).toHaveTextContent('CLP');
        });

        it('should update child components when theme changes', () => {
            function TestChild() {
                const { theme, setTheme } = useTheme();
                return (
                    <div>
                        <div data-testid="theme">{theme}</div>
                        <button onClick={() => setTheme('dark')}>Toggle Dark</button>
                    </div>
                );
            }

            render(
                <ThemeProvider>
                    <TestChild />
                </ThemeProvider>
            );

            expect(screen.getByTestId('theme')).toHaveTextContent('light');

            act(() => {
                screen.getByText('Toggle Dark').click();
            });

            expect(screen.getByTestId('theme')).toHaveTextContent('dark');
        });
    });
});
