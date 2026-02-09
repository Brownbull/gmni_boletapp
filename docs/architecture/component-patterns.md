# React Component Patterns

> **Source:** Atlas Migration 2026-02-05
> **Context:** React patterns extracted from Epic 14d-v2 and 14e lessons learned

---

## Core Rules

| Pattern | Rule |
|---------|------|
| Hooks before early returns | ALL hooks called before `if (!user) return null` |
| Pure utility extraction | Extract pure functions FIRST, enables testing |
| Dependency injection | Pass validators/services as params for testability |
| Composition hook ownership | `useViewData()` owns data, `useViewProps()` receives data |
| Context provider timing | Hooks execute BEFORE context providers render |

---

## Hooks Before Early Returns

React hooks must always be called in the same order. Never place hooks after conditional returns:

```typescript
// BAD: Hook after early return violates Rules of Hooks
function MyComponent({ user }: Props) {
  if (!user) return <LoginPrompt />;
  const [data, setData] = useState(null); // VIOLATION
  // ...
}

// GOOD: All hooks before any returns
function MyComponent({ user }: Props) {
  const [data, setData] = useState(null);

  if (!user) return <LoginPrompt />;
  // ... use data
}
```

---

## Feature-Scoped Hook Placement (FSD)

Hooks that belong to a feature module go in `src/features/{name}/hooks/`, NOT `src/hooks/`:

```
src/features/scan/
  hooks/
    useScanInitiation.ts   # Feature-scoped hook
    useScanFlow.ts
    index.ts               # Barrel export
  handlers/
  store/
  index.ts                 # Re-exports hooks, handlers, store
```

This achieves 100% architecture compliance per FSD rules.

---

## Hook Dependency Injection

Pass dependencies as parameters instead of relying on global state. This enables testing without global mocking:

```typescript
// BAD: Hook reaches for global auth
function useFeatureActions() {
  const user = useAuth(); // Hard to test
  // ...
}

// GOOD: Dependencies injected
function useFeatureActions(user: User, services: FeatureServices) {
  // Easy to test with mock user, mock services
}
```

---

## Composition Hook Pattern

Separate data ownership from data consumption:

```typescript
// useViewData owns the data (fetching, caching, transforms)
function useDashboardViewData() {
  const transactions = useTransactions();
  return { transactions, isLoading: !transactions };
}

// Component receives data, handles UI only
function DashboardView() {
  const { transactions, isLoading } = useDashboardViewData();
  if (isLoading) return <Skeleton />;
  return <Dashboard data={transactions} />;
}
```

---

## Modal Manager Pattern (Epic 14e)

| Pattern | Rule |
|---------|------|
| Incremental migration | Keep old APIs while migrating |
| Code splitting | `React.lazy()` in modal registry |
| useEffect triggers | Open modals via `useEffect`, not in event handlers |
| onClose composition | `Store.closeModal()` THEN `props.onClose()` |

---

## Optimistic UI with Rollback

Components show immediate state changes and revert on error:

```typescript
function ToggleComponent({ value, onUpdate }) {
  const [localValue, setLocalValue] = useState(value);

  const handleToggle = async () => {
    const previous = localValue;
    setLocalValue(!localValue); // Optimistic update

    try {
      await onUpdate(!localValue);
    } catch {
      setLocalValue(previous); // Rollback on error
    }
  };
}
```

---

## Real-Time Subscription Guard

Prevent setState on unmounted components in real-time listeners:

```typescript
useEffect(() => {
  let isMounted = true;

  const unsubscribe = onSnapshot(query, (snapshot) => {
    if (!isMounted) return; // Guard
    setData(snapshot.docs.map(doc => doc.data()));
  });

  return () => {
    isMounted = false;
    unsubscribe();
  };
}, [query]);
```

---

## UX Design Rules

| Pattern | Rule |
|---------|------|
| Touch targets | Minimum 44px |
| Skeleton loading | `animate-pulse` + `role="status"` |
| Mobile-first | Always-visible buttons, not hover-only |

---

## i18n Rules

| Pattern | Rule |
|---------|------|
| No hardcoded strings | Use `t('key')` always |
| Check existing keys | Search `translations.ts` before adding new keys |
| Fallback masks bugs | Verify keys exist, don't rely on fallbacks |

---

*Source: Atlas Migration 2026-02-05 - Extracted from Epic 14d-v2 and 14e retrospectives*
