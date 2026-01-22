/**
 * Story 14c-refactor.13: ViewModeContext Tests (Simplified)
 *
 * Tests for the simplified ViewModeContext that manages view mode
 * in memory only (no persistence).
 *
 * After Epic 14c-refactor, the context is simplified to:
 * - Always starts in personal mode
 * - No localStorage persistence
 * - No Firestore persistence
 * - setGroupMode is a no-op stub
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import {
  ViewModeProvider,
  useViewMode,
  useViewModeOptional,
} from '../../../src/contexts/ViewModeContext';
import type { SharedGroup } from '../../../src/types/sharedGroup';
import { Timestamp } from 'firebase/firestore';

// =============================================================================
// Test Setup
// =============================================================================

// Create a mock SharedGroup
function createMockSharedGroup(overrides: Partial<SharedGroup> = {}): SharedGroup {
  return {
    id: 'group-123',
    ownerId: 'user-456',
    appId: 'boletapp',
    name: 'Familia Martinez',
    color: '#10b981',
    icon: '👨‍👩‍👧',
    shareCode: 'abc123def456',
    shareCodeExpiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    members: ['user-456', 'user-789'],
    memberUpdates: {},
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
}

// Test wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ViewModeProvider>{children}</ViewModeProvider>
      </QueryClientProvider>
    );
  };
}

describe('ViewModeContext (Simplified - Story 14c-refactor.13)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ===========================================================================
  // Initial State Tests
  // ===========================================================================

  describe('Initial State', () => {
    it('should start in personal mode by default', () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      expect(result.current.mode).toBe('personal');
      expect(result.current.groupId).toBeUndefined();
      expect(result.current.group).toBeUndefined();
      expect(result.current.isGroupMode).toBe(false);
    });

    it('should provide setPersonalMode function', () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.setPersonalMode).toBe('function');
    });

    it('should provide setGroupMode function (stub)', () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      expect(typeof result.current.setGroupMode).toBe('function');
    });
  });

  // ===========================================================================
  // Mode Switching Tests (Stubbed)
  // ===========================================================================

  describe('Mode Switching (Stubbed)', () => {
    it('should NOT switch to group mode when setGroupMode is called (feature disabled)', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      const mockGroup = createMockSharedGroup();

      act(() => {
        result.current.setGroupMode(mockGroup.id!, mockGroup);
      });

      // Should remain in personal mode
      expect(result.current.mode).toBe('personal');
      expect(result.current.groupId).toBeUndefined();
      expect(result.current.isGroupMode).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should stay in personal mode when setPersonalMode is called', () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setPersonalMode();
      });

      expect(result.current.mode).toBe('personal');
      expect(result.current.groupId).toBeUndefined();
      expect(result.current.isGroupMode).toBe(false);
    });
  });

  // ===========================================================================
  // No Persistence Tests (AC1, AC4)
  // ===========================================================================

  describe('No Persistence (AC1, AC4)', () => {
    it('should NOT persist anything to localStorage', () => {
      const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      act(() => {
        result.current.setPersonalMode();
      });

      // No localStorage calls should be made
      expect(setItemSpy).not.toHaveBeenCalled();

      setItemSpy.mockRestore();
    });

    it('should NOT read from localStorage on initialization', () => {
      const getItemSpy = vi.spyOn(Storage.prototype, 'getItem');

      renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      // No localStorage reads for view mode
      expect(getItemSpy).not.toHaveBeenCalledWith('boletapp_view_mode');

      getItemSpy.mockRestore();
    });
  });

  // ===========================================================================
  // Error Handling Tests
  // ===========================================================================

  describe('Error Handling', () => {
    it('should throw error when useViewMode is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useViewMode());
      }).toThrow('useViewMode must be used within a ViewModeProvider');

      consoleSpy.mockRestore();
    });

    it('should return null when useViewModeOptional is used outside provider', () => {
      const { result } = renderHook(() => useViewModeOptional());

      expect(result.current).toBeNull();
    });
  });

  // ===========================================================================
  // updateGroupData Tests (Stubbed)
  // ===========================================================================

  describe('updateGroupData (Stubbed)', () => {
    it('should NOT update group data (feature disabled)', () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      const mockGroup = createMockSharedGroup({ id: 'group-123', name: 'Test Group' });

      act(() => {
        result.current.updateGroupData(mockGroup);
      });

      // Group should remain undefined in personal mode
      expect(result.current.group).toBeUndefined();
    });
  });

  // ===========================================================================
  // Computed Values Tests
  // ===========================================================================

  describe('Computed Values', () => {
    it('should have isGroupMode = false always', () => {
      const { result } = renderHook(() => useViewMode(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isGroupMode).toBe(false);
    });
  });

  // ===========================================================================
  // Component Integration Tests
  // ===========================================================================

  describe('Component Integration', () => {
    it('should provide context to child components', () => {
      function TestChild() {
        const { mode } = useViewMode();
        return <div data-testid="mode">{mode}</div>;
      }

      const queryClient = new QueryClient();

      render(
        <QueryClientProvider client={queryClient}>
          <ViewModeProvider>
            <TestChild />
          </ViewModeProvider>
        </QueryClientProvider>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('personal');
    });

    it('should always show personal mode even after setGroupMode attempt', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      function TestChild() {
        const { mode, setGroupMode } = useViewMode();
        const mockGroup = createMockSharedGroup();
        return (
          <div>
            <div data-testid="mode">{mode}</div>
            <button onClick={() => setGroupMode(mockGroup.id!, mockGroup)}>Switch</button>
          </div>
        );
      }

      const queryClient = new QueryClient();

      render(
        <QueryClientProvider client={queryClient}>
          <ViewModeProvider>
            <TestChild />
          </ViewModeProvider>
        </QueryClientProvider>
      );

      expect(screen.getByTestId('mode')).toHaveTextContent('personal');

      act(() => {
        screen.getByText('Switch').click();
      });

      // Should still be personal (setGroupMode is stubbed)
      expect(screen.getByTestId('mode')).toHaveTextContent('personal');

      consoleSpy.mockRestore();
    });
  });
});
