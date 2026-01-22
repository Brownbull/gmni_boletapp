# Architecture Standards: Feature-Sliced Design + Bulletproof React

## Official Documentation

- **Feature-Sliced Design**: https://feature-sliced.design/
- **FSD GitHub**: https://github.com/feature-sliced/documentation
- **Bulletproof React**: https://github.com/alan2207/bulletproof-react
- **Project Structure Guide**: https://github.com/alan2207/bulletproof-react/blob/master/docs/project-structure.md

## Gastify Directory Structure

```
src/
├── app/                          # Application layer
│   ├── providers/                # React context providers
│   │   ├── QueryProvider.tsx     # TanStack Query setup
│   │   ├── AuthProvider.tsx      # Firebase Auth context
│   │   └── index.tsx             # Combined providers
│   ├── routes/                   # Route definitions
│   │   └── index.tsx
│   └── index.tsx                 # App entry point
│
├── pages/                        # Page layer (route components)
│   ├── dashboard/
│   │   └── index.tsx             # /dashboard route
│   ├── scan/
│   │   └── index.tsx             # /scan route
│   ├── history/
│   │   └── index.tsx             # /history route
│   ├── analytics/
│   │   └── index.tsx             # /analytics route
│   └── settings/
│       └── index.tsx             # /settings route
│
├── widgets/                      # Composite UI blocks
│   ├── transaction-list/
│   │   ├── ui/
│   │   │   └── TransactionList.tsx
│   │   └── index.ts
│   ├── spending-chart/
│   │   ├── ui/
│   │   │   └── SpendingChart.tsx
│   │   └── index.ts
│   └── navigation/
│       ├── ui/
│       │   └── BottomNav.tsx
│       └── index.ts
│
├── features/                     # Business features
│   ├── scan-receipt/
│   │   ├── api/                  # Feature-specific API calls
│   │   │   └── analyzeReceipt.ts
│   │   ├── model/                # Feature state & types
│   │   │   ├── types.ts
│   │   │   └── useScanStore.ts
│   │   ├── ui/
│   │   │   ├── ScanButton.tsx
│   │   │   ├── CameraCapture.tsx
│   │   │   └── ScanResults.tsx
│   │   └── index.ts              # Public API
│   │
│   ├── edit-transaction/
│   │   ├── model/
│   │   │   ├── schema.ts         # Zod validation
│   │   │   └── types.ts
│   │   ├── ui/
│   │   │   ├── TransactionForm.tsx
│   │   │   └── ItemEditor.tsx
│   │   └── index.ts
│   │
│   └── filter-transactions/
│       ├── model/
│       │   └── useFilterStore.ts
│       ├── ui/
│       │   └── FilterPanel.tsx
│       └── index.ts
│
├── entities/                     # Domain entities
│   ├── transaction/
│   │   ├── api/
│   │   │   └── transactionApi.ts # CRUD operations
│   │   ├── model/
│   │   │   ├── types.ts          # Transaction interface
│   │   │   └── useTransactions.ts # TanStack Query hook
│   │   ├── ui/
│   │   │   └── TransactionCard.tsx
│   │   └── index.ts
│   │
│   ├── user/
│   │   ├── api/
│   │   │   └── userApi.ts
│   │   ├── model/
│   │   │   ├── types.ts
│   │   │   └── useUser.ts
│   │   └── index.ts
│   │
│   └── category/
│       ├── model/
│       │   ├── types.ts
│       │   └── constants.ts      # STORE_CATEGORIES
│       ├── ui/
│       │   └── CategoryBadge.tsx
│       └── index.ts
│
└── shared/                       # Shared utilities
    ├── api/
    │   ├── firebase.ts           # Firebase init
    │   ├── firestore.ts          # Firestore helpers
    │   └── gemini.ts             # Gemini AI client
    ├── config/
    │   ├── constants.ts
    │   └── env.ts
    ├── lib/
    │   ├── currency.ts           # CLP formatting
    │   ├── date.ts               # Date utilities
    │   ├── validation.ts         # Common validators
    │   └── result.ts             # Result type
    ├── ui/
    │   ├── Button.tsx
    │   ├── Input.tsx
    │   ├── Card.tsx
    │   ├── Modal.tsx
    │   └── charts/
    │       ├── PieChart.tsx
    │       └── BarChart.tsx
    └── types/
        └── index.ts              # Shared type utilities
```

