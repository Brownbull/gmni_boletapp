# React + TypeScript PWA Standards: A Complete Architecture Guide

Building production-grade Progressive Web Applications with React and TypeScript requires opinionated standards across architecture, state management, forms, backend integration, testing, and performance. This guide consolidates authoritative documentation and best practices from official sources, providing a comprehensive reference for teams building modern PWAs—with specific patterns for Latin American fintech applications.

## Project architecture follows Feature-Sliced Design principles

**Feature-Sliced Design (FSD)** has emerged as the dominant architectural methodology for large-scale React applications, providing strict layer boundaries and clear module organization. The official documentation at https://feature-sliced.design/ defines seven standardized layers that enforce unidirectional dependencies.

The FSD hierarchy flows from **App** (routing, providers, global config) through **Pages** (route components), **Widgets** (composed UI blocks), **Features** (user actions with business value), **Entities** (domain objects like users and products), down to **Shared** (reusable utilities detached from business logic). Each layer can only import from layers below it, preventing circular dependencies and ensuring maintainable codebases.

The **v2.1 "pages first" approach** (2024-2025) recommends keeping non-reused code in page slices initially, only extracting to lower layers when genuine reuse emerges. Key resources include:

- Official documentation: https://feature-sliced.design/docs/get-started/overview
- GitHub organization: https://github.com/feature-sliced
- Example projects: https://github.com/feature-sliced/examples

