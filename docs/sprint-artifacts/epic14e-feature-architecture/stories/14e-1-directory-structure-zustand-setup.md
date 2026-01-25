# Story 14e-1: Directory Structure & Zustand Setup

**Epic:** 14e - Feature-Based Architecture
**Points:** 2
**Status:** done
**Created:** 2026-01-24
**Updated:** 2026-01-24 (Code review passed - CI config added)

---

## User Story

As a **developer**,
I want **the feature-based directory structure and Zustand dependency set up**,
So that **I have the foundation for feature extraction**.

---

## Context

### Current State

The `src/` directory has a traditional flat structure:

```
src/
├── App.tsx           # 3,387 lines - THE TARGET
├── main.tsx
├── sw.ts
├── vite-env.d.ts
├── components/       # 19 subdirectories
├── config/
├── contexts/
├── data/
├── hooks/            # Includes hooks/app/ with composition hooks
├── lib/
├── migrations/
├── services/
├── types/
├── utils/
└── views/
```

### Target State

After this story, the directory structure will support feature-based architecture:

```
src/
├── App.tsx           # Unchanged for now
├── main.tsx
├── sw.ts
├── vite-env.d.ts
├── features/         # NEW - Feature modules
│   ├── scan/
│   │   └── index.ts
│   ├── batch-review/
│   │   └── index.ts
│   ├── categories/
│   │   └── index.ts
│   └── credit/
│       └── index.ts
├── entities/         # NEW - Domain objects (FSD entities layer)
│   └── transaction/
│       └── index.ts
├── managers/         # NEW - Global managers
│   └── ModalManager/
│       └── index.ts
├── shared/           # NEW - Cross-feature utilities
│   ├── components/
│   │   └── index.ts
│   ├── hooks/
│   │   └── index.ts
│   ├── utils/
│   │   └── index.ts
│   └── types/
│       └── index.ts
├── app/              # NEW - App shell (for Part 5)
│   └── index.ts
├── components/       # Existing - will gradually migrate to features/shared
├── config/           # Existing - stays
├── contexts/         # Existing - stays
├── data/             # Existing - stays
├── hooks/            # Existing - stays (app/ hooks stay here until Part 5)
├── lib/              # Existing - stays
├── migrations/       # Existing - stays
├── services/         # Existing - stays
├── types/            # Existing - stays
├── utils/            # Existing - stays
└── views/            # Existing - stays
```

### Dependencies to Install

| Package | Version | Purpose | Size |
|---------|---------|---------|------|
| `zustand` | ^5.x | Client state management (stores) | ~1kb gzipped |

**Current Status:**
- Zustand: **NOT INSTALLED**
- @tanstack/react-query: Installed (v5.90.16) - server state (unchanged)

### ADR-018: Why Zustand Only (No XState)

Per architecture decision ADR-018, XState was rejected because:
1. Existing `useScanStateMachine` already implements state machine logic with useReducer
2. Three paradigms (Query + Zustand + XState) would be cognitive overload
3. XState adds ~18kb gzipped vs Zustand's ~1kb
4. Team has no XState experience

**State management philosophy:**
- Server state → TanStack Query
- Client state → Zustand
- Local component state → useState

---

## Acceptance Criteria

### AC1: Feature Directories Created

**Given** the current flat src/ structure
**When** this story is completed
**Then:**
- [x] `src/features/` directory exists with subdirectories:
  - [x] `src/features/scan/index.ts`
  - [x] `src/features/batch-review/index.ts`
  - [x] `src/features/categories/index.ts`
  - [x] `src/features/credit/index.ts`

### AC1.5: Entities Directory Created

**Given** transaction is a domain object used by multiple features
**When** this story is completed
**Then:**
- [x] `src/entities/` directory exists with subdirectory:
  - [x] `src/entities/transaction/index.ts`

### AC2: Manager Directory Created

**Given** the target architecture uses Modal Manager
**When** this story is completed
**Then:**
- [x] `src/managers/ModalManager/index.ts` exists

### AC3: Shared Directory Created

**Given** features need shared utilities
**When** this story is completed
**Then:**
- [x] `src/shared/` directory exists with subdirectories:
  - [x] `src/shared/components/index.ts`
  - [x] `src/shared/hooks/index.ts`
  - [x] `src/shared/utils/index.ts`
  - [x] `src/shared/types/index.ts`

### AC4: App Shell Directory Created

**Given** Part 5 will extract App.tsx to app shell
**When** this story is completed
**Then:**
- [x] `src/app/index.ts` exists

### AC5: Zustand Dependency Installed

**Given** Zustand is required for all client state stores
**When** this story is completed
**Then:**
- [x] `zustand@^5` is installed in dependencies (v5.0.10)
- [x] TypeScript types work correctly
- [x] Import `{ create }` from 'zustand' compiles
- [x] Import `{ devtools }` from 'zustand/middleware' compiles

### AC6: Path Aliases Configured

