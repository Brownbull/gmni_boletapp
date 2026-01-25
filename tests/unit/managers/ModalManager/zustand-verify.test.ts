/**
 * Story 14e-1: Zustand Setup Verification
 *
 * This test file verifies that Zustand is correctly installed and configured.
 * It tests both basic store creation and devtools middleware integration.
 */
import { describe, it, expect } from 'vitest';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

describe('Zustand Setup Verification', () => {
  it('should create a simple store', () => {
    interface TestStore {
      count: number;
      increment: () => void;
    }

    const useTestStore = create<TestStore>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));

    expect(useTestStore.getState().count).toBe(0);
    useTestStore.getState().increment();
    expect(useTestStore.getState().count).toBe(1);
  });

  it('should work with devtools middleware', () => {
    interface DevStore {
      value: string;
      setValue: (newValue: string) => void;
    }

    const useDevStore = create<DevStore>()(
      devtools(
        (set) => ({
          value: 'test',
          setValue: (newValue: string) => set({ value: newValue }),
        }),
        { name: 'test-store' }
      )
    );

    expect(useDevStore.getState().value).toBe('test');
    useDevStore.getState().setValue('updated');
    expect(useDevStore.getState().value).toBe('updated');
  });

  it('should support subscriptions', () => {
    interface SubscriptionStore {
      data: string;
      setData: (newData: string) => void;
    }

    const useSubscriptionStore = create<SubscriptionStore>((set) => ({
      data: 'initial',
      setData: (newData: string) => set({ data: newData }),
    }));

    let callCount = 0;
    const unsubscribe = useSubscriptionStore.subscribe(() => {
      callCount++;
    });

    expect(callCount).toBe(0);
    useSubscriptionStore.getState().setData('updated');
    expect(callCount).toBe(1);
    expect(useSubscriptionStore.getState().data).toBe('updated');

    unsubscribe();
    useSubscriptionStore.getState().setData('final');
    expect(callCount).toBe(1); // No additional calls after unsubscribe
  });

  it('should support selectors for partial state access', () => {
    interface SelectorStore {
      user: {
        name: string;
        age: number;
      };
      updateName: (name: string) => void;
    }

    const useSelectorStore = create<SelectorStore>((set) => ({
      user: {
        name: 'John',
        age: 25,
      },
      updateName: (name: string) =>
        set((state) => ({
          user: { ...state.user, name },
        })),
    }));

    // Test selector pattern
    const selectUserName = (state: SelectorStore) => state.user.name;
    const selectUserAge = (state: SelectorStore) => state.user.age;

    expect(selectUserName(useSelectorStore.getState())).toBe('John');
    expect(selectUserAge(useSelectorStore.getState())).toBe(25);

    useSelectorStore.getState().updateName('Jane');
    expect(selectUserName(useSelectorStore.getState())).toBe('Jane');
    expect(selectUserAge(useSelectorStore.getState())).toBe(25); // Unchanged
  });
});
