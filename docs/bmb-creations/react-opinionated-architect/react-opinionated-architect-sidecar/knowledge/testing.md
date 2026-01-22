# Testing Standards: Vitest + React Testing Library

## Official Documentation

- **Vitest**: https://vitest.dev/
- **Vitest Config**: https://vitest.dev/config/
- **React Testing Library**: https://testing-library.com/docs/react-testing-library/intro/
- **Testing Library Queries**: https://testing-library.com/docs/queries/about
- **User Event**: https://testing-library.com/docs/user-event/intro
- **Testing Trophy**: https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications
- **Firestore Emulator Testing**: https://firebase.google.com/docs/firestore/security/test-rules-emulator

## The Testing Trophy

Kent C. Dodds' Testing Trophy prioritizes tests by ROI:

```
        🏆
       /   \
      / E2E \        ← Few, expensive, high confidence
     /-------\
    /         \
   / Integration \   ← MOST tests here (best ROI)
  /---------------\
 /                 \
/       Unit        \ ← Fast, focused, pure functions
-------------------
      Static         ← TypeScript, ESLint (free!)
```

### Gastify Test Distribution

| Type | Coverage | What to Test |
|------|----------|--------------|
| **Static** | 100% | TypeScript strict mode, ESLint |
| **Unit** | Critical utils | Currency formatting, date utils, Zod schemas |
| **Integration** | Core flows | Hooks, form submissions, component interactions |
| **E2E** | Happy paths | Scan → Save → View flow |

## Setup

### Installation

```bash
npm install -D vitest @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D jsdom
npm install -D msw  # For API mocking
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        lines: 60,
        branches: 60,
        functions: 60,
        statements: 60,
      },
    },
  },
})
```

### Test Setup File

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// Cleanup after each test
afterEach(() => {
  cleanup()
})

// Mock window.matchMedia (for responsive/theme tests)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui",
    "test:watch": "vitest --watch"
  }
}
```

## Unit Tests

### Testing Pure Functions

```typescript
// src/shared/lib/currency.test.ts
import { describe, it, expect } from 'vitest'
import { formatCurrency, parseCLP } from './currency'

describe('formatCurrency', () => {
  it('formats CLP with dot separators', () => {
    expect(formatCurrency(123456, 'CLP')).toBe('$123.456')
  })

  it('formats CLP without decimals', () => {
    expect(formatCurrency(1000, 'CLP')).toBe('$1.000')
  })

  it('handles zero', () => {
    expect(formatCurrency(0, 'CLP')).toBe('$0')
  })

  it('formats large amounts', () => {
    expect(formatCurrency(1234567890, 'CLP')).toBe('$1.234.567.890')
  })
})

describe('parseCLP', () => {
  it('parses plain numbers', () => {
    expect(parseCLP('123456')).toBe(123456)
  })

  it('removes currency symbol', () => {
    expect(parseCLP('$123.456')).toBe(123456)
  })

  it('removes dot separators', () => {
    expect(parseCLP('1.234.567')).toBe(1234567)
  })

  it('returns null for invalid input', () => {
    expect(parseCLP('invalid')).toBeNull()
    expect(parseCLP('')).toBeNull()
  })

  it('returns null for negative numbers', () => {
    expect(parseCLP('-100')).toBeNull()
  })
})
```

### Testing Zod Schemas

```typescript
// src/entities/transaction/model/schema.test.ts
import { describe, it, expect } from 'vitest'
import { transactionSchema } from './schema'

describe('transactionSchema', () => {
  const validTransaction = {
    merchant: 'Líder',
    total: 45990,
    date: '2025-01-20',
    category: 'Supermercado',
  }

  it('accepts valid transaction', () => {
    const result = transactionSchema.safeParse(validTransaction)
    expect(result.success).toBe(true)
  })

  it('rejects empty merchant', () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      merchant: '',
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('Ingresa el comercio')
    }
  })

  it('rejects negative total', () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      total: -100,
    })
    expect(result.success).toBe(false)
  })

  it('rejects decimal total (CLP has no decimals)', () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      total: 45.99,
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('entero')
    }
  })

  it('rejects invalid date format', () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      date: '20-01-2025',  // Wrong format
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional items array', () => {
    const result = transactionSchema.safeParse({
      ...validTransaction,
      items: [
        { name: 'Leche', price: 1500 },
        { name: 'Pan', price: 2000 },
      ],
    })
    expect(result.success).toBe(true)
  })
})
```

### Testing Date Utilities

```typescript
// src/shared/lib/date.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { formatDateCL, formatRelativeTimeCL } from './date'

describe('formatDateCL', () => {
  it('formats date in Chilean format (DD-MM-YYYY)', () => {
    expect(formatDateCL('2025-01-20')).toBe('20-01-2025')
  })

  it('handles Date objects', () => {
    const date = new Date('2025-01-20')
    expect(formatDateCL(date)).toBe('20-01-2025')
  })
})

