# State Management Standards: Zustand + TanStack Query

## Official Documentation

- **Zustand**: https://zustand.docs.pmnd.rs/
- **Zustand TypeScript Guide**: https://zustand.docs.pmnd.rs/guides/beginner-typescript
- **Zustand Slices Pattern**: https://github.com/pmndrs/zustand/blob/main/docs/guides/slices-pattern.md
- **TanStack Query**: https://tanstack.com/query/latest
- **TanStack Query Firebase**: https://react-query-firebase.invertase.dev/

## The Golden Rule

> **Server state goes in TanStack Query. Client state goes in Zustand. Never mix them.**

| Data Type | Where It Lives | Why |
|-----------|---------------|-----|
| Transactions from Firestore | TanStack Query | Server-owned, needs caching/sync |
| User profile from Firebase | TanStack Query | Server-owned |
| Analytics data | TanStack Query | Computed server-side |
| Selected transaction IDs | Zustand | UI state, ephemeral |
| Filter/sort preferences | Zustand | User preferences |
| Modal open/closed | Zustand | UI state |
| Theme (dark/light) | Zustand + localStorage | Persistent preference |
| Language setting | Zustand + localStorage | Persistent preference |

## Zustand Patterns

### Basic Store with TypeScript

```typescript
// src/shared/stores/uiStore.ts
import { create } from 'zustand'

interface UIState {
  // State
  selectedIds: string[]
  isFilterPanelOpen: boolean
  
  // Actions
  selectTransaction: (id: string) => void
  deselectTransaction: (id: string) => void
  clearSelection: () => void
  toggleFilterPanel: () => void
}

export const useUIStore = create<UIState>()((set) => ({
  // Initial state
  selectedIds: [],
  isFilterPanelOpen: false,
  
  // Actions
  selectTransaction: (id) => 
    set((state) => ({ 
      selectedIds: [...state.selectedIds, id] 
    })),
  
  deselectTransaction: (id) => 
    set((state) => ({ 
      selectedIds: state.selectedIds.filter(i => i !== id) 
    })),
  
  clearSelection: () => set({ selectedIds: [] }),
  
  toggleFilterPanel: () => 
    set((state) => ({ 
      isFilterPanelOpen: !state.isFilterPanelOpen 
    })),
}))
```

### Persisted Store (Settings)

```typescript
// src/features/settings/model/settingsStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Language = 'es' | 'en'
type Currency = 'CLP' | 'USD' | 'COP' | 'MXN'
type Theme = 'light' | 'dark' | 'system'

interface SettingsState {
  language: Language
  currency: Currency
  theme: Theme
  
  setLanguage: (lang: Language) => void
  setCurrency: (currency: Currency) => void
  setTheme: (theme: Theme) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      language: 'es',
      currency: 'CLP',
      theme: 'system',
      
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'gastify-settings',  // localStorage key
    }
  )
)
```

### Slices Pattern for Large Stores

```typescript
// src/shared/stores/slices/filterSlice.ts
import { StateCreator } from 'zustand'

export interface FilterSlice {
  dateRange: { start: string; end: string } | null
  categories: string[]
  merchantSearch: string
  
  setDateRange: (range: { start: string; end: string } | null) => void
  toggleCategory: (category: string) => void
  setMerchantSearch: (search: string) => void
  clearFilters: () => void
}

export const createFilterSlice: StateCreator<FilterSlice> = (set) => ({
  dateRange: null,
  categories: [],
  merchantSearch: '',
  
  setDateRange: (dateRange) => set({ dateRange }),
  
  toggleCategory: (category) => 
    set((state) => ({
      categories: state.categories.includes(category)
        ? state.categories.filter(c => c !== category)
        : [...state.categories, category]
    })),
  
  setMerchantSearch: (merchantSearch) => set({ merchantSearch }),
  
  clearFilters: () => set({
    dateRange: null,
    categories: [],
    merchantSearch: '',
  }),
})
```