**Given** features will use clean imports like `@features/scan`, `@entities/transaction`
**When** this story is completed
**Then:**
- [x] `vite-tsconfig-paths` plugin installed (v6.0.5 in devDependencies)
- [x] `tsconfig.json` updated with `baseUrl` and `paths`:
  - `@features/*` → `src/features/*`
  - `@entities/*` → `src/entities/*`
  - `@managers/*` → `src/managers/*`
  - `@shared/*` → `src/shared/*`
  - `@app/*` → `src/app/*`
- [x] `vite.config.ts` updated to use `tsconfigPaths()` plugin
- [x] Imports like `import { X } from '@features/scan'` compile correctly

### AC7: Build Succeeds

**Given** new directories, dependencies, and path aliases added
**When** running `npm run build`
**Then:**
- [x] Build completes without errors
- [x] No TypeScript errors related to new structure
- [x] All existing tests pass (5268 passed)

---

## Technical Implementation

### Step 1: Install Dependencies

```bash
npm install zustand vite-tsconfig-paths
```

### Step 2: Create Directory Structure

```bash
# Features
mkdir -p src/features/scan
mkdir -p src/features/batch-review
mkdir -p src/features/categories
mkdir -p src/features/credit

# Entities (domain objects used by multiple features)
mkdir -p src/entities/transaction

# Managers
mkdir -p src/managers/ModalManager

# Shared
mkdir -p src/shared/components
mkdir -p src/shared/hooks
mkdir -p src/shared/utils
mkdir -p src/shared/types

# App shell
mkdir -p src/app
```

### Step 3: Configure Path Aliases

**tsconfig.json** - Add `baseUrl` and `paths`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@features/*": ["src/features/*"],
      "@entities/*": ["src/entities/*"],
      "@managers/*": ["src/managers/*"],
      "@shared/*": ["src/shared/*"],
      "@app/*": ["src/app/*"]
    },
    // ... existing options
  }
}
```

**vite.config.ts** - Add tsconfigPaths plugin:

```typescript
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),  // Add this - reads paths from tsconfig.json
    VitePWA({ /* existing config */ })
  ],
  // ... rest of config
})
```

### Step 4: Create Placeholder Index Files

Each index.ts should be a simple placeholder that exports nothing for now:

```typescript
// src/features/scan/index.ts
// Feature: Scan
// This module will contain the scan Zustand store and components
// Implemented in Story 14e-6 through 14e-11

export {};
```

```typescript
// src/features/batch-review/index.ts
// Feature: Batch Review
// This module will contain the batch review Zustand store and components
// Implemented in Story 14e-12 through 14e-16

export {};
```

```typescript
// src/features/categories/index.ts
// Feature: Categories
// This module will contain category management state and components
// Implemented in Story 14e-17

export {};
```

```typescript
// src/features/credit/index.ts
// Feature: Credit
// This module will contain credit/payment functionality
// Implemented in Story 14e-18

export {};
```

```typescript
// src/entities/transaction/index.ts
// Entity: Transaction
// Domain object used by multiple features (scan, batch-review, categories)
// Implemented in Story 14e-19

export {};
```

```typescript
// src/managers/ModalManager/index.ts
// Manager: Modal Manager
// Centralized modal state management with Zustand
// Implemented in Story 14e-2 through 14e-5

export {};
```

```typescript
// src/shared/components/index.ts
// Shared components used across multiple features
// Components migrated here as features are extracted

export {};
```

```typescript
// src/shared/hooks/index.ts
// Shared hooks used across multiple features

export {};
```

```typescript
// src/shared/utils/index.ts
// Shared utilities used across multiple features

export {};
```

```typescript
// src/shared/types/index.ts
// Shared types used across multiple features

export {};
```

```typescript
// src/app/index.ts
// App shell components
// AppProviders and FeatureOrchestrator implemented in Part 5

export {};
```

### Step 5: Verify Zustand and Path Aliases Work

Create a simple test file to verify Zustand imports work:

```typescript
// tests/unit/managers/ModalManager/zustand-verify.test.ts
import { describe, it, expect } from 'vitest';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