describe('formatRelativeTimeCL', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-20'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns "hoy" for today', () => {
    expect(formatRelativeTimeCL('2025-01-20')).toBe('hoy')
  })

  it('returns "ayer" for yesterday', () => {
    expect(formatRelativeTimeCL('2025-01-19')).toBe('ayer')
  })

  it('returns days for recent dates', () => {
    expect(formatRelativeTimeCL('2025-01-17')).toBe('hace 3 días')
  })

  it('returns weeks for older dates', () => {
    expect(formatRelativeTimeCL('2025-01-06')).toBe('hace 2 semanas')
  })
})
```

## Integration Tests

### Testing Custom Hooks

```typescript
// src/entities/transaction/model/useTransactions.test.ts
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useTransactions } from './useTransactions'

// Mock Firestore
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({
    docs: [
      {
        id: 'tx1',
        data: () => ({
          merchant: 'Líder',
          total: 45990,
          date: '2025-01-20',
          category: 'Supermercado',
        }),
      },
    ],
  }),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useTransactions', () => {
  it('fetches transactions for user', async () => {
    const { result } = renderHook(
      () => useTransactions({ userId: 'user123' }),
      { wrapper: createWrapper() }
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(result.current.data).toHaveLength(1)
    expect(result.current.data?.[0].merchant).toBe('Líder')
  })

  it('does not fetch when disabled', () => {
    const { result } = renderHook(
      () => useTransactions({ userId: 'user123', enabled: false }),
      { wrapper: createWrapper() }
    )

    expect(result.current.isFetching).toBe(false)
  })
})
```

### Testing Components with Forms

```typescript
// src/features/edit-transaction/ui/TransactionForm.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { TransactionForm } from './TransactionForm'

// Mock mutations
vi.mock('@entities/transaction', () => ({
  useCreateTransaction: () => ({
    mutateAsync: vi.fn().mockResolvedValue({ id: 'new-tx' }),
    isPending: false,
  }),
  useUpdateTransaction: () => ({
    mutateAsync: vi.fn().mockResolvedValue({}),
    isPending: false,
  }),
  transactionSchema: {
    // Use actual schema or simplified version
  },
}))

// Mock auth
vi.mock('@entities/user', () => ({
  useAuth: () => ({ user: { uid: 'user123' } }),
}))

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  )
}

describe('TransactionForm', () => {
  it('renders all form fields', () => {
    renderWithProviders(<TransactionForm onSuccess={vi.fn()} />)

    expect(screen.getByLabelText(/comercio/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/total/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/fecha/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/categoría/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionForm onSuccess={vi.fn()} />)

    // Clear any default values and submit
    await user.clear(screen.getByLabelText(/comercio/i))
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      expect(screen.getByText(/ingresa el comercio/i)).toBeInTheDocument()
    })
  })

  it('submits valid form data', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()
    renderWithProviders(<TransactionForm onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText(/comercio/i), 'Líder')
    await user.clear(screen.getByLabelText(/total/i))
    await user.type(screen.getByLabelText(/total/i), '45990')
    await user.click(screen.getByRole('button', { name: /guardar/i }))

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled()
    })
  })

  it('formats currency input correctly', async () => {
    const user = userEvent.setup()
    renderWithProviders(<TransactionForm onSuccess={vi.fn()} />)

    const totalInput = screen.getByLabelText(/total/i)
    await user.clear(totalInput)
    await user.type(totalInput, '123456')

    // Should format with thousand separators
    expect(totalInput).toHaveValue('123.456')
  })
})
```

### Testing with User Events

```typescript
// src/features/filter-transactions/ui/FilterPanel.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FilterPanel } from './FilterPanel'

describe('FilterPanel', () => {
  it('toggles category filter on click', async () => {
    const user = userEvent.setup()
    const onFilterChange = vi.fn()
    
    render(
      <FilterPanel 
        categories={['Supermercado', 'Restaurante']}
        selectedCategories={[]}
        onFilterChange={onFilterChange}
      />
    )

    await user.click(screen.getByRole('checkbox', { name: /supermercado/i }))

    expect(onFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        categories: ['Supermercado'],
      })
    )
  })

  it('clears all filters', async () => {
    const user = userEvent.setup()
    const onFilterChange = vi.fn()
    
    render(
      <FilterPanel 
        categories={['Supermercado', 'Restaurante']}
        selectedCategories={['Supermercado']}
        onFilterChange={onFilterChange}
      />
    )

    await user.click(screen.getByRole('button', { name: /limpiar filtros/i }))

    expect(onFilterChange).toHaveBeenCalledWith({
      categories: [],
      dateRange: null,
    })
  })
})
```

## Mocking Patterns

### Mock Firebase

```typescript
// src/test/mocks/firebase.ts
import { vi } from 'vitest'

