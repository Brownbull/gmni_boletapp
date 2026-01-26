# Story 14e-19: Transaction Entity Foundation

Status: ready-for-dev

<!-- Created by atlas-create-story workflow 2026-01-25 -->
<!-- Atlas Analysis: 6 workflow impacts detected (all INDIRECT - re-organization story) -->

## Story

As a **developer**,
I want **transaction management organized as an entity module**,
So that **domain objects are clearly separated from features per FSD, and transaction-related code is centralized with a clean public API**.

## Context

Transaction is a **domain object** (entity) used by multiple features:
- `scan` feature → creates transactions
- `batch-review` feature → creates transactions
- `categories` feature → categorizes transactions
- `analytics` feature → aggregates transactions
- `history` feature → displays transactions

Placing it in `entities/` prevents circular dependencies and clarifies that Transaction is shared data, not a business capability. This follows Feature-Sliced Design (FSD) architecture principles established in Epic 14e.

## Acceptance Criteria

### Core Entity Organization (from Epic 14e epics.md)

1. **AC1**: `src/entities/transaction/` directory structure complete with:
   - `index.ts` (public API barrel export)
   - `types.ts` (re-exports from `src/types/transaction.ts`)
   - `hooks/useTransactions.ts` (re-exported)
   - `hooks/useTransactionFilters.ts` (if exists, or stub)
   - `utils/transactionHelpers.ts` (type guards and helpers)

2. **AC2**: All transaction types centralized and re-exported:
   - `Transaction`, `TransactionItem` types
   - `CategorySource`, `MerchantSource` types
   - Type guards: `hasTransactionImages`, `hasTransactionThumbnail`, `isOwnTransaction`

3. **AC3**: Transaction hooks re-exported from entity:
   - `useTransactions` (main subscription hook)
   - `usePaginatedTransactions` (paginated version)
   - `useActiveTransaction` (single transaction)
   - `useAnalyticsTransactions` (for analytics)

4. **AC4**: Features import from `@entities/transaction`:
   - Path alias `@entities/*` configured in tsconfig.json
   - Entity exports work correctly via alias

5. **AC5**: No breaking changes to existing consumers:
   - Original import paths continue working
   - All existing tests pass without modification

### Atlas Workflow Protection (from workflow chain analysis)

6. **AC6**: Scan Receipt Flow unchanged - transaction creation and save work identically
7. **AC7**: Batch Processing Flow unchanged - batch transaction creation works identically
8. **AC8**: Analytics Navigation unchanged - `useAnalyticsTransactions` works via re-export
9. **AC9**: History Filter Flow unchanged - `useTransactions` works via re-export
10. **AC10**: All 5,700+ tests pass - no regressions in any workflow

## Tasks / Subtasks

