# Architecture - Epic 7: Analytics UX Redesign

## Executive Summary

This architecture document defines the technical decisions for Epic 7's analytics UX redesign of Boletapp, a brownfield PWA expense tracker. The focus is on implementing dual-axis breadcrumb navigation (temporal + category), adding Quarter and Week views, and establishing chart dual mode (Aggregation vs Comparison). All decisions extend the existing React/TypeScript/Firebase stack established in Epics 1-6.

**Key Innovation:** The dual-axis navigation pattern allows users to independently filter by time (Year → Quarter → Month → Week → Day) and category (Category → Group → Subcategory) - a novel UX pattern requiring careful state management to prevent conflicts between AI agents implementing different stories.

**Critical Risk Identified (Pre-mortem):** The #1 failure mode is "State Management Chaos" - where different stories implement navigation state differently, causing breadcrumbs to show one thing while charts show another. This architecture prioritizes a **single source of truth** for all navigation state.

## Architectural Decisions Overview

### Decision Priority (Validated via Decision Matrix + Five Whys)

**CRITICAL (Must decide before any implementation):**
1. **State Management Architecture** (Score: 8.6/10) - React Context with typed navigation state
2. **Component Structure** (Score: 7.2/10) - Extract analytics components from monolithic TrendsView
3. **Breadcrumb Interaction Design** (Score: 6.7/10) - Collapsible dropdowns with clear tap targets

**IMPORTANT (Shapes implementation quality):**
4. **Date/Time Utilities** (Score: 5.2/10) - Quarter/week calculation with consistent edge-cases
5. **Chart Dual-Mode Strategy** (Score: 5.7/10) - Aggregation vs Comparison mode switching
6. **Theme System** (Score: 4.3/10) - CSS variables for Slate + Ghibli themes

**DEFERRED (Follow established patterns):**
7. **Testing Strategy** (Score: 3.6/10) - Use existing Vitest + Playwright patterns

### SWOT Analysis Summary

| Strengths | Weaknesses |
|-----------|------------|
| Solid stack (React, TS, Firebase) | Analytics state scattered in App.tsx |
| 450+ tests provide safety net | TrendsView.tsx already 400+ lines |
| Established patterns from 6 epics | No quarter/week date utilities |

| Opportunities | Threats |
|---------------|---------|
| React Context perfect for this | Over-engineering with state libraries |
| CSS variables make theming easy | Breaking existing analytics |
| Real users to validate changes | Performance regression |

### Six Thinking Hats Analysis

| Hat | Key Insight |
|-----|-------------|
| 🎩 White (Facts) | App.tsx has 6 useState calls for analytics; TrendsView receives 20+ props |
| ❤️ Red (Intuition) | Current prop-drilling feels fragile; dual-axis concept is genuinely innovative |
| ⚫ Black (Risks) | Context re-renders if not memoized; week boundary edge cases; breadcrumb UX on mobile |
| 💛 Yellow (Benefits) | Single source of truth; TypeScript catches bugs at compile time; easier testing |
| 💚 Green (Creative) | URL-based state for shareable links; navigation history for "undo" capability |
| 💙 Blue (Synthesis) | Add memoization strategy; design URL-serializable state; explicit week rules |

### Key Architectural Refinements (from Elicitation)

| Source | Insight | Action |
|--------|---------|--------|
| Six Hats (Black) | Context re-render risk | Add memoization requirements |
| Six Hats (Green) | URL sync for shareability | Design state to be URL-serializable (future-ready) |
| Journey Map | Pie slice tap targets | Minimum 44px OR drill card alternative |
| Journey Map | StackedBarChart only in comparison | Consider lazy loading |
| Devil's Advocate | Impossible states risk | Add `validateNavigationState()` function |
| Devil's Advocate | Week boundary ambiguity | Use month-aligned chunks (Oct 1-7, 8-14) not ISO weeks |
| Devil's Advocate | Big Bang refactor risk | Incremental extraction - one component per story |

### Critical Design Decisions (from Devil's Advocate)

1. **Week Definition:** Month-aligned chunks (Oct 1-7, 8-14, 15-21, 22-28, 29-31) NOT ISO weeks
   - Rationale: Matches UX mockups, aligns with user mental model of "October spending"

2. **URL State Sync:** Architecture-ready but NOT implemented in Epic 7
   - Rationale: PRD doesn't require it; keep scope tight; state shape supports future serialization