## Layer Rules

### Import Dependencies (Unidirectional)

```
app
 ↓
pages
 ↓
widgets
 ↓
features
 ↓
entities
 ↓
shared
```

### ESLint Enforcement

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'import/no-restricted-paths': [
      'error',
      {
        zones: [
          // features cannot import from widgets, pages, or app
          { target: './src/features', from: './src/widgets' },
          { target: './src/features', from: './src/pages' },
          { target: './src/features', from: './src/app' },
          
          // entities cannot import from features or above
          { target: './src/entities', from: './src/features' },
          { target: './src/entities', from: './src/widgets' },
          
          // shared cannot import from any upper layer
          { target: './src/shared', from: './src/entities' },
          { target: './src/shared', from: './src/features' },
        ],
      },
    ],
  },
}
```

## Slice Structure

Each slice (feature, entity, widget) follows this structure:

```
feature-name/
├── api/              # API calls specific to this feature
│   └── someApi.ts
├── model/            # State, types, business logic
│   ├── types.ts      # TypeScript interfaces
│   ├── schema.ts     # Zod validation (if forms)
│   └── useStore.ts   # Zustand slice (if client state)
├── ui/               # React components
│   ├── Component.tsx
│   └── Component.test.tsx
├── lib/              # Feature-specific utilities (optional)
│   └── helpers.ts
└── index.ts          # Public API (re-exports)
```

### Public API Pattern

```typescript
// features/scan-receipt/index.ts
// Only export what other slices need

export { ScanButton } from './ui/ScanButton'
export { useScanStore } from './model/useScanStore'
export type { ScanResult } from './model/types'

// DO NOT export internal implementation details
```

## Migration Path from Current Structure

Current Gastify structure → FSD migration:

| Current | FSD Location |
|---------|--------------|
| `src/config/` | `src/shared/config/` |
| `src/types/` | `src/shared/types/` + entity-specific |
| `src/services/firestore.ts` | `src/shared/api/firestore.ts` |
| `src/services/gemini.ts` | `src/features/scan-receipt/api/` |
| `src/hooks/useAuth.ts` | `src/entities/user/model/` |
| `src/hooks/useTransactions.ts` | `src/entities/transaction/model/` |
| `src/utils/` | `src/shared/lib/` |
| `src/components/` | `src/shared/ui/` or entity ui/ |
| `src/views/DashboardView.tsx` | `src/pages/dashboard/` |
| `src/views/ScanView.tsx` | `src/pages/scan/` |
| `src/views/EditView.tsx` | `src/features/edit-transaction/ui/` |
| `src/App.tsx` | `src/app/index.tsx` |

## Best Practices

### 1. Keep Pages Thin
Pages should only compose widgets and features, not contain business logic:

```typescript
// ✅ Good: Page composes features
export function DashboardPage() {
  return (
    <Layout>
      <SpendingSummaryWidget />
      <RecentTransactionsList />
      <QuickScanButton />
    </Layout>
  )
}

// ❌ Bad: Page contains business logic
export function DashboardPage() {
  const [transactions, setTransactions] = useState([])
  useEffect(() => {
    fetchTransactions().then(setTransactions)
  }, [])
  // ... lots of logic
}
```

### 2. Colocate Tests
Tests live next to the code they test:

```
ui/
├── TransactionCard.tsx
└── TransactionCard.test.tsx
```

### 3. Avoid Barrel Files
Don't create `index.ts` files that just re-export everything. Only export the public API.

### 4. Use Absolute Imports
Configure path aliases:

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@app/*": ["src/app/*"],
      "@pages/*": ["src/pages/*"],
      "@widgets/*": ["src/widgets/*"],
      "@features/*": ["src/features/*"],
      "@entities/*": ["src/entities/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

```typescript
// Usage
import { TransactionCard } from '@entities/transaction'
import { formatCLP } from '@shared/lib/currency'
```