- [ ] **Task 1: Update Entity Directory Structure** (AC: #1)
  - [ ] 1.1: Update `src/entities/transaction/index.ts` from stub to proper barrel export
  - [ ] 1.2: Create `src/entities/transaction/types.ts` with re-exports
  - [ ] 1.3: Create `src/entities/transaction/hooks/` directory
  - [ ] 1.4: Create `src/entities/transaction/utils/` directory
  - [ ] 1.5: Verify path alias `@entities/transaction` works (already configured in 14e-1)

- [ ] **Task 2: Centralize Transaction Types** (AC: #2)
  - [ ] 2.1: Create `src/entities/transaction/types.ts`
  - [ ] 2.2: Re-export all types from `src/types/transaction.ts`:
    - `Transaction`, `TransactionItem`
    - `CategorySource`, `MerchantSource`
    - `StoreCategory`, `ItemCategory` (from unified schema)
  - [ ] 2.3: Re-export type guards:
    - `hasTransactionImages`
    - `hasTransactionThumbnail`
    - `isOwnTransaction`
  - [ ] 2.4: Export from entity `index.ts`

- [ ] **Task 3: Centralize Transaction Hooks** (AC: #3, #4)
  - [ ] 3.1: Create `src/entities/transaction/hooks/index.ts`
  - [ ] 3.2: Re-export `useTransactions` from `src/hooks/useTransactions.ts`
  - [ ] 3.3: Re-export `usePaginatedTransactions` from `src/hooks/usePaginatedTransactions.ts`
  - [ ] 3.4: Re-export `useActiveTransaction` from `src/hooks/useActiveTransaction.ts`
  - [ ] 3.5: Re-export `useAnalyticsTransactions` from `src/hooks/useAnalyticsTransactions.ts`
  - [ ] 3.6: Export hooks from entity `index.ts`

- [ ] **Task 4: Create Transaction Utilities Module** (AC: #1)
  - [ ] 4.1: Create `src/entities/transaction/utils/index.ts`
  - [ ] 4.2: Re-export utilities from `src/utils/transactionNormalizer.ts` (if public API needed)
  - [ ] 4.3: Document which utilities are internal vs public API
  - [ ] 4.4: Export utils from entity `index.ts`

- [ ] **Task 5: Verification & Regression Testing** (AC: #5, #6-#10)
  - [ ] 5.1: Verify original import paths still work (backward compatibility)
  - [ ] 5.2: Test `@entities/transaction` imports in a feature file
  - [ ] 5.3: Run full test suite - all ~5,700+ tests pass
  - [ ] 5.4: Run build - no TypeScript errors
  - [ ] 5.5: Smoke test: scan flow creates transaction correctly
  - [ ] 5.6: Smoke test: history view displays transactions correctly

## Dev Notes

### Architecture Patterns to Follow

**Entity Module Pattern** (per Epic 14e architecture & FSD):
```
src/entities/transaction/
├── index.ts                    # Public API (barrel export)
├── types.ts                    # Re-exports from src/types/transaction.ts
├── hooks/
│   └── index.ts                # Re-exports transaction hooks
└── utils/
    └── index.ts                # Re-exports transaction utilities
```

**Re-Export Pattern** (maintains backward compatibility):
```typescript
// src/entities/transaction/types.ts
export * from '../../types/transaction';

// src/entities/transaction/hooks/index.ts
export { useTransactions } from '../../../hooks/useTransactions';
export { usePaginatedTransactions } from '../../../hooks/usePaginatedTransactions';
// etc.
```

**Why Re-Export Instead of Move:**
- Zero breaking changes for existing consumers
- Gradual migration path - new code uses `@entities/transaction`
- Existing import paths continue working indefinitely
- Future stories can migrate consumers incrementally

### Source Files to Touch

**Files to Create:**
- `src/entities/transaction/types.ts`
- `src/entities/transaction/hooks/index.ts`
- `src/entities/transaction/utils/index.ts`

**Files to Modify:**
- `src/entities/transaction/index.ts` (update from stub)

**Files to Reference (DO NOT MODIFY):**
- `src/types/transaction.ts` (source types)
- `src/hooks/useTransactions.ts` (source hook)
- `src/hooks/usePaginatedTransactions.ts` (source hook)
- `src/hooks/useActiveTransaction.ts` (source hook)
- `src/hooks/useAnalyticsTransactions.ts` (source hook)
- `src/utils/transactionNormalizer.ts` (source utility)

### Existing Transaction Code Inventory

| File | Purpose | Action |
|------|---------|--------|
| `src/types/transaction.ts` | Type definitions | Re-export |
| `src/hooks/useTransactions.ts` | Main subscription hook | Re-export |
| `src/hooks/usePaginatedTransactions.ts` | Paginated transactions | Re-export |
| `src/hooks/useActiveTransaction.ts` | Single transaction | Re-export |
| `src/hooks/useAnalyticsTransactions.ts` | Analytics aggregation | Re-export |
| `src/utils/transactionNormalizer.ts` | Data normalization | Re-export (if public) |
| `src/services/transactionQuery.ts` | Query service | Keep in services |
| `src/hooks/app/useTransactionHandlers.ts` | App handlers | Keep in app hooks |
| `src/views/TransactionEditorView.tsx` | Editor view | Keep in views |

### Testing Standards

- **No new tests required** - this is a re-organization story
- **All existing tests must pass unchanged** - confirms re-exports work correctly
- **Verification tests:** Import from `@entities/transaction` in one feature file

### Project Structure Notes

**Alignment with Epic 14e Architecture:**
- Uses `src/entities/transaction/` per architecture-decision.md
- Follows Feature-Sliced Design (FSD) entity pattern
- Transaction is an **entity** (domain object), not a **feature** (business capability)

**Dependencies:**
- Story 14e-1 MUST be complete (directory structure exists) ✅
- Path alias `@entities/*` must be configured in tsconfig.json ✅

**Future Work (NOT in this story):**
- Story 14e-20 may migrate `useTransactionHandlers` to appropriate feature
- Future stories may update consumers to use `@entities/transaction` imports

### References

- [Source: docs/sprint-artifacts/epic14e-feature-architecture/epics.md#Story-14e.19]
- [Source: docs/sprint-artifacts/epic14e-feature-architecture/architecture-decision.md#Target-Structure]
- [Source: _bmad/agents/atlas/atlas-sidecar/knowledge/08-workflow-chains.md]

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows

- **Workflow #1 (Scan Receipt Flow)**: Creates transactions - imports Transaction type
- **Workflow #3 (Batch Processing Flow)**: Creates transactions - imports Transaction type
- **Workflow #4 (Analytics Navigation)**: Reads transactions - uses `useAnalyticsTransactions`
- **Workflow #5 (Learning Flow)**: Modifies transactions - uses Transaction type
- **Workflow #6 (History Filter Flow)**: Reads transactions - uses `useTransactions`
- **Workflow #9 (Scan Lifecycle)**: Transaction save is the end goal

### Risk Assessment

**Risk Level: LOW**

This is a **re-organization story**, not a functional change:
- Types and hooks are **re-exported**, not modified
- Existing import paths continue working (no breaking changes)
- Public API surfaces through `index.ts` barrel export

### Downstream Effects to Consider

- All consumers of `src/types/transaction.ts` must continue to work via re-exports
- All consumers of transaction hooks must continue to work via re-exports
- Import paths change for **future** consumers only (use `@entities/transaction`)

### Testing Implications

- **Existing tests to verify:** All tests remain unchanged - no modifications needed
- **New scenarios:** Verify `@entities/transaction` import works in at least one file

### Workflow Chain Visualization

```
[Scan Feature] ──creates──→ [Transaction Entity] ←──reads── [Analytics Feature]
                                    ↑
[Batch Review] ──creates────────────┤
                                    │
[Categories Feature] ──categorizes──┤
                                    │
[History Feature] ──displays────────┘
```

## Story Sizing

| Metric | Value | Guideline | Status |
|--------|-------|-----------|--------|
| Tasks | 5 | ≤4 | ⚠️ At limit |
| Subtasks | 20 | ≤15 | ⚠️ Slightly over |
| Files | 4-5 | ≤8 | ✅ OK |
| Points | 3 | - | MEDIUM |

**Note:** Story is at the upper limit but acceptable because:
- Tasks are simple re-exports (low complexity each)
- No functional changes (low risk)
- No new tests needed (verification only)

## Dev Agent Record

### Agent Model Used

<!-- Filled by dev agent -->

### Debug Log References

<!-- Filled by dev agent -->

### Completion Notes List

<!-- Filled by dev agent -->

### File List

<!-- Filled by dev agent -->
