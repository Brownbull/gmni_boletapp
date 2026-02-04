/**
 * useFocusTrap Hook Tests
 *
 * Tests for the WCAG 2.1 AA compliant focus trap hook.
 * This is a shared utility hook used by dialog components.
 *
 * Test coverage:
 * - Tab from last element wraps to first
 * - Shift+Tab from first element wraps to last
 * - No effect when disabled
 * - Handles container with no focusable elements
 *
 * WCAG 2.1 AA Requirements:
 * - 2.1.2: No Keyboard Trap (focus can be moved away when dialog closes)
 * - 2.4.3: Focus Order (logical, predictable focus sequence)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createRef, RefObject } from 'react';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';

describe('useFocusTrap', () => {
    let container: HTMLDivElement;
    let containerRef: RefObject<HTMLDivElement>;

    // Helper to create a container with focusable elements
    const createContainer = (html: string): HTMLDivElement => {
        const div = document.createElement('div');
        div.innerHTML = html;
        document.body.appendChild(div);
        return div;
    };

    // Helper to simulate Tab key press
    const pressTab = (shiftKey = false) => {
        const event = new KeyboardEvent('keydown', {
            key: 'Tab',
            shiftKey,
            bubbles: true,
        });
        // Allow preventDefault to be called
        const preventDefault = vi.fn();
        Object.defineProperty(event, 'preventDefault', {
            value: preventDefault,
        });
        document.dispatchEvent(event);
        return { event, preventDefault };
    };

    beforeEach(() => {
        // Clean up any previous containers
        document.body.innerHTML = '';
    });

    afterEach(() => {
        document.body.innerHTML = '';
        vi.clearAllMocks();
    });

    // =========================================================================
    // Basic Focus Trapping
    // =========================================================================

    describe('Basic Focus Trapping', () => {
        it('traps focus within container when Tab is pressed on last element', () => {
            container = createContainer(`
                <button id="first">First</button>
                <input id="middle" type="text" />
                <button id="last">Last</button>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            renderHook(() => useFocusTrap(ref, true));

            // Focus the last element
            const lastElement = container.querySelector('#last') as HTMLElement;
            lastElement.focus();
            expect(document.activeElement).toBe(lastElement);

            // Press Tab - should wrap to first
            pressTab();

            const firstElement = container.querySelector('#first') as HTMLElement;
            expect(document.activeElement).toBe(firstElement);
        });

        it('traps focus within container when Shift+Tab is pressed on first element', () => {
            container = createContainer(`
                <button id="first">First</button>
                <input id="middle" type="text" />
                <button id="last">Last</button>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            renderHook(() => useFocusTrap(ref, true));

            // Focus the first element
            const firstElement = container.querySelector('#first') as HTMLElement;
            firstElement.focus();
            expect(document.activeElement).toBe(firstElement);

            // Press Shift+Tab - should wrap to last
            pressTab(true);

            const lastElement = container.querySelector('#last') as HTMLElement;
            expect(document.activeElement).toBe(lastElement);
        });

        it('allows normal Tab navigation within container', () => {
            container = createContainer(`
                <button id="first">First</button>
                <input id="middle" type="text" />
                <button id="last">Last</button>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            renderHook(() => useFocusTrap(ref, true));

            // Focus the first element
            const firstElement = container.querySelector('#first') as HTMLElement;
            firstElement.focus();

            // Tab from first should go to middle (normal behavior)
            // Note: Browser handles actual focus movement, we just prevent escape
            const { preventDefault } = pressTab();

            // Since we're on first (not last), preventDefault should NOT be called
            expect(preventDefault).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Disabled State
    // =========================================================================

    describe('Disabled State', () => {
        it('does not trap focus when isEnabled is false', () => {
            container = createContainer(`
                <button id="first">First</button>
                <button id="last">Last</button>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            renderHook(() => useFocusTrap(ref, false));

            // Focus the last element
            const lastElement = container.querySelector('#last') as HTMLElement;
            lastElement.focus();

            // Press Tab - should NOT be trapped
            const { preventDefault } = pressTab();
            expect(preventDefault).not.toHaveBeenCalled();
        });

        it('responds to isEnabled changes', () => {
            container = createContainer(`
                <button id="first">First</button>
                <button id="last">Last</button>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            const { rerender } = renderHook(
                ({ isEnabled }) => useFocusTrap(ref, isEnabled),
                { initialProps: { isEnabled: false } }
            );

            // Focus last element
            const lastElement = container.querySelector('#last') as HTMLElement;
            lastElement.focus();

            // Disabled - Tab should not be prevented
            let result = pressTab();
            expect(result.preventDefault).not.toHaveBeenCalled();

            // Enable
            rerender({ isEnabled: true });

            // Focus last again (simulating re-focus)
            lastElement.focus();

            // Enabled - Tab should wrap to first
            pressTab();
            const firstElement = container.querySelector('#first') as HTMLElement;
            expect(document.activeElement).toBe(firstElement);
        });
    });

    // =========================================================================
    // No Focusable Elements
    // =========================================================================

    describe('No Focusable Elements', () => {
        it('handles container with no focusable elements gracefully', () => {
            container = createContainer(`
                <div>No focusable elements here</div>
                <span>Just text</span>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            // Should not throw
            expect(() => {
                renderHook(() => useFocusTrap(ref, true));
                pressTab();
            }).not.toThrow();
        });

        it('handles empty container gracefully', () => {
            container = createContainer('');

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            expect(() => {
                renderHook(() => useFocusTrap(ref, true));
                pressTab();
            }).not.toThrow();
        });

        it('handles null ref gracefully', () => {
            const ref = createRef<HTMLDivElement>();
            // ref.current is null by default

            expect(() => {
                renderHook(() => useFocusTrap(ref, true));
                pressTab();
            }).not.toThrow();
        });
    });

    // =========================================================================
    // Focusable Element Types
    // =========================================================================

    describe('Focusable Element Types', () => {
        it('includes buttons in focusable elements', () => {
            container = createContainer(`
                <button id="btn">Button</button>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            renderHook(() => useFocusTrap(ref, true));

            const btn = container.querySelector('#btn') as HTMLElement;
            btn.focus();
            expect(document.activeElement).toBe(btn);

            // Tab should wrap back to self (only one focusable element)
            pressTab();
            expect(document.activeElement).toBe(btn);
        });

        it('includes inputs in focusable elements', () => {
            container = createContainer(`
                <input id="input" type="text" />
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            renderHook(() => useFocusTrap(ref, true));

            const input = container.querySelector('#input') as HTMLElement;
            input.focus();

            pressTab();
            expect(document.activeElement).toBe(input);
        });

        it('includes links with href in focusable elements', () => {
            container = createContainer(`
                <a id="link" href="#">Link</a>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            renderHook(() => useFocusTrap(ref, true));

            const link = container.querySelector('#link') as HTMLElement;
            link.focus();

            pressTab();
            expect(document.activeElement).toBe(link);
        });

        it('includes select elements in focusable elements', () => {
            container = createContainer(`
                <select id="select"><option>Option</option></select>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            renderHook(() => useFocusTrap(ref, true));

            const select = container.querySelector('#select') as HTMLElement;
            select.focus();

            pressTab();
            expect(document.activeElement).toBe(select);
        });

        it('includes textarea elements in focusable elements', () => {
            container = createContainer(`
                <textarea id="textarea"></textarea>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            renderHook(() => useFocusTrap(ref, true));

            const textarea = container.querySelector('#textarea') as HTMLElement;
            textarea.focus();

            pressTab();
            expect(document.activeElement).toBe(textarea);
        });

        it('includes elements with tabindex in focusable elements', () => {
            container = createContainer(`
                <div id="custom" tabindex="0">Custom focusable</div>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            renderHook(() => useFocusTrap(ref, true));

            const custom = container.querySelector('#custom') as HTMLElement;
            custom.focus();

            pressTab();
            expect(document.activeElement).toBe(custom);
        });

        it('excludes disabled buttons from focusable elements', () => {
            container = createContainer(`
                <button id="first">First</button>
                <button id="disabled" disabled>Disabled</button>
                <button id="last">Last</button>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            renderHook(() => useFocusTrap(ref, true));

            // Focus last element
            const lastElement = container.querySelector('#last') as HTMLElement;
            lastElement.focus();

            // Tab should wrap to first (skipping disabled)
            pressTab();
            const firstElement = container.querySelector('#first') as HTMLElement;
            expect(document.activeElement).toBe(firstElement);
        });

        it('excludes disabled inputs from focusable elements', () => {
            container = createContainer(`
                <input id="first" type="text" />
                <input id="disabled" type="text" disabled />
                <input id="last" type="text" />
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            renderHook(() => useFocusTrap(ref, true));

            const lastElement = container.querySelector('#last') as HTMLElement;
            lastElement.focus();

            pressTab();
            const firstElement = container.querySelector('#first') as HTMLElement;
            expect(document.activeElement).toBe(firstElement);
        });

        it('excludes elements with tabindex="-1" from focusable elements', () => {
            container = createContainer(`
                <button id="first">First</button>
                <div id="hidden" tabindex="-1">Not focusable via Tab</div>
                <button id="last">Last</button>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            renderHook(() => useFocusTrap(ref, true));

            const lastElement = container.querySelector('#last') as HTMLElement;
            lastElement.focus();

            pressTab();
            const firstElement = container.querySelector('#first') as HTMLElement;
            expect(document.activeElement).toBe(firstElement);
        });
    });

    // =========================================================================
    // Cleanup
    // =========================================================================

    describe('Cleanup', () => {
        it('removes event listener on unmount', () => {
            container = createContainer(`
                <button id="first">First</button>
                <button id="last">Last</button>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            const { unmount } = renderHook(() => useFocusTrap(ref, true));

            // Unmount
            unmount();

            // Focus last element
            const lastElement = container.querySelector('#last') as HTMLElement;
            lastElement.focus();

            // Tab should NOT be trapped anymore
            const { preventDefault } = pressTab();
            expect(preventDefault).not.toHaveBeenCalled();
        });

        it('removes event listener when disabled', () => {
            container = createContainer(`
                <button id="first">First</button>
                <button id="last">Last</button>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            const { rerender } = renderHook(
                ({ isEnabled }) => useFocusTrap(ref, isEnabled),
                { initialProps: { isEnabled: true } }
            );

            // Disable
            rerender({ isEnabled: false });

            // Focus last element
            const lastElement = container.querySelector('#last') as HTMLElement;
            lastElement.focus();

            // Tab should NOT be trapped
            const { preventDefault } = pressTab();
            expect(preventDefault).not.toHaveBeenCalled();
        });
    });

    // =========================================================================
    // Edge Cases
    // =========================================================================

    describe('Edge Cases', () => {
        it('handles focus on element outside container', () => {
            container = createContainer(`
                <button id="inside">Inside</button>
            `);

            // Create an element outside the container
            const outsideButton = document.createElement('button');
            outsideButton.id = 'outside';
            outsideButton.textContent = 'Outside';
            document.body.appendChild(outsideButton);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            renderHook(() => useFocusTrap(ref, true));

            // Focus outside element
            outsideButton.focus();

            // Tab should not throw or cause issues
            expect(() => pressTab()).not.toThrow();
        });

        it('handles dynamic content changes', () => {
            container = createContainer(`
                <button id="first">First</button>
                <button id="last">Last</button>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            renderHook(() => useFocusTrap(ref, true));

            // Add a new element dynamically
            const newButton = document.createElement('button');
            newButton.id = 'new';
            newButton.textContent = 'New';
            container.appendChild(newButton);

            // Focus the new last element
            newButton.focus();

            // Tab should wrap to first
            pressTab();
            const firstElement = container.querySelector('#first') as HTMLElement;
            expect(document.activeElement).toBe(firstElement);
        });

        it('handles single focusable element', () => {
            container = createContainer(`
                <button id="only">Only Button</button>
            `);

            const ref = createRef<HTMLDivElement>();
            (ref as { current: HTMLDivElement }).current = container;

            renderHook(() => useFocusTrap(ref, true));

            const onlyElement = container.querySelector('#only') as HTMLElement;
            onlyElement.focus();

            // Tab should stay on the same element
            pressTab();
            expect(document.activeElement).toBe(onlyElement);

            // Shift+Tab should also stay on the same element
            pressTab(true);
            expect(document.activeElement).toBe(onlyElement);
        });
    });
});
