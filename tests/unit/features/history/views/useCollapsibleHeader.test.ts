import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCollapsibleHeader } from '@features/history/views/useCollapsibleHeader';

describe('useCollapsibleHeader', () => {
    it('returns initial state not collapsed', () => {
        const { result } = renderHook(() => useCollapsibleHeader());
        expect(result.current.isHeaderCollapsed).toBe(false);
    });

    it('returns containerRef', () => {
        const { result } = renderHook(() => useCollapsibleHeader());
        expect(result.current.containerRef).toBeDefined();
        expect(result.current.containerRef.current).toBeNull();
    });

    it('returns scrollContainerRef', () => {
        const { result } = renderHook(() => useCollapsibleHeader());
        expect(result.current.scrollContainerRef).toBeDefined();
        expect(result.current.scrollContainerRef.current).toBeNull();
    });

    it('returns stable refs across renders', () => {
        const { result, rerender } = renderHook(() => useCollapsibleHeader());
        const firstContainerRef = result.current.containerRef;
        const firstScrollRef = result.current.scrollContainerRef;
        rerender();
        expect(result.current.containerRef).toBe(firstContainerRef);
        expect(result.current.scrollContainerRef).toBe(firstScrollRef);
    });
});