describe('Zustand Setup Verification', () => {
  it('should create a simple store', () => {
    const useTestStore = create<{ count: number; increment: () => void }>((set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
    }));

    expect(useTestStore.getState().count).toBe(0);
    useTestStore.getState().increment();
    expect(useTestStore.getState().count).toBe(1);
  });

  it('should work with devtools middleware', () => {
    const useDevStore = create<{ value: string }>()(
      devtools(
        (set) => ({
          value: 'test',
        }),
        { name: 'test-store' }
      )
    );

    expect(useDevStore.getState().value).toBe('test');
  });
});
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/features/scan/index.ts` | Scan feature entry point |
| `src/features/batch-review/index.ts` | Batch review feature entry point |
| `src/features/categories/index.ts` | Categories feature entry point |
| `src/features/credit/index.ts` | Credit feature entry point |
| `src/entities/transaction/index.ts` | Transaction entity entry point (domain object) |
| `src/managers/ModalManager/index.ts` | Modal manager entry point |
| `src/shared/components/index.ts` | Shared components entry |
| `src/shared/hooks/index.ts` | Shared hooks entry |
| `src/shared/utils/index.ts` | Shared utils entry |
| `src/shared/types/index.ts` | Shared types entry |
| `src/app/index.ts` | App shell entry point |
| `src/managers/ModalManager/__tests__/zustand-verify.test.ts` | Zustand verification test |

---

## Files to Modify

| File | Change |
|------|--------|
| `package.json` | Add `zustand` and `vite-tsconfig-paths` dependencies |
| `tsconfig.json` | Add `baseUrl` and `paths` for feature aliases |
| `vite.config.ts` | Add `tsconfigPaths()` plugin |

---

## Definition of Done

- [x] All directories created as specified
- [x] All placeholder index.ts files created
- [x] `npm install` completes successfully with Zustand and vite-tsconfig-paths
- [x] Path aliases configured in tsconfig.json
- [x] tsconfigPaths plugin added to vite.config.ts
- [x] `npm run build` succeeds
- [x] `npm run test` passes (including verification test - 4 tests)
- [x] `npm run lint` passes (0 errors, pre-existing warnings only)
- [x] No changes to existing functionality
- [ ] Story marked as done in sprint-status.yaml (pending review)

---

## Notes

- This is a **foundation story** - no business logic changes
- All index.ts files are empty placeholders
- Existing code remains unchanged
- Build must work exactly as before
- Test verifies Zustand is correctly configured
- **XState intentionally NOT installed** per ADR-018

---

## Dev Agent Record

### Implementation Date
2026-01-24

### Implementation Notes
- Installed `zustand@^5.0.10` as runtime dependency
- Installed `vite-tsconfig-paths@^6.0.5` as dev dependency
- Created feature-based directory structure per target architecture
- Configured path aliases in tsconfig.json with baseUrl and paths
- Added tsconfigPaths() plugin to vite.config.ts (positioned before VitePWA)
- Created placeholder index.ts files with documentation comments
- Created Zustand verification test with 4 test cases:
  - Basic store creation
  - Devtools middleware integration
  - Subscription support
  - Selector pattern support

### Test Results
- Zustand verification tests: 4 passed
- Full unit test suite: 5268 passed, 33 skipped
- Build: Successful (no TypeScript errors)
- Type check: Passed
- Security lint: 0 errors (452 pre-existing warnings)

### Debug Log
No issues encountered during implementation.

---

## File List

### Files Created
| File | Purpose |
|------|---------|
| `src/features/scan/index.ts` | Scan feature entry point |
| `src/features/batch-review/index.ts` | Batch review feature entry point |
| `src/features/categories/index.ts` | Categories feature entry point |
| `src/features/credit/index.ts` | Credit feature entry point |
| `src/entities/transaction/index.ts` | Transaction entity entry point |
| `src/managers/ModalManager/index.ts` | Modal manager entry point |
| `src/shared/components/index.ts` | Shared components entry |
| `src/shared/hooks/index.ts` | Shared hooks entry |
| `src/shared/utils/index.ts` | Shared utils entry |
| `src/shared/types/index.ts` | Shared types entry |
| `src/app/index.ts` | App shell entry point |
| `tests/unit/managers/ModalManager/zustand-verify.test.ts` | Zustand verification test |

### Files Modified
| File | Change |
|------|--------|
| `package.json` | Added `zustand` (dependencies) and `vite-tsconfig-paths` (devDependencies) |
| `tsconfig.json` | Added `baseUrl` and `paths` for feature aliases |
| `vite.config.ts` | Added `tsconfigPaths()` plugin import and usage |

### Files Added (Code Review Fixes)
| File | Change |
|------|--------|
| `tests/config/vitest.config.ci.group-managers.ts` | CI configuration for managers tests group |
| `.github/workflows/test.yml` | Added test-managers job and updated merge-coverage dependencies |

---

## Code Review Fixes

### [M-1] Tests Not Included in CI Group - FIXED
- Created `tests/config/vitest.config.ci.group-managers.ts` for managers test group
- Added `test-managers` job to `.github/workflows/test.yml`
- Updated `merge-coverage` job dependencies to include `test-managers`

### [L-1] Story Technical Implementation Reference - FIXED
- Updated test file path reference from `src/managers/ModalManager/__tests__/` to `tests/unit/managers/ModalManager/`

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2026-01-24 | Story created | SM |
| 2026-01-24 | Updated: ADR-018 Zustand-only, XState removed | SM |
| 2026-01-24 | Implementation complete | Dev Agent (Claude Opus 4.5) |
| 2026-01-24 | Atlas Code Review PASSED - CI config added for managers test group | Code Review Agent |

---

## Dependencies

- **Depends on:** 14e-0 (Delete Bridge Dead Code)
- **Blocks:** 14e-2 (Modal Manager Zustand Store)