3. **Component Extraction:** Incremental, one component per story
   - Rationale: Avoid Big Bang refactor risk; each story extracts ONE thing

4. **State Validation:** Add `validateNavigationState()` to catch impossible states
   - Rationale: 5 temporal × 3 category levels = many combinations; TypeScript + runtime validation

## Project Initialization

**Not Applicable - Brownfield Project**

This is an existing production application. No starter template needed. The codebase is already established with:
- React 18.3.1 + TypeScript 5.3.3
- Vite 5.4.0 build tooling
- Firebase (Auth, Firestore, Storage)
- Tailwind CSS styling
- 450+ tests (unit, integration, E2E)
- Production deployment at https://boletapp-d609f.web.app

## Decision Summary

| # | Category | Decision | Affects FRs | Rationale |
|---|----------|----------|-------------|-----------|
| 1 | State Management | **React Context** with typed navigation state | FR5-28 | Single source of truth; no new dependencies; memoization for performance |
| 2 | Component Structure | **Full Extraction** to `components/analytics/` (incremental) | FR12-15, FR21-24, FR29-43 | Clean separation; implement one component per story to reduce risk |
| 3 | Breadcrumb UX | **Collapsible Dropdowns** with clear tap targets | FR12-15, FR21-24 | Space-efficient on mobile; matches UX spec; 44px touch targets |
| 4 | Week Calculation | **Fixed 7-day chunks** (Oct 1-7, 8-14, etc.) | FR8, FR36 | Simple; matches user mental model; last week may be shorter (29-31) |
| 5 | Chart Strategy | **Registry Pattern** for extensibility | FR29-39 | Future-ready for Sankey, Treemap, Heatmap, 3D; easy Settings toggles |
| 6 | Theme System | **CSS Variables** with data attributes | FR52-55 | Runtime switching; no new dependencies; Tailwind-compatible |

## Project Structure

```
boletapp/
├── src/
│   ├── components/
│   │   ├── analytics/           # NEW: Analytics-specific components
│   │   │   ├── TemporalBreadcrumb.tsx
│   │   │   ├── CategoryBreadcrumb.tsx
│   │   │   ├── ChartModeToggle.tsx
│   │   │   ├── DrillDownCard.tsx
│   │   │   ├── DrillDownGrid.tsx
│   │   │   └── AnalyticsHeader.tsx
│   │   ├── charts/
│   │   │   ├── SimplePieChart.tsx  # EXISTING - aggregation mode
│   │   │   ├── GroupedBarChart.tsx # EXISTING - comparison mode
│   │   │   ├── AnalyticsChart.tsx  # NEW: Chart wrapper using registry
│   │   │   └── index.ts            # NEW: Chart registry exports
│   │   ├── CategoryBadge.tsx       # EXISTING
│   │   ├── CategoryLearningPrompt.tsx # EXISTING
│   │   ├── ErrorBoundary.tsx       # EXISTING
│   │   ├── ImageViewer.tsx         # EXISTING
│   │   ├── Nav.tsx                 # EXISTING - may need minor updates
│   │   └── UpgradePromptModal.tsx  # EXISTING
│   ├── config/
│   │   ├── constants.ts            # EXISTING - add temporal constants
│   │   ├── chartRegistry.ts        # NEW: Chart type registry for extensibility
│   │   └── firebase.ts             # EXISTING
│   ├── contexts/
│   │   └── AnalyticsContext.tsx    # NEW: Centralized analytics state
│   ├── hooks/
│   │   ├── useAuth.ts              # EXISTING
│   │   ├── useTransactions.ts      # EXISTING
│   │   ├── useCategoryMappings.ts  # EXISTING
│   │   ├── useSubscriptionTier.ts  # EXISTING
│   │   └── useAnalyticsNavigation.ts # NEW: Navigation state hook
│   ├── services/
│   │   ├── firestore.ts            # EXISTING
│   │   ├── gemini.ts               # EXISTING
│   │   └── categoryMappingService.ts # EXISTING
│   ├── styles/
│   │   └── themes.css              # NEW: CSS variables for theming
│   ├── types/
│   │   ├── transaction.ts          # EXISTING
│   │   ├── settings.ts             # EXISTING
│   │   ├── categoryMapping.ts      # EXISTING
│   │   └── analytics.ts            # NEW: Analytics-specific types
│   ├── utils/
│   │   ├── validation.ts           # EXISTING
│   │   ├── currency.ts             # EXISTING
│   │   ├── date.ts                 # EXISTING - extend for weeks/quarters
│   │   ├── json.ts                 # EXISTING
│   │   ├── csv.ts                  # EXISTING
│   │   ├── csvExport.ts            # EXISTING
│   │   ├── colors.ts               # EXISTING
│   │   ├── translations.ts         # EXISTING - add new keys
│   │   ├── categoryMatcher.ts      # EXISTING
│   │   └── analyticsHelpers.ts     # NEW: Analytics computation helpers
│   ├── views/
│   │   ├── DashboardView.tsx       # EXISTING
│   │   ├── ScanView.tsx            # EXISTING
│   │   ├── EditView.tsx            # EXISTING
│   │   ├── TrendsView.tsx          # EXISTING - major refactor
│   │   ├── HistoryView.tsx         # EXISTING
│   │   ├── SettingsView.tsx        # EXISTING
│   │   └── LoginScreen.tsx         # EXISTING
│   ├── App.tsx                     # EXISTING - add AnalyticsContext
│   └── main.tsx                    # EXISTING
├── tests/
│   ├── unit/
│   │   └── analytics/              # NEW: Analytics unit tests
│   ├── integration/
│   │   └── analytics/              # NEW: Analytics integration tests
│   └── e2e/
│       └── analytics/              # NEW: Analytics E2E tests
└── docs/
    ├── architecture-epic7.md       # THIS DOCUMENT
    ├── prd-epic7.md                # PRD
    └── ux-design-specification.md  # UX Spec
```

