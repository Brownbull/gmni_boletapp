# Code Review Patterns

> **Source:** Production retrospective analysis
> **Purpose:** MUST CHECK patterns for ECC code reviewers
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
| Story file tracked | `git status --porcelain <story-file>` | `A ` or `M ` |

**Historical frequency:** High — found repeatedly across multiple stories.

**Pattern:** Foundation stories that CREATE new files need extra staging verification. Stories extending prior story files need both old and new changes verified.

---

### 2. Input Sanitization

**Severity:** HIGH - XSS prevention

| Check | Rule |
|-------|------|
| User string inputs | Must go through `<your-sanitize-fn>()` from `<your-utils-path>/sanitize` |
| Name fields | `sanitize(input.name, { maxLength: 100 })` |
| Service functions | ALL service functions accepting user strings must sanitize |

**Verification:**
```bash
# Audit sanitization usage in services
grep -r "sanitize" <src>/<features>/*/services/
grep -r "sanitize" <src>/<services>/
```

**Historical frequency:** High — found in multiple stories across service layers.

---

### 3. Database Batch Operations

**Severity:** HIGH - Silent failure on large datasets

| Check | Rule |
|-------|------|
| Batch write usage | MUST implement operation-count chunking (e.g., 500-op limit for Firestore) |
| ALL batch operations | If one function chunks, verify ALL functions in file do too |
| Batch commit | Use retry with exponential backoff |

**Pattern (Firestore example):**
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

**Historical frequency:** High — deletion functions missing batch handling while similar functions in same file had it.

---

### 4. TOCTOU Race Conditions

**Severity:** CRITICAL - Security vulnerability

| Check | Rule |
|-------|------|
| `read()` then `delete()` | FLAG - must use atomic transaction |
| `read()` then `update()` | FLAG - must use atomic transaction |
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

**Historical frequency:** High — found in deletion, update, and cloud function stories.

**Note:** Applies to ALL authorization-before-mutation functions. When fixed in one function, audit ALL similar functions in the same file.

---

### 5. Feature Module Exports

**Severity:** MEDIUM - Architecture compliance

| Check | Rule |
|-------|------|
| New types | Also re-export from feature barrel `index.ts` |
| New utilities | Verify imported in `src/` (not just tests) |
| Feature barrel exports | Feature `index.ts` must export all public API |
| Naming collisions | Check existing functions with same name before creating |

**Verification:**
```bash
# Verify type re-exports from feature modules
grep -r "TypeName" <src>/<features>/*/index.ts

# Verify utility is imported in src/ (not just tests)
grep -r "from.*newUtilFile" <src>/ --include="*.ts" --include="*.tsx"
```

**Historical frequency:** Medium — found in stories involving new types and utilities.

---

### 6. E2E Test Quality

**Severity:** HIGH - Prevents false passes and orphan data accumulation

| Check | Rule |
|-------|------|
| Pre-flight research | Component source files read before writing E2E selectors |
| Selector priority | `data-testid` > `getByRole` > scoped locator > bare `text=` |
| Cleanup pattern | ALL test data wrapped in `try/finally` cleanup blocks |
| Pre-test cleanup | Delete residual E2E data before creating new test data |
| Wait strategy | `element.waitFor()` for async ops, `waitForTimeout` only for settling (<1s) |
| Optimistic updates | Poll for resolved values, don't read DOM during PENDING state |
| Test data naming | Unique prefix + `Date.now()` suffix for cleanup targeting |
| Phantom testIds | Verify EVERY `data-testid` exists in component source before using |

**Verification:**
```bash
# Check for long fixed timeouts
grep -rE "waitForTimeout\([3-9]\d{3}" <tests>/e2e/
# Check for networkidle (Firebase WebSocket prevents resolution)
grep -r "networkidle" <tests>/e2e/
# Check for try/finally cleanup
grep -rA2 "afterEach\|afterAll\|cleanup" <tests>/e2e/
```

**Historical frequency:** High — individual stories consumed 20+ test runs due to selector guessing and orphan accumulation.

---

### 7. Database-Sourced Value Injection Prevention

**Severity:** MEDIUM - Injection via database-sourced values (e.g., CSS, HTML)

| Check | Rule |
|-------|------|
| DB-sourced values in style props | Must use `<your-validation-fn>()` |
| DB-sourced values in HTML | Must sanitize before rendering |
| Custom fallback values | Must be hardcoded strings, not user input |

**Pattern:**
```typescript
// GOOD: Validated at rendering boundary
style={{ backgroundColor: validateColor(record.color) }}

// BAD: Raw database value in CSS
style={{ backgroundColor: record.color }}
```

