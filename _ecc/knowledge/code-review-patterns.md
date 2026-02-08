# Code Review Patterns

> **Source:** Atlas Migration 2026-02-05
> **Purpose:** MUST CHECK patterns for ECC code reviewers, extracted from Atlas lessons learned
> **Usage:** Loaded by `ecc-code-review` and `ecc-dev-story` workflows at Step 0

---

## MUST CHECK Patterns

### 1. Git Staging Verification

**Severity:** CRITICAL - Untracked files will NOT be committed

| Check | Command | Expected |
|-------|---------|----------|
| All CREATE files staged | `git status --porcelain \| grep "^??"` | No output |
| All MODIFY files staged | `git status --porcelain \| grep "^ M"` | No output |
| No split staging | `git status --porcelain \| grep "^MM"` | No output |
| Security rules staged | `git status --porcelain firestore.rules` | `M ` (not ` M`) |
| Story file tracked | `git status --porcelain <story-file>` | `A ` or `M ` |

**Historical frequency:** Found in 6+ stories (14d-v2-1-4c-1, 5a, 5b-1, 5b-2, 6b, 6e).

**Pattern:** Foundation stories that CREATE new files need extra staging verification. Stories extending prior story files need both old and new changes verified.

---

### 2. Input Sanitization

**Severity:** HIGH - XSS prevention

| Check | Rule |
|-------|------|
| User string inputs | Must go through `sanitizeInput()` from `@/utils/sanitize` |
| Name fields | `sanitizeInput(input.name, { maxLength: 100 })` |
| Icon fields | `sanitizeInput(input.icon, { maxLength: 10 })` |
| Service functions | ALL service functions accepting user strings must sanitize |

**Verification:**
```bash
# Audit sanitization usage in services
grep -r "sanitizeInput" src/features/*/services/
grep -r "sanitizeInput" src/services/
```

**Historical frequency:** Found in 3+ stories (14d-v2-1-4c-1, 5b-1, 6b).

---

### 3. Firestore Batch Operations

**Severity:** HIGH - Silent failure on large datasets

| Check | Rule |
|-------|------|
| `writeBatch()` usage | MUST implement 500-operation chunking |
| ALL batch operations | If one function chunks, verify ALL functions in file do too |
| Batch commit | Use `commitBatchWithRetry()` with exponential backoff |

**Pattern:**
```typescript
const BATCH_SIZE = 500;
let batch = writeBatch(db);
let opCount = 0;
for (const doc of docs) {
  batch.delete(doc.ref);
  if (++opCount >= BATCH_SIZE) {
    await batch.commit();
    batch = writeBatch(db);
    opCount = 0;
  }
}
if (opCount > 0) await batch.commit();
```

**Historical frequency:** Found in story 14d-v2-1-7b - `deleteSubcollection()` and `deletePendingInvitationsForGroup()` were missing batch handling while `clearTransactionsSharedGroupId()` had it.

---

### 4. TOCTOU Race Conditions

**Severity:** CRITICAL - Security vulnerability

| Check | Rule |
|-------|------|
| `getDoc()` then `deleteDoc()` | FLAG - must use `runTransaction()` |
| `getDoc()` then `updateDoc()` | FLAG - must use `runTransaction()` |
| Authorization + mutation | MUST be in same transaction |
| Client-side auth check | Flag for TOCTOU review |

**Pattern:**
```typescript
// REQUIRED: Wrap authorization + mutation in transaction
await runTransaction(db, async (transaction) => {
  const snap = await transaction.get(ref);
  if (snap.data()?.ownerId !== requesterId) {
    throw new Error('Unauthorized');
  }
  transaction.delete(ref); // Same transaction = atomic
});
```

**Historical frequency:** Found in 3+ stories (14d-v2-1-7b deletion, 7g edit, 8b cloud function).

**Note:** Applies to ALL authorization-before-mutation functions, not just deletion. When fixed in one function, audit ALL similar functions in the same file.

