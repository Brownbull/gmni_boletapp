# State Management Patterns

> **Source:** Atlas Migration 2026-02-05
> **Context:** Zustand patterns extracted from Epic 14e feature architecture refactoring

---

## Zustand Store Structure

Follow the incremental build sequence when creating new stores:

```
Foundation (types + initial state)
  -> Actions (mutations)
    -> Selectors (derived state)
      -> Migration (legacy compatibility)
```

---

## Core Rules

| Pattern | Rule |
|---------|------|
| Store structure | Foundation -> Actions -> Selectors -> Migration |
| `useShallow` for objects | Required for combined selectors and action objects |
| `getState()` | Use for synchronous access in callbacks (not in render) |
| DEV-only devtools | `enabled: import.meta.env.DEV` |
| Phase guards | `if (phase !== expected) return null` |
| Atomic multi-store sync | Direct function object as single source of truth |
| Store extension | Add state/actions/selectors incrementally per story |
| Context-to-Store migration | Add legacy aliases first, then remove Provider |

---

## useShallow Usage

Always use `useShallow` when selecting multiple values to prevent unnecessary re-renders:

```typescript
// BAD: Creates new object reference every render
const { items, count } = useMyStore((state) => ({
  items: state.items,
  count: state.count,
}));

// GOOD: useShallow prevents re-renders when values haven't changed
import { useShallow } from 'zustand/react/shallow';

const { items, count } = useMyStore(
  useShallow((state) => ({
    items: state.items,
    count: state.count,
  }))
);
```

---

## getState() for Callbacks

Use `getState()` for synchronous access outside of React render cycle:

```typescript
// In event handlers, callbacks, or async functions
const handleExport = () => {
  const { items, filters } = useMyStore.getState();
  exportData(items, filters);
};
```

---

## DevTools Configuration

Only enable devtools in development:

```typescript
import { devtools } from 'zustand/middleware';

export const useMyStore = create<MyState>()(
  devtools(
    (set) => ({
      // ... store definition
    }),
    { enabled: import.meta.env.DEV, name: 'MyStore' }
  )
);
```

---

## Context-to-Store Migration Pattern

When migrating from React Context to Zustand:

1. Create the Zustand store with same state shape
2. Add legacy aliases that match old Context API
3. Update consumers incrementally
4. Remove the Context Provider wrapper last
5. Search for stale references: `grep -r "OldContextName" src/ --include="*.ts" --include="*.tsx"`

---

## Multi-Store Synchronization

When multiple stores need to stay in sync, use direct function references:

```typescript
// Store A exposes an action
export const useStoreA = create<StoreA>()((set) => ({
  syncData: null,
  setSyncData: (data) => set({ syncData: data }),
}));

// Store B calls Store A directly (not via subscription)
export const useStoreB = create<StoreB>()((set) => ({
  updateBoth: (data) => {
    set({ localData: data });
    useStoreA.getState().setSyncData(data); // Direct call
  },
}));
```

---

*Source: Atlas Migration 2026-02-05 - Extracted from Epic 14e retrospective and lessons learned*
