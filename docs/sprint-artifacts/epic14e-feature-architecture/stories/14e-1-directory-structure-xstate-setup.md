# Story 14e-1: Directory Structure & Zustand Setup

**Epic:** 14e - Feature-Based Architecture
**Points:** 2
**Status:** ready-for-dev
**Created:** 2026-01-24
**Updated:** 2026-01-24 (ADR-018: Zustand-only, XState removed)

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
│   ├── credit/
│   │   └── index.ts
│   └── transactions/
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
- [ ] `src/features/` directory exists with subdirectories:
  - [ ] `src/features/scan/index.ts`
  - [ ] `src/features/batch-review/index.ts`
  - [ ] `src/features/categories/index.ts`
  - [ ] `src/features/credit/index.ts`
  - [ ] `src/features/transactions/index.ts`

### AC2: Manager Directory Created

**Given** the target architecture uses Modal Manager
**When** this story is completed
**Then:**
- [ ] `src/managers/ModalManager/index.ts` exists

### AC3: Shared Directory Created

**Given** features need shared utilities
**When** this story is completed
**Then:**
- [ ] `src/shared/` directory exists with subdirectories:
  - [ ] `src/shared/components/index.ts`
  - [ ] `src/shared/hooks/index.ts`
  - [ ] `src/shared/utils/index.ts`
  - [ ] `src/shared/types/index.ts`

### AC4: App Shell Directory Created

**Given** Part 5 will extract App.tsx to app shell
**When** this story is completed
**Then:**
- [ ] `src/app/index.ts` exists

### AC5: Zustand Dependency Installed

**Given** Zustand is required for all client state stores
**When** this story is completed
**Then:**
- [ ] `zustand@^5` is installed in dependencies
- [ ] TypeScript types work correctly
- [ ] Import `{ create }` from 'zustand' compiles
- [ ] Import `{ devtools }` from 'zustand/middleware' compiles

### AC6: Build Succeeds

**Given** new directories and dependencies added
**When** running `npm run build`
**Then:**
- [ ] Build completes without errors
- [ ] No TypeScript errors related to new structure
- [ ] All existing tests pass

---

## Technical Implementation

### Step 1: Install Dependencies

```bash
npm install zustand
```

### Step 2: Create Directory Structure

```bash
# Features
mkdir -p src/features/scan
mkdir -p src/features/batch-review
mkdir -p src/features/categories
mkdir -p src/features/credit
mkdir -p src/features/transactions

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

### Step 3: Create Placeholder Index Files

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
// src/features/transactions/index.ts
// Feature: Transactions
// This module will organize transaction hooks and utilities
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

### Step 4: Verify Zustand Works

Create a simple test file to verify Zustand imports work:

```typescript
// src/managers/ModalManager/__tests__/zustand-verify.test.ts
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
| `src/features/transactions/index.ts` | Transactions feature entry point |
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
| `package.json` | Add zustand dependency |

---

## Definition of Done

- [ ] All directories created as specified
- [ ] All placeholder index.ts files created
- [ ] `npm install` completes successfully with Zustand
- [ ] `npm run build` succeeds
- [ ] `npm run test` passes (including verification test)
- [ ] `npm run lint` passes
- [ ] No changes to existing functionality
- [ ] Story marked as done in sprint-status.yaml

---

## Notes

- This is a **foundation story** - no business logic changes
- All index.ts files are empty placeholders
- Existing code remains unchanged
- Build must work exactly as before
- Test verifies Zustand is correctly configured
- **XState intentionally NOT installed** per ADR-018

---

## Dependencies

- **Depends on:** 14e-0 (Delete Bridge Dead Code)
- **Blocks:** 14e-2 (Modal Manager Zustand Store)