## FR Category to Architecture Mapping

| FR Category | Components/Files | Responsibility |
|-------------|------------------|----------------|
| Bug Fixes (FR1-4) | TrendsView.tsx, Nav.tsx, translations.ts | Fix existing issues |
| Temporal Navigation (FR5-11) | AnalyticsContext, useAnalyticsNavigation, date.ts | 5-level temporal hierarchy |
| Temporal Breadcrumb (FR12-15) | TemporalBreadcrumb.tsx | Display and navigate temporal position |
| Category Navigation (FR16-20) | AnalyticsContext, useAnalyticsNavigation | 3-level category hierarchy |
| Category Breadcrumb (FR21-24) | CategoryBreadcrumb.tsx | Display and navigate category filter |
| Dual-Axis Navigation (FR25-28) | AnalyticsContext | Independent state management |
| Chart Display (FR29-39) | ChartModeToggle, SimplePieChart, StackedBarChart | Aggregation vs Comparison modes |
| Drill-Down Options (FR40-43) | DrillDownCard, DrillDownGrid | Child period/category cards |
| Empty States (FR44-46) | TrendsView.tsx | Handle no-data scenarios |
| Download/Export (FR47-51) | TrendsView.tsx, csvExport.ts | Context-aware exports |
| Visual Consistency (FR52-55) | All components | 24px icons, 8px grid, 44px touch targets |
| Internationalization (FR56-58) | translations.ts, date.ts | English/Spanish, locale formatting |

## Technology Stack Details

### Core Technologies

| Technology | Version | Purpose | Verified |
|------------|---------|---------|----------|
| React | 18.3.1 | UI Framework | Existing |
| TypeScript | 5.3.3 | Type Safety | Existing |
| Vite | 5.4.0 | Build Tool | Existing |
| Firebase | 10.14.1 | Backend (Auth, Firestore, Storage) | Existing |
| Tailwind CSS | CDN | Styling | Existing |
| Lucide React | 0.460.0 | Icons | Existing |
| Vitest | 4.0.13 | Unit/Integration Testing | Existing |
| Playwright | 1.56.1 | E2E Testing | Existing |

### Integration Points

**State Management:**
- React Context API for analytics state (AnalyticsContext)
- No additional state library needed - React's built-in hooks sufficient

**Data Flow:**
```
useTransactions (Firestore)
    → AnalyticsContext (filtering/aggregation)
    → TrendsView (display)
    → Breadcrumbs/Charts/DrillDown (child components)
```

**Theme System:**
- CSS Variables in `:root` and `[data-theme="ghibli"]`
- localStorage for preference persistence
- System preference detection for light/dark mode

## Novel Pattern: Dual-Axis Navigation Architecture

This is the key innovation of Epic 7 - a navigation system where users can independently filter by **time** and **category**.

### Navigation State Type Definitions