---

### 5. Feature Module Exports

**Severity:** MEDIUM - FSD architecture compliance

| Check | Rule |
|-------|------|
| New types in `src/types/` | Also re-export from `src/features/*/types.ts` + `index.ts` |
| New utilities | Verify imported in `src/` (not just tests) |
| Feature barrel exports | `src/features/{name}/index.ts` must export all public API |
| Naming collisions | Check existing functions with same name before creating |

**Verification:**
```bash
# Verify type re-exports from feature modules
grep -r "TypeName" src/features/*/index.ts

# Verify utility is imported in src/ (not just tests)
grep -r "from.*newUtilFile" src/ --include="*.ts" --include="*.tsx"

# Check for naming collisions
grep -r "function functionName" src/ --include="*.ts" --include="*.tsx"
```

**Historical frequency:** Found in stories 14d-v2-1-4a (type export gap), 14d-v2-1-2b (utility not integrated).

---

## Additional Review Checks

### Defensive Timestamps
- Firestore timestamps: use `?.toDate?.()` with try/catch
- Historical: Caused production errors in Epic 14c and 14d

### Real-Time Query Limits
- All `onSnapshot` queries must have `limit()` applied
- Prevent unbounded listener costs

### i18n Completeness
- No hardcoded user-facing strings
- Search `translations.ts` for existing keys before adding new ones
- Verify keys exist; don't rely on fallbacks

### Test Mock Consistency
- When refactoring to transactions, update test mocks accordingly
- `mockGetDoc + mockUpdateDoc` -> `mockTransactionGet + mockTransactionUpdate`
- Search ALL test files for deleted module mocks after Context-to-Store migrations

### Integration Verification
- "Props exist" does NOT mean "Props are used" - check parent passes them
- Verify parent component actually passes optional props to children
- `grep -r "ComponentName" src/ --include="*.tsx" | grep -v "test"` to find usages

---

### 6. E2E Test Quality

**Severity:** HIGH - Prevents false passes and orphan data accumulation

| Check | Rule |
|-------|------|
| Pre-flight research | Component `.tsx` files read before writing E2E selectors |
| Selector priority | `data-testid` > `getByRole` > scoped locator > bare `text=` |
| No `text=Ajustes` | Use `getByRole('menuitem', { name: 'Ajustes' })` (strict mode) |
| Cleanup pattern | ALL test data wrapped in `try/finally` cleanup blocks |
| Pre-test cleanup | Delete residual E2E data before creating new test data |
| Multi-user cleanup | Bidirectional: non-owner leaves first, then owner deletes |
| Wait strategy | `element.waitFor()` for async ops, `waitForTimeout` only for settling (<1s) |
| No `networkidle` | Firebase WebSocket prevents `networkidle` from resolving |
| Optimistic updates | Poll for resolved values, don't read DOM during PENDING state |
| SPA reload | Always re-navigate via UI after `page.reload()` |
| Test data naming | `E2E` prefix + `Date.now()` suffix for cleanup targeting |
| Phantom testIds | Verify EVERY `data-testid` exists in component source before using |

**Verification:**
```bash
# Check for bare text selectors in E2E files
grep -r "text=Ajustes" tests/e2e/
# Check for long fixed timeouts
grep -rE "waitForTimeout\([3-9]\d{3}" tests/e2e/
# Check for networkidle
grep -r "networkidle" tests/e2e/
# Check for try/finally cleanup
grep -rA2 "afterEach\|afterAll\|cleanup" tests/e2e/
```

**Historical frequency:** Story 14d-v2-1-14 consumed 23 test runs (60% AVOIDABLE) due to selector guessing, missing optimistic update handling, and orphan accumulation. Enforcement implemented 2026-02-05: pre-flight checklist, pre-edit hooks, conventions rewrite, shared helpers module.

---

*Source: Atlas Migration 2026-02-05 + E2E Lessons Learned 2026-02-05*