export const mockFirestore = {
  collection: vi.fn(),
  doc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  getDocs: vi.fn(),
  getDoc: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  onSnapshot: vi.fn(),
}

vi.mock('firebase/firestore', () => mockFirestore)

// Helper to reset all mocks
export function resetFirestoreMocks() {
  Object.values(mockFirestore).forEach((mock) => mock.mockReset())
}

// Helper to mock query results
export function mockQueryResult(docs: any[]) {
  mockFirestore.getDocs.mockResolvedValue({
    docs: docs.map((data, index) => ({
      id: `doc-${index}`,
      data: () => data,
    })),
  })
}
```

### Mock TanStack Query

```typescript
// src/test/utils.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, RenderOptions } from '@testing-library/react'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

interface WrapperProps {
  children: React.ReactNode
}

export function createWrapper() {
  const queryClient = createTestQueryClient()
  return function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

export function renderWithProviders(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  const queryClient = createTestQueryClient()

  return {
    ...render(ui, {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
      ...options,
    }),
    queryClient,
  }
}
```

### Mock API with MSW

```typescript
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  // Mock Gemini API
  http.post('*/analyzeReceipt', () => {
    return HttpResponse.json({
      merchant: 'Líder',
      total: 45990,
      date: '2025-01-20',
      category: 'Supermercado',
      items: [
        { name: 'Leche', price: 1500 },
        { name: 'Pan', price: 2000 },
      ],
    })
  }),
]

// src/test/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

// src/test/setup.ts
import { server } from './mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## Testing Query Priority

Follow Testing Library's query priority for accessible tests:

```typescript
// ✅ Best: Accessible queries (how users interact)
screen.getByRole('button', { name: /guardar/i })
screen.getByRole('textbox', { name: /comercio/i })
screen.getByRole('checkbox', { name: /supermercado/i })
screen.getByLabelText(/total/i)

// ✅ Good: Text queries (what users see)
screen.getByText(/no hay transacciones/i)
screen.getByDisplayValue('Líder')

// ⚠️ Okay: Semantic queries
screen.getByAltText(/logo/i)
screen.getByTitle(/información/i)

// ⚠️ Last resort: Test IDs
screen.getByTestId('transaction-card')
```

## E2E Tests (Playwright)

```typescript
// e2e/scan-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Receipt Scanning Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/')
    await page.click('text=Iniciar sesión con Google')
    // Handle OAuth mock or test user
  })

  test('scans receipt and saves transaction', async ({ page }) => {
    // Navigate to scan
    await page.click('text=Escanear')
    
    // Upload test receipt image
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles('e2e/fixtures/test-receipt.jpg')
    
    // Wait for AI processing
    await expect(page.locator('text=Analizando')).toBeVisible()
    await expect(page.locator('text=Analizando')).not.toBeVisible({ timeout: 10000 })
    
    // Verify extracted data
    await expect(page.locator('input[name="merchant"]')).toHaveValue('Líder')
    
    // Save transaction
    await page.click('button:has-text("Guardar")')
    
    // Verify success
    await expect(page.locator('text=¡Guardado!')).toBeVisible()
    
    // Verify in history
    await page.click('text=Historial')
    await expect(page.locator('text=Líder')).toBeVisible()
  })
})
```

## Test File Organization

```
src/
├── shared/
│   └── lib/
│       ├── currency.ts
│       └── currency.test.ts      # Colocated unit test
├── entities/
│   └── transaction/
│       └── model/
│           ├── schema.ts
│           └── schema.test.ts    # Colocated schema test
├── features/
│   └── edit-transaction/
│       └── ui/
│           ├── TransactionForm.tsx
│           └── TransactionForm.test.tsx  # Colocated component test
└── test/
    ├── setup.ts                  # Global test setup
    ├── utils.tsx                 # Test utilities & wrappers
    └── mocks/
        ├── handlers.ts           # MSW handlers
        ├── server.ts             # MSW server
        └── firebase.ts           # Firebase mocks
```

## Best Practices Summary

| Do | Don't |
|----|-------|
| Colocate tests with source files | Put all tests in separate folder |
| Use `getByRole` and `getByLabelText` | Use `getByTestId` for everything |
| Test user behavior, not implementation | Test internal state changes |
| Use `userEvent` for interactions | Use `fireEvent` directly |
| Mock at the network boundary (MSW) | Mock internal modules excessively |
| Write integration tests for hooks | Only write unit tests |
| Test error states and edge cases | Only test happy path |
| Use fake timers for time-dependent code | Let tests depend on real time |
| Keep tests fast (< 5s each) | Write slow tests that hit real APIs |
| Run tests in CI on every PR | Only run tests locally |