```typescript
// types/analytics.ts

// Temporal hierarchy levels
type TemporalLevel = 'year' | 'quarter' | 'month' | 'week' | 'day';

// Temporal position in the hierarchy
interface TemporalPosition {
  level: TemporalLevel;
  year: string;              // "2024"
  quarter?: string;          // "Q1" | "Q2" | "Q3" | "Q4"
  month?: string;            // "2024-10" (YYYY-MM format)
  week?: number;             // 1-5 (week index within month)
  day?: string;              // "2024-10-15" (YYYY-MM-DD format)
}

// Category hierarchy levels
type CategoryLevel = 'all' | 'category' | 'group' | 'subcategory';

// Category filter position
interface CategoryPosition {
  level: CategoryLevel;
  category?: string;         // "Food", "Transport", etc.
  group?: string;            // "Groceries", "Restaurants", etc.
  subcategory?: string;      // "Meats", "Produce", etc.
}

// Chart display mode
type ChartMode = 'aggregation' | 'comparison';

// Complete navigation state
interface AnalyticsNavigationState {
  temporal: TemporalPosition;
  category: CategoryPosition;
  chartMode: ChartMode;
}

// Navigation actions (for useReducer)
type NavigationAction =
  | { type: 'SET_TEMPORAL_LEVEL'; payload: TemporalPosition }
  | { type: 'SET_CATEGORY_FILTER'; payload: CategoryPosition }
  | { type: 'TOGGLE_CHART_MODE' }
  | { type: 'RESET_TO_YEAR'; payload: { year: string } }
  | { type: 'CLEAR_CATEGORY_FILTER' };
```

### State Validation Function

```typescript
// utils/analyticsHelpers.ts

function validateNavigationState(state: AnalyticsNavigationState): AnalyticsNavigationState {
  const { temporal, category } = state;

  // Validate temporal hierarchy consistency
  if (temporal.level === 'day' && !temporal.month) {
    console.warn('Invalid state: day without month, resetting to year');
    return getDefaultNavigationState(temporal.year);
  }

  if (temporal.level === 'week' && !temporal.month) {
    console.warn('Invalid state: week without month, resetting to year');
    return getDefaultNavigationState(temporal.year);
  }

  if (temporal.level === 'month' && !temporal.quarter) {
    // Auto-derive quarter from month
    const quarter = getQuarterFromMonth(temporal.month!);
    return { ...state, temporal: { ...temporal, quarter } };
  }

  // Validate category hierarchy consistency
  if (category.level === 'subcategory' && !category.group) {
    console.warn('Invalid state: subcategory without group, clearing filter');
    return { ...state, category: { level: 'all' } };
  }

  if (category.level === 'group' && !category.category) {
    console.warn('Invalid state: group without category, clearing filter');
    return { ...state, category: { level: 'all' } };
  }

  return state;
}

function getDefaultNavigationState(year: string): AnalyticsNavigationState {
  return {
    temporal: { level: 'year', year },
    category: { level: 'all' },
    chartMode: 'aggregation'
  };
}
```

### Component Boundaries (Single Responsibility)