**Bulletproof React** (https://github.com/alan2207/bulletproof-react) with **33,500+ stars** provides a complementary feature-based organization pattern. Its key principles include feature isolation (no cross-feature imports), ESLint enforcement via `import/no-restricted-paths`, and wrapping external libraries to enable flexibility. The repository now includes sample apps for Next.js App Router, Pages Router, and React + Vite configurations.

Both methodologies agree on critical best practices: **limit nesting to 3-4 folder levels**, use **kebab-case** for file naming, **avoid barrel files** (index.ts re-exports) for better Vite tree-shaking, and **colocate tests** next to source files.

## State management separates client and server concerns

The fundamental principle is **never store server data in client state libraries**. Modern React applications should split state management between **Zustand** for client state and **TanStack Query** for server state.

### Zustand for client state

Official documentation: https://zustand.docs.pmnd.rs/

Zustand provides minimal boilerplate global state with TypeScript support. The recommended pattern uses a single global store with slices:

```typescript
// Use create<State>()((set) => ...) syntax for proper TypeScript inference
const useAppStore = create<AppState>()((set) => ({
  selectedIds: [],
  filterSettings: {},
  setSelectedIds: (ids) => set({ selectedIds: ids }),
}))
```

Key patterns from the official guides include: applying middlewares only on the combined store (not individual slices), using `useShallow` for selecting multiple values to prevent re-renders, and separating state types from action types. The TypeScript guide at https://zustand.docs.pmnd.rs/guides/beginner-typescript covers advanced inference patterns.

### TanStack Query for server state

Official documentation: https://tanstack.com/query/latest

TanStack Query handles all data fetched from APIs, providing caching, background sync, and optimistic updates. The critical TypeScript pattern is using `queryOptions()` helper for type-safe, reusable query configurations:

```typescript
function groupOptions(id: number) {
  return queryOptions({
    queryKey: ['groups', id],
    queryFn: () => fetchGroups(id),
    staleTime: 5 * 1000,
  })
}
```

For **Firebase/Firestore integration**, the official TanStack Query Firebase library (https://react-query-firebase.invertase.dev/) provides hooks like `useDocumentQuery` and `useCollectionQuery` with real-time subscription support. Configure `refetchOnWindowFocus: false` when using subscriptions.

## Form handling combines React Hook Form with Zod validation

**React Hook Form** (https://react-hook-form.com) provides performant form state management with **15.8M weekly npm downloads**. Combined with **Zod** (https://zod.dev) for schema validation, this stack delivers type-safe forms with runtime validation.

The integration uses `@hookform/resolvers`:

```typescript
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  amount: z.number().positive(),
  email: z.string().email(),
})

const { register, handleSubmit } = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  mode: "onBlur",
})
```

For **financial applications**, critical patterns include:

- **Currency amounts**: Store as integers (cents) to avoid floating-point precision issues
- **Validation schemas**: Use `z.number().positive().refine(n => n.toString().split('.')[1]?.length <= 2)` for decimal precision
- **Accessibility**: Implement WCAG 3.3.4 (Error Prevention) with confirmation steps before financial submissions
- **Currency input**: Use `react-currency-input-field` (https://github.com/cchanxzy/react-currency-input-field) with Controller integration

React Hook Form's TypeScript documentation at https://react-hook-form.com/ts covers advanced typing patterns for complex forms.

## Firebase patterns emphasize security and data modeling

### Data modeling follows query-driven design

Official Firestore data modeling guide: https://firebase.google.com/docs/firestore/data-model

The core principle is **design around your queries**—structure data for read patterns, not normalized database principles. Key decisions include:

| Use Subcollections When | Use Root Collections When |
|------------------------|--------------------------|
| Data is owned by parent document | Need to query across all documents |
| No cross-parent queries needed | Using collection group queries |
| Hierarchical relationship is strong | Maximum query flexibility required |

**Denormalization is expected** in Firestore. Duplicate data to avoid joins, use composite keys for unique relationships (`userXYZ_postABC`), and avoid monotonically increasing document IDs (causes hotspotting).

### Security rules require explicit patterns

Official security rules documentation: https://firebase.google.com/docs/rules

**Never deploy with open rules**. The standard patterns include content-owner access (`request.auth.uid == userId`), role-based access via custom claims (not Firestore documents), and data validation in rules. Testing with the Firebase Emulator is mandatory: https://firebase.google.com/docs/firestore/security/test-rules-emulator

For **RBAC with custom claims** (https://firebase.google.com/docs/auth/admin/custom-claims):

```javascript
// Server-side: Set claims
await admin.auth().setCustomUserClaims(uid, { role: 'admin' });

// Security rules: Check claims
allow write: if request.auth.token.role == "admin";
```

## TypeScript enforces maximum type safety

### Strict mode configuration

Official tsconfig reference: https://www.typescriptlang.org/tsconfig/strict.html

Enable all strict flags plus additional safety options:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noImplicitOverride": true
  }
}
```

The **React TypeScript Cheatsheet** (https://github.com/typescript-cheatsheets/react) with **46,800+ stars** provides patterns for props typing, hooks, event handlers, and context. Key guidance includes using `type` for component props and `interface` for public API definitions.

### Type-safe error handling with Result types

**neverthrow** (https://github.com/supermacro/neverthrow) provides functional error handling that forces explicit error management:

```typescript
import { ok, err, Result } from 'neverthrow'

async function fetchUser(id: string): Promise<Result<User, FetchError>> {
  try {
    const data = await fetch(`/api/users/${id}`).then(r => r.json())
    return ok(data)
  } catch (e) {
    return err({ type: 'network', error: e as Error })
  }
}
```

**Branded types** prevent primitive type confusion (e.g., `UserId` vs `ProductId`):

```typescript
type Branded<T, TBrand> = T & { readonly __brand: TBrand }
type UserId = Branded<string, 'UserId'>
type ProductId = Branded<string, 'ProductId'>
```

## Testing follows the Testing Trophy methodology

### Vitest configuration for React

Official Vitest documentation: https://vitest.dev/

```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80, branches: 80, functions: 80 },
    },
  },
})
```

### React Testing Library prioritizes user behavior

Official documentation: https://testing-library.com/docs/react-testing-library/intro/

The guiding principle from Kent C. Dodds: *"The more your tests resemble the way your software is used, the more confidence they can give you."*

Query priority (highest to lowest): `getByRole` → `getByLabelText` → `getByText` → `getByTestId`. Use `getByRole` queries to encourage accessible markup. The **Testing Trophy** concept (https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) emphasizes integration tests provide the highest ROI.

For **Firebase mocking**, use `firestore-jest-mock` (https://github.com/sbatson5/firestore-jest-mock) or the Firebase Emulator with `@firebase/rules-unit-testing`.

## PWA implementation uses Workbox with vite-plugin-pwa

### Core Web Vitals targets

Official documentation: https://web.dev/articles/vitals

| Metric | Good | Measures |
|--------|------|----------|
| **LCP** | ≤ 2.5s | Loading performance |
| **INP** | ≤ 200ms | Interactivity |
| **CLS** | ≤ 0.1 | Visual stability |

Use the `web-vitals` library (https://github.com/GoogleChrome/web-vitals) to measure these metrics in production.

### Workbox caching strategies

Official Workbox documentation: https://developer.chrome.com/docs/workbox/

Select strategies based on content type:

- **Cache First**: Static assets with content hashing (CSS, JS bundles)
- **Network First**: HTML pages, API responses needing freshness
- **Stale-While-Revalidate**: Frequently updated but not critical resources

### vite-plugin-pwa configuration

Official documentation: https://vite-pwa-org.netlify.app/

```typescript
VitePWA({
  registerType: 'prompt',
  manifest: {
    name: 'My PWA App',
    short_name: 'MyApp',
    icons: [
      { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
    ]
  },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [/* strategy definitions */]
  }
})
```

The React integration guide at https://vite-pwa-org.netlify.app/frameworks/react provides the `useRegisterSW` hook for update notifications.

## Chilean fintech requires specific technical patterns

### Currency handling for CLP

Chilean Peso has **no decimal places** (ISO 4217 minor unit: 0). Store amounts as integers and format with Chilean locale:

```javascript
const formatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  minimumFractionDigits: 0
})
formatter.format(123456) // "$123.456"
```

Successful Chilean fintechs like **Fintual** (https://www.ycombinator.com/companies/fintual) and **Fintoc** (https://docs.fintoc.com/) store CLP as integers: `$1,869 CLP = amount: 1869`.

### RUT validation libraries

Chilean national ID (RUT) requires Modulo 11 validation. The most popular npm package is `@fdograph/rut-utilities` (https://www.npmjs.com/package/@fdograph/rut-utilities):

```javascript
import { validateRut, formatRut } from '@fdograph/rut-utilities'
validateRut('18585543-0') // true
formatRut('44333222-1', RutFormat.DOTS_DASH) // '44.333.222-1'
```

### Regional API integrations

Key Chilean fintech APIs for payment integration:

- **Khipu** (payment processing): https://docs.khipu.com/
- **Fintoc** (open banking): https://docs.fintoc.com/
- **Buda** (crypto exchange): https://api.buda.com/

The **devsChile** community (https://github.com/devschile) maintains Chilean developer resources including the `remoto-desde-chile` remote work guide and `guia-laboral` employment guide.

## Conclusion

This standards documentation establishes opinionated patterns for React + TypeScript PWA development. The architecture combines Feature-Sliced Design's strict layer boundaries with Bulletproof React's feature isolation. State management cleanly separates Zustand (client) from TanStack Query (server). Forms leverage React Hook Form with Zod for type-safe validation. Firebase integration emphasizes security-first patterns with custom claims for RBAC. TypeScript strict mode with Result types prevents runtime errors. Testing follows the Testing Trophy with integration test prioritization. PWA implementation through vite-plugin-pwa with Workbox delivers reliable offline experiences meeting Core Web Vitals thresholds.

For Chilean fintech applications, the additional requirements include integer-based CLP storage, RUT validation with standardized libraries, and integration with regional payment APIs like Khipu and Fintoc. These patterns reflect the technology choices of successful Y Combinator-backed Chilean startups including Fintual and Fintoc.