**Historical frequency:** Medium — found during code review across multiple components.

---

### 8. Single Source of Truth (SSoT)

**Severity:** HIGH - Prevents type drift, duplication cascades, and multi-file refactoring debt

| Check | Rule |
|-------|------|
| Type/const definitions | Each type, const array, or enum MUST be defined in exactly one file. Other files import or derive. |
| Derived types | Use `typeof arr[number]`, `keyof typeof`, `Lowercase<>`, or equivalent derivation — not manual duplication |
| Validation schemas | Validator (Zod, Set, array) must derive from the canonical type, not redefine it |
| Cross-boundary types | When types cross a build boundary (e.g., client → cloud functions), a CI sync guard script MUST exist |
| Re-exports | Barrel `index.ts` re-exports are acceptable. Duplicate `export type X =` definitions are not. |

**Signals (any triggers review):**
- Same `type X =` or `export const X =` in >1 file (excluding re-exports/barrel files)
- Validation logic (Zod schema, Set, array) that manually lists values already defined in a type
- Cloud functions or backend duplicating client-side type definitions without a sync guard
- Multiple files defining overlapping category/enum values with different counts

**Verification:**
```bash
# Find potential duplicate type definitions
grep -rn "export type\|export const\|export enum" <src>/ --include="*.ts" | sort -t: -k3 | uniq -D -f2

# Check for sync guard scripts (cross-boundary projects)
ls scripts/check-*-sync.* 2>/dev/null
```

**Historical frequency:** High — Epic 2 generated 4 TD stories from a single AllergenType triple-definition that should have been caught at story creation.

**Pattern:** When a story introduces a new type or const array, verify at review time that no other file defines the same concept. When a story touches a type already defined elsewhere, flag for consolidation.

---

### 9. Integration Seam Coverage

**Severity:** HIGH — Prevents post-deploy integration failures invisible to unit tests

**Trigger:** Story introduces or modifies a chain where data flows across integration seams:
- Cloud Function → Firestore → Client listener
- Event emitter → Event handler (mitt bus)
- Upload → Queue → Process → Deliver

NOTE: store→component and hook→store are NOT integration seams — those are standard React data flow covered by unit tests.

**Check:** For each seam crossing, verify at least ONE test exercises the handoff with data flowing through (not mocked on both sides). Tests MUST use Firestore emulator or staging fixtures — shared mocks do not count as integration coverage.

**Anti-pattern (The Mocking Trap):**
```typescript
// Test A: mocks Firestore, tests CF writes correct data
mockFirestore.set.mockResolvedValue(undefined)
expect(mockFirestore.set).toHaveBeenCalledWith({ status: 'completed', ... })

// Test B: mocks onSnapshot, tests hook calls callback
mockOnSnapshot.mockImplementation((_, callback) => callback({ data: () => mockData }))
expect(onCompleted).toHaveBeenCalledWith(mockData)

// PROBLEM: Neither test verifies that CF's write format matches hook's read format
// Neither test verifies the listener actually subscribes at the right time
```

**Required test pattern:**
```typescript
// Integration test: data flows from writer to reader
// MUST use Firestore emulator or staging fixtures — shared mocks do NOT qualify
const realDoc = { status: 'completed', result: { merchant: 'Test', ... } }
// Writer side: verify this is what gets written
// Reader side: verify this exact shape triggers the callback
// REQUIRED: verify timing — listener is subscribed BEFORE write happens
```

**Verification:**
```bash
# Check for integration tests covering async pipelines
ls tests/integration/*pipeline* tests/integration/*scan* tests/integration/*event* 2>/dev/null
# Check for mocking trap — both sides of a handoff mocked independently
grep -rn "mockOnSnapshot\|mockFirestore" tests/unit/ | head -20
```

**Historical frequency:** Critical — Epic 18 Story 18-13: 794 unit tests passed, 5 of 7 post-deploy bugs were integration seam failures.

---

## Additional Review Checks

- **Defensive timestamps:** Use optional chaining + try/catch when converting DB timestamps
- **Real-time query limits:** All live-query listeners must have a `limit()` applied (unbounded listener cost)
- **i18n completeness:** No hardcoded user-facing strings; search translation files for existing keys first
- **Test mock consistency:** When refactoring to transactions, update test mocks accordingly
- **Integration verification:** "Props exist" does NOT mean "Props are used" — verify parent passes them

---

*Source: Production retrospective analysis + E2E lessons learned*