| Component | Responsibility | Reads From Context | Writes To Context |
|-----------|----------------|-------------------|-------------------|
| **AnalyticsContext** | State storage + validation | N/A (is the context) | N/A |
| **TemporalBreadcrumb** | Display temporal path, handle dropdown | `temporal` | `SET_TEMPORAL_LEVEL` |
| **CategoryBreadcrumb** | Display category filter, handle dropdown | `category` | `SET_CATEGORY_FILTER`, `CLEAR_CATEGORY_FILTER` |
| **ChartModeToggle** | Toggle aggregation/comparison | `chartMode` | `TOGGLE_CHART_MODE` |
| **AnalyticsChart** | Render appropriate chart from registry | `chartMode`, `temporal`, `category` | None |
| **DrillDownCard** | Single tappable period/category card | None (props only) | None (callback) |
| **DrillDownGrid** | Grid layout of drill-down options | `temporal`, `category` | `SET_TEMPORAL_LEVEL` or `SET_CATEGORY_FILTER` |
| **AnalyticsHeader** | Total amount + period display | `temporal`, `category` | None |
| **TrendsView** | Orchestration + layout only | All | None (delegates to children) |

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           App.tsx                                        │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    AnalyticsContext.Provider                     │    │
│  │  ┌─────────────────────────────────────────────────────────┐    │    │
│  │  │                     TrendsView                           │    │    │
│  │  │                                                          │    │    │
│  │  │  ┌──────────────────┐  ┌──────────────────┐             │    │    │
│  │  │  │TemporalBreadcrumb│  │CategoryBreadcrumb│             │    │    │
│  │  │  └────────┬─────────┘  └────────┬─────────┘             │    │    │
│  │  │           │ dispatch()          │ dispatch()            │    │    │
│  │  │           ▼                     ▼                       │    │    │
│  │  │  ┌────────────────────────────────────────┐             │    │    │
│  │  │  │         AnalyticsContext (state)        │◄───────────┤    │    │
│  │  │  └────────────────────────────────────────┘             │    │    │
│  │  │           │ temporal, category, chartMode               │    │    │
│  │  │           ▼                                             │    │    │
│  │  │  ┌──────────────────┐  ┌──────────────────┐             │    │    │
│  │  │  │  AnalyticsChart  │  │  ChartModeToggle │             │    │    │
│  │  │  └──────────────────┘  └──────────────────┘             │    │    │
│  │  │           │                                             │    │    │
│  │  │           ▼                                             │    │    │
│  │  │  ┌──────────────────┐                                   │    │    │
│  │  │  │  DrillDownGrid   │                                   │    │    │
│  │  │  └──────────────────┘                                   │    │    │
│  │  └─────────────────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### Chart Registry Pattern

```typescript
// config/chartRegistry.ts

import { ComponentType } from 'react';
import { LucideIcon, PieChart, BarChart2, GitBranch, Grid3X3, Thermometer } from 'lucide-react';

interface ChartProps {
  data: ChartData[];
  mode: ChartMode;
  onSegmentClick?: (segment: string) => void;
}

interface ChartConfig {
  component: ComponentType<ChartProps>;
  label: { en: string; es: string };
  icon: LucideIcon;
  supportedModes: ChartMode[];
  minDataPoints?: number;
  premium?: boolean;  // For subscription tier gating
}

type ChartType = 'pie' | 'bar' | 'sankey' | 'treemap' | 'heatmap';

export const chartRegistry: Record<ChartType, ChartConfig> = {
  pie: {
    component: SimplePieChart,
    label: { en: 'Pie Chart', es: 'Gráfico Circular' },
    icon: PieChart,
    supportedModes: ['aggregation'],
  },
  bar: {
    component: GroupedBarChart,
    label: { en: 'Bar Chart', es: 'Gráfico de Barras' },
    icon: BarChart2,
    supportedModes: ['aggregation', 'comparison'],
  },
  // Future chart types (not implemented in Epic 7)
  // sankey: { component: lazy(() => import('./SankeyChart')), ... },
  // treemap: { component: lazy(() => import('./TreemapChart')), ... },
  // heatmap: { component: lazy(() => import('./HeatmapChart')), ... },
};

// Helper to get available charts for current mode
export function getChartsForMode(mode: ChartMode): ChartType[] {
  return Object.entries(chartRegistry)
    .filter(([_, config]) => config.supportedModes.includes(mode))
    .map(([type]) => type as ChartType);
}
```

## Implementation Patterns

These patterns ensure consistent implementation across all AI agents:

### Pattern 1: Context Consumer Pattern

All analytics components should consume context via the custom hook, not directly:

```typescript
// CORRECT - Use the hook
function TemporalBreadcrumb() {
  const { temporal, dispatch } = useAnalyticsNavigation();
  // ...
}

// INCORRECT - Don't use useContext directly
function TemporalBreadcrumb() {
  const context = useContext(AnalyticsContext); // NO!
  // ...
}
```

### Pattern 2: Memoized Derived State

Compute filtered/aggregated data with useMemo to prevent recalculation:

```typescript
// In AnalyticsContext or consuming component
const filteredTransactions = useMemo(() => {
  return transactions.filter(t => {
    if (!matchesTemporal(t, temporal)) return false;
    if (!matchesCategory(t, category)) return false;
    return true;
  });
}, [transactions, temporal, category]);
```

### Pattern 3: Breadcrumb Dropdown Pattern

Collapsible dropdowns should follow this structure:

```tsx
function TemporalBreadcrumb() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="min-w-11 min-h-11 ..." // 44px touch target
      >
        {/* Current value + chevron */}
      </button>
      {isOpen && (
        <div role="listbox" className="absolute ...">
          {/* Dropdown options */}
        </div>
      )}
    </div>
  );
}
```