### Using Shallow for Performance

```typescript
import { useShallow } from 'zustand/react/shallow'

// ❌ Bad: Re-renders on ANY store change
function Component() {
  const { selectedIds, isFilterPanelOpen } = useUIStore()
}

// ✅ Good: Only re-renders when these specific values change
function Component() {
  const { selectedIds, isFilterPanelOpen } = useUIStore(
    useShallow((state) => ({
      selectedIds: state.selectedIds,
      isFilterPanelOpen: state.isFilterPanelOpen,
    }))
  )
}
```

## TanStack Query Patterns

### Query Setup

```typescript
// src/app/providers/QueryProvider.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,  // 5 minutes
      gcTime: 1000 * 60 * 30,    // 30 minutes (was cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,  // Important for Firestore subscriptions
    },
  },
})

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

### Query Keys Factory

```typescript
// src/shared/api/queryKeys.ts
export const queryKeys = {
  // Transactions
  transactions: {
    all: ['transactions'] as const,
    lists: () => [...queryKeys.transactions.all, 'list'] as const,
    list: (userId: string, filters?: TransactionFilters) => 
      [...queryKeys.transactions.lists(), userId, filters] as const,
    detail: (id: string) => 
      [...queryKeys.transactions.all, 'detail', id] as const,
  },
  
  // User
  user: {
    all: ['user'] as const,
    profile: (userId: string) => 
      [...queryKeys.user.all, 'profile', userId] as const,
    settings: (userId: string) => 
      [...queryKeys.user.all, 'settings', userId] as const,
  },
  
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    spending: (userId: string, period: string) => 
      [...queryKeys.analytics.all, 'spending', userId, period] as const,
    categories: (userId: string) => 
      [...queryKeys.analytics.all, 'categories', userId] as const,
  },
}
```

### useQuery with Firestore

```typescript
// src/entities/transaction/model/useTransactions.ts
import { useQuery } from '@tanstack/react-query'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '@shared/api/firebase'
import { queryKeys } from '@shared/api/queryKeys'
import type { Transaction } from './types'

interface UseTransactionsOptions {
  userId: string
  enabled?: boolean
}

export function useTransactions({ userId, enabled = true }: UseTransactionsOptions) {
  return useQuery({
    queryKey: queryKeys.transactions.list(userId),
    queryFn: async (): Promise<Transaction[]> => {
      const transactionsRef = collection(
        db, 
        `artifacts/boletapp/users/${userId}/transactions`
      )
      const q = query(
        transactionsRef,
        orderBy('date', 'desc')
      )
      
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[]
    },
    enabled: enabled && !!userId,
    staleTime: 1000 * 60 * 5,  // Consider fresh for 5 min
  })
}
```

### useMutation for CRUD

```typescript
// src/entities/transaction/api/transactionApi.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addDoc, updateDoc, deleteDoc, doc, collection } from 'firebase/firestore'
import { db } from '@shared/api/firebase'
import { queryKeys } from '@shared/api/queryKeys'
import type { Transaction, CreateTransactionInput } from '../model/types'

export function useCreateTransaction(userId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: CreateTransactionInput) => {
      const transactionsRef = collection(
        db,
        `artifacts/boletapp/users/${userId}/transactions`
      )
      const docRef = await addDoc(transactionsRef, {
        ...input,
        createdAt: new Date().toISOString(),
      })
      return { id: docRef.id, ...input }
    },
    onSuccess: () => {
      // Invalidate and refetch transactions list
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.lists()
      })
    },
  })
}

export function useUpdateTransaction(userId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: Partial<Transaction> & { id: string }) => {
      const docRef = doc(
        db,
        `artifacts/boletapp/users/${userId}/transactions/${id}`
      )
      await updateDoc(docRef, {
        ...updates,
        updatedAt: new Date().toISOString(),
      })
      return { id, ...updates }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.detail(variables.id)
      })
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.lists()
      })
    },
  })
}