### Pattern 4: Drill-Down Card Pattern

Cards should be pure/presentational with callbacks:

```tsx
interface DrillDownCardProps {
  label: string;
  value: number;
  onClick: () => void;
  icon?: LucideIcon;
}

const DrillDownCard = memo(function DrillDownCard({
  label,
  value,
  onClick,
  icon: Icon
}: DrillDownCardProps) {
  return (
    <button
      onClick={onClick}
      role="button"
      aria-label={`View ${label}: ${formatCurrency(value)}`}
      className="min-h-11 p-4 rounded-lg ..."
    >
      {Icon && <Icon size={24} strokeWidth={2} />}
      <span>{label}</span>
      <span>{formatCurrency(value)}</span>
    </button>
  );
});
```

## Consistency Rules

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `TemporalBreadcrumb.tsx` |
| Hooks | camelCase with `use` prefix | `useAnalyticsNavigation.ts` |
| Context | PascalCase with `Context` suffix | `AnalyticsContext.tsx` |
| Types | PascalCase | `TemporalPosition`, `ChartMode` |
| Utils | camelCase | `getWeeksInMonth()`, `validateNavigationState()` |
| Constants | SCREAMING_SNAKE_CASE | `TEMPORAL_LEVELS`, `CHART_TYPES` |
| CSS Variables | kebab-case with `--` prefix | `--color-primary`, `--spacing-md` |
| Test files | `.test.ts` or `.spec.ts` suffix | `analyticsHelpers.test.ts` |

### Code Organization

**File Structure for New Components:**
```
src/components/analytics/TemporalBreadcrumb.tsx  # Component
tests/unit/analytics/TemporalBreadcrumb.test.tsx # Unit tests
tests/integration/analytics/breadcrumb.test.tsx  # Integration tests
```

**Import Order:**
1. React imports
2. Third-party imports (lucide-react, etc.)
3. Context/hooks imports
4. Type imports
5. Utility imports
6. Relative imports (sibling components)

### Error Handling Approach

1. **Validation errors:** Log warning, return safe default (don't crash)
2. **Render errors:** Wrap in ErrorBoundary, show fallback UI
3. **User input errors:** Show inline validation message
4. **Network errors:** Use existing patterns (toast notifications)

### Logging Strategy

| Level | Use For | Example |
|-------|---------|---------|
| `console.warn` | Invalid state detected, auto-corrected | "Invalid state: week without month, resetting" |
| `console.error` | Unexpected error caught | "Chart render failed: ..." |
| No logging | Normal operations | Navigation changes, chart renders |

## Data Architecture

### Existing Data Model (Unchanged)

Epic 7 does **not** modify the Transaction data model. All data is read-only from existing Firestore collections.

```typescript
// Existing - NO CHANGES
interface Transaction {
  id?: string;
  merchant: string;
  date: string;           // "YYYY-MM-DD"
  total: number;
  category: string;       // Store category (transaction level)
  alias?: string;
  items: TransactionItem[];
  imageUrls?: string[];
  thumbnailUrl?: string;
}

interface TransactionItem {
  name: string;
  price: number;
  category?: string;      // Item group (e.g., "Groceries")
  subcategory?: string;   // Item subcategory (e.g., "Meats")
}
```

### Derived Data for Analytics

Analytics views compute derived data from transactions:

```typescript
// Computed in AnalyticsContext or helpers

interface PeriodSummary {
  label: string;          // "Q4", "October", "Oct 1-7"
  total: number;
  transactionCount: number;
}

interface CategorySummary {
  label: string;          // "Food", "Groceries", "Meats"
  total: number;
  percentage: number;     // Of current view total
  color: string;          // From getColor() utility
}

interface ChartData {
  label: string;
  value: number;
  color: string;
  segments?: ChartData[]; // For stacked/comparison charts
}
```

## API Contracts

**No new API contracts for Epic 7.**

All data comes from existing `useTransactions` hook which reads from Firestore. Navigation state is client-side only.

## Security Architecture

**No changes to security model.**

- Firestore rules unchanged (user data isolation)
- No new server endpoints
- Export respects existing subscription tier checks

## Cross-Cutting Concerns

### Performance (NFR1-NFR4)

| Concern | Solution | Target |
|---------|----------|--------|
| Context re-renders | `useMemo` for derived state; split contexts if needed | Re-render only affected components |
| Chart rendering | `React.memo` on chart components; limit visible data points | < 500ms render (NFR2) |
| View transitions | CSS transforms (GPU); minimal DOM changes | < 300ms (NFR1) |
| Layout shifts | Fixed dimensions for breadcrumbs/charts; skeleton loaders | CLS < 0.1 (NFR3) |
| Initial load | Lazy load comparison charts; code-split heavy components | TTI < 2s on 3G (NFR4) |

### Accessibility (NFR5-NFR10)

| Element | ARIA Requirements | Keyboard Support |
|---------|-------------------|------------------|
| Temporal breadcrumb | `role="navigation"`, `aria-label="Time period"` | Tab to focus, Enter to expand |
| Category breadcrumb | `role="navigation"`, `aria-label="Category filter"` | Tab to focus, Enter to expand |
| Dropdown menus | `aria-expanded`, `aria-haspopup="listbox"` | Arrow keys to navigate, Escape to close |
| Chart segments | `aria-label` with value (e.g., "Food: $500, 40%") | Tab to focus segments |
| Drill-down cards | `role="button"`, `aria-label` with period/category | Enter/Space to select |
| Mode toggle | `aria-pressed` state | Space to toggle |

**Touch Targets:** All interactive elements minimum `44x44px` (NFR10)
**Focus Indicators:** `focus-visible:ring-2 focus-visible:ring-blue-500` (NFR6)
**Color Contrast:** 4.5:1 minimum verified for both themes (NFR9)

### Internationalization (FR56-FR58)

**New translation keys required:**

```typescript
// translations.ts additions
{
  // Temporal
  year: { en: 'Year', es: 'Año' },
  quarter: { en: 'Quarter', es: 'Trimestre' },
  month: { en: 'Month', es: 'Mes' },
  week: { en: 'Week', es: 'Semana' },
  day: { en: 'Day', es: 'Día' },

  // Category
  allCategories: { en: 'All Categories', es: 'Todas las Categorías' },
  category: { en: 'Category', es: 'Categoría' },
  group: { en: 'Group', es: 'Grupo' },
  subcategory: { en: 'Subcategory', es: 'Subcategoría' },

  // Chart modes
  aggregationMode: { en: 'By Category', es: 'Por Categoría' },
  comparisonMode: { en: 'Over Time', es: 'En el Tiempo' },

  // Empty states
  noTransactionsInPeriod: { en: 'No transactions in {period}', es: 'Sin transacciones en {period}' },
  scanToAddData: { en: 'Scan a receipt to add data', es: 'Escanea un recibo para agregar datos' }
}
```

**Date Formatting:** Use `Intl.DateTimeFormat` with locale from settings
**Week Labels:** Format as "Oct 1-7" using locale-aware short month names

### Error Handling

| Scenario | Strategy | User Feedback |
|----------|----------|---------------|
| Invalid navigation state | `validateNavigationState()` resets to Year view | Silent reset, no error shown |
| Empty period/category | Show empty state component | "No transactions in Q3 2024" + CTA |
| Chart render failure | ErrorBoundary catches error | "Unable to display chart" fallback |
| Date calculation error | Return safe default, log warning | No user-facing error |
| Network offline | Use cached transactions | Existing offline support unchanged |

### Security

**No new security concerns for Epic 7:**
- Navigation state is client-side only (no server storage)
- No new API endpoints or data models
- Export functionality respects existing subscription tier checks (NFR19)
- User data isolation maintained via existing Firestore rules (NFR18)

## Deployment Architecture

**Unchanged from existing:**
- Firebase Hosting (existing)
- GitHub Actions CI/CD (existing)
- No new infrastructure required for Epic 7

## Development Environment

### Prerequisites

- Node.js 18+ (LTS)
- npm 9+
- Firebase CLI (`npm install -g firebase-tools`)
- Git

### Setup Commands

```bash
# Clone and install
git clone https://github.com/Brownbull/gmni_boletapp.git
cd boletapp
npm install

# Run development server
npm run dev

# Run tests
npm run test:all

# Deploy to production
npm run deploy
```

## Architecture Decision Records (ADRs)

### ADR-010: React Context for Analytics State Management

**Status:** Accepted
**Date:** 2025-12-05

**Context:**
Epic 7 introduces dual-axis navigation (temporal + category) requiring shared state across multiple components. The existing pattern scatters state across 6 useState calls in App.tsx with prop drilling to TrendsView (20+ props).

**Decision:**
Use React Context API with useReducer for centralized analytics navigation state.

**Alternatives Considered:**
1. **Zustand** - Simpler API, but adds dependency; team would need to learn new pattern
2. **Keep current** - Would worsen with new features; prop drilling unsustainable
3. **URL state** - Good for sharing, but adds complexity; deferred to future epic

**Consequences:**
- (+) Single source of truth prevents state sync bugs
- (+) No new dependencies
- (+) TypeScript provides compile-time safety
- (-) Must implement memoization to prevent unnecessary re-renders
- (-) Testing requires context wrapper setup

---

### ADR-011: Chart Registry Pattern for Extensibility

**Status:** Accepted
**Date:** 2025-12-05

**Context:**
Epic 7 requires chart mode toggling (aggregation vs comparison). Future roadmap includes Sankey diagrams, treemaps, heatmaps, and potentially 3D visualizations.

**Decision:**
Implement a chart registry pattern where chart components are registered with metadata (supported modes, labels, icons) and the AnalyticsChart wrapper selects the appropriate chart based on current mode.

**Alternatives Considered:**
1. **Switch/case wrapper** - Simple but not extensible; adding charts requires modifying wrapper
2. **Plugin architecture** - Over-engineered for current needs; unnecessary complexity

**Consequences:**
- (+) Adding new charts = create component + add to registry
- (+) Settings toggles (FR10) trivially implemented via registry metadata
- (+) Lazy loading ready via React.lazy() for heavy charts
- (-) Slight indirection; developers must understand registry pattern

---

### ADR-012: Month-Aligned Week Chunks

**Status:** Accepted
**Date:** 2025-12-05

**Context:**
PRD requires week-level analytics (FR8). Standard ISO weeks start on Monday and can span month boundaries (e.g., ISO Week 40 = Sep 30 - Oct 6).

**Decision:**
Use fixed 7-day chunks within each month: Oct 1-7, Oct 8-14, Oct 15-21, Oct 22-28, Oct 29-31. The last "week" may have fewer than 7 days.

**Alternatives Considered:**
1. **ISO weeks** - Standard, but confusing UX ("Week 40" means nothing to users; spans months)
2. **4 equal-ish weeks** - Some weeks would have 8+ days; inconsistent

**Consequences:**
- (+) Matches UX mockups exactly
- (+) Aligns with user mental model ("October's weeks")
- (+) Simple to implement and explain
- (-) Last week varies in length (1-7 days)
- (-) Not ISO standard (if exporting to other systems, may need conversion)

---

### ADR-013: CSS Variables for Theme System

**Status:** Accepted
**Date:** 2025-12-05

**Context:**
UX spec defines two visual themes (Slate Professional, Ghibli) each with light/dark mode variants. Need runtime switching without page reload.

**Decision:**
Use CSS custom properties (variables) with data attributes for theme switching. Tailwind classes reference variables for dynamic colors.

**Alternatives Considered:**
1. **Tailwind config themes** - Build-time only; can't switch at runtime
2. **CSS-in-JS (styled-components)** - New dependency; different pattern from existing code

**Consequences:**
- (+) Runtime theme switching via single data attribute change
- (+) Zero JS bundle impact for theme definitions
- (+) Works with existing Tailwind setup
- (+) localStorage persistence trivial
- (-) CSS variable names must be managed (potential typos)
- (-) DevTools inspection shows variables, not resolved colors

---

### ADR-014: Incremental Component Extraction

**Status:** Accepted
**Date:** 2025-12-05

**Context:**
TrendsView.tsx is ~400 lines and receives 20+ props. Full refactor needed but carries risk of breaking existing functionality.

**Decision:**
Extract components incrementally - one component per story. Order: AnalyticsContext first (foundation), then breadcrumbs, then charts, then drill-down grid.

**Alternatives Considered:**
1. **Big Bang refactor** - Single story extracts everything; high risk of regression
2. **Minimal extraction** - Only extract breadcrumbs; TrendsView stays bloated

**Consequences:**
- (+) Each story has small, reviewable scope
- (+) Can course-correct if extraction approach isn't working
- (+) Existing tests continue passing throughout
- (-) Temporary awkwardness as some components extracted, others not
- (-) Takes more stories to complete full extraction

---

_This document was generated using the BMAD Architecture Workflow._
_Date: 2025-12-05_
_For: Gabe_