export function useDeleteTransaction(userId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (transactionId: string) => {
      const docRef = doc(
        db,
        `artifacts/boletapp/users/${userId}/transactions/${transactionId}`
      )
      await deleteDoc(docRef)
      return transactionId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.lists()
      })
    },
  })
}
```

### Optimistic Updates

```typescript
export function useDeleteTransaction(userId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (transactionId: string) => {
      await deleteDoc(doc(db, `.../${transactionId}`))
      return transactionId
    },
    
    // Optimistic update
    onMutate: async (transactionId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.transactions.list(userId)
      })
      
      // Snapshot previous value
      const previousTransactions = queryClient.getQueryData<Transaction[]>(
        queryKeys.transactions.list(userId)
      )
      
      // Optimistically remove from cache
      queryClient.setQueryData<Transaction[]>(
        queryKeys.transactions.list(userId),
        (old) => old?.filter(t => t.id !== transactionId)
      )
      
      // Return context for rollback
      return { previousTransactions }
    },
    
    // Rollback on error
    onError: (err, transactionId, context) => {
      queryClient.setQueryData(
        queryKeys.transactions.list(userId),
        context?.previousTransactions
      )
    },
    
    // Always refetch after success or error
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.transactions.lists()
      })
    },
  })
}
```

### Real-time Firestore Subscriptions

```typescript
// For real-time updates, combine TanStack Query with onSnapshot
import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { onSnapshot, collection, query, orderBy } from 'firebase/firestore'

export function useTransactionsRealtime(userId: string) {
  const queryClient = useQueryClient()
  
  useEffect(() => {
    if (!userId) return
    
    const transactionsRef = collection(
      db,
      `artifacts/boletapp/users/${userId}/transactions`
    )
    const q = query(transactionsRef, orderBy('date', 'desc'))
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[]
      
      // Update the query cache directly
      queryClient.setQueryData(
        queryKeys.transactions.list(userId),
        transactions
      )
    })
    
    return () => unsubscribe()
  }, [userId, queryClient])
}
```

## Integration Pattern

```typescript
// Example: TransactionList component using both stores

import { useTransactions } from '@entities/transaction'
import { useUIStore } from '@shared/stores/uiStore'
import { useShallow } from 'zustand/react/shallow'

export function TransactionList({ userId }: { userId: string }) {
  // Server state from TanStack Query
  const { data: transactions, isLoading, error } = useTransactions({ userId })
  
  // Client state from Zustand
  const { selectedIds, selectTransaction, deselectTransaction } = useUIStore(
    useShallow((state) => ({
      selectedIds: state.selectedIds,
      selectTransaction: state.selectTransaction,
      deselectTransaction: state.deselectTransaction,
    }))
  )
  
  if (isLoading) return <LoadingSpinner />
  if (error) return <ErrorMessage error={error} />
  
  return (
    <ul>
      {transactions?.map(tx => (
        <TransactionCard
          key={tx.id}
          transaction={tx}
          isSelected={selectedIds.includes(tx.id)}
          onSelect={() => selectTransaction(tx.id)}
          onDeselect={() => deselectTransaction(tx.id)}
        />
      ))}
    </ul>
  )
}
```

## Anti-Patterns

```typescript
// ❌ DON'T: Store server data in Zustand
const useBadStore = create((set) => ({
  transactions: [],
  fetchTransactions: async () => {
    const data = await fetch('/api/transactions')
    set({ transactions: data })
  }
}))

// ❌ DON'T: Duplicate state between stores
const useUIStore = create((set) => ({
  currentTransaction: null,  // This duplicates TanStack Query cache!
}))

// ❌ DON'T: Use useQuery for ephemeral UI state
const { data: selectedIds } = useQuery({
  queryKey: ['selectedIds'],
  queryFn: () => [],  // This makes no sense!
})

// ✅ DO: Clear separation
// - TanStack Query for server data
// - Zustand for UI state
// - They coordinate via React components
```
