# Hardening Pattern Catalog

Derived from Epic 1 retrospective analysis. 6 original stories generated 14 TD stories (2.3x multiplier).
This catalog enables proactive detection during epic/story creation.

## Usage

During `ecc-create-epics-and-stories` Step 3b, the Architect agent checks each story against these patterns.
Each match is classified as:

- **BUILT-IN:** Add hardening tasks to the existing story (if <= 2 tasks / 8 subtasks)
- **SEPARATE:** Create a standalone hardening story (if threshold exceeded or cross-cutting)

---

## Pattern 1: Data Pipeline Hardening

**Trigger:** Story creates or modifies Zod schemas, seed scripts, Firestore queries, data import/export pipelines, or repository functions.

**Check each:**
- Schema consolidation -- are schemas duplicated across files? Use single source of truth.
- Seed/migration script hardening -- batch chunking (Firestore 500-op limit), error handling, retry logic.
- Credential validation -- environment variables validated at startup, not at first use.
- Validation edge cases -- malformed input, empty strings, null values, boundary values.
- Transform variants -- if schema has snake_case fields, ensure camelCase transform variant exists at the boundary.
- Test coverage -- seed scripts and data pipelines need dedicated test suites, not just integration tests.

**Threshold:**
- Schema consolidation + validation edge cases: BUILT-IN (2 tasks)
- Seed hardening + credential validation + test coverage: SEPARATE if seed script is non-trivial (> 100 LOC)

**Evidence:** TD-1-2a (schema alignment), TD-1-2b (seed hardening), TD-1-2c (credential hardening), TD-1-2d (test quality), TD-1-2e (test dedup)

---

## Pattern 2: Error Resilience

**Trigger:** Story creates new React component that renders dynamic data, or new Zustand store action that can throw.

**Check each:**
- Error boundary -- high-risk UI areas (canvas, import panel, inspector) need ErrorBoundary with recovery UI.
- Production logging -- use structured error reporting, not console.log/console.error in production paths.
- Rate limiting -- if component handles rapid user actions (drag-and-drop, rapid clicking), add throttle or max-count guard.
- Graceful degradation -- what happens when a service call fails? Show fallback UI, not blank screen.

**Threshold:**
- Error boundary wrap: BUILT-IN (1 task)
- Production logging refactor across multiple components: SEPARATE (cross-cutting)

**Evidence:** TD-1-3a (error boundary + rate limiting), TD-1-3b (production logging), TD-1-3c (test env pattern)

---

## Pattern 3: Input Sanitization

**Trigger:** Story renders user-provided strings in the DOM (component names, descriptions, labels, tags, pros/cons from YAML or Firestore). Also triggered when story processes user-uploaded files.

**Check each:**
- Display string sanitization -- call `sanitizeDisplayString()` before rendering user strings.
- ReDoS guard -- truncate input before regex processing to bound worst-case execution.
- Unicode normalization -- apply NFC normalization before pattern matching to prevent homoglyph attacks.
- URL validation -- if URLs rendered, enforce https-only (reject javascript:, data: schemes).
- File size limits -- if files accepted, enforce max size before parsing.
- Allowlist-only validation -- reject YAML/JSON with unexpected keys.

**Threshold:**
- Single-component sanitization: BUILT-IN (1-2 subtasks per component)
- Sanitizer utility creation or major enhancement: SEPARATE

**Evidence:** TD-1-4a (batch sanitization + bidirectional compatibility), TD-1-4b (ReDoS + Unicode normalization)

---

## Pattern 4: E2E and Test Infrastructure

**Trigger:** Story creates UI components that are part of core user flows (authentication, canvas, toolbox, inspector, dashboard, import/export).

**Check each:**
- data-testid attributes on all interactive elements and key display elements.
- E2E wait strategy -- use element.waitFor() for state changes, not waitForTimeout.
- Screenshot persistence -- save screenshots at key steps for visual regression.
- Test fixture patterns -- if new mock patterns or test helpers needed for this component type.
- Test environment patterns -- if tests need special env setup (Firebase emulator config, auth mocking).

**Threshold:**
- data-testid + basic E2E assertions: BUILT-IN to user story (add as a task)
- New test infrastructure (fixture files, env patterns, test utilities): SEPARATE

**Evidence:** TD-1-5a (E2E wait improvements, display names, selector optimization), TD-1-3c (test env pattern)

---

## Pattern 5: Pure Component Patterns

**Trigger:** Story creates a component that receives data via props where the data can be null, undefined, empty array, or have missing variants.

**Check each:**
- Empty state handling -- what renders when the component receives no data?
- Null variant handling -- what happens when activeVariantId points to a non-existent variant?
- Loading state -- does the component need a skeleton/loading state while data fetches?
- Container/presentational split -- should the component be split into store-connected container and pure presentational?
- Optional prop defaults -- are all optional props handled with sensible defaults?

**Threshold:**
- Edge case handling: BUILT-IN (1-2 subtasks per component)
- Component restructuring (container/presentational split): SEPARATE only if multiple files involved

**Evidence:** TD-1-6a (empty variant edge case, pure component pattern for ComponentSwapper)

---

## Pattern 6: Cross-Store Coupling

**Trigger:** Story creates a Zustand store action that reads or writes to a different store's state.

**Check each:**
- Document the coupling with code comments explaining why.
- Assess direction -- is it one-way (acceptable) or bidirectional (risky)?
- Consider event-based decoupling if coupling is bidirectional or likely to grow.
- Add integration tests for cross-store interactions.

**Threshold:**
- One-way coupling documentation: BUILT-IN (1 subtask)
- Bidirectional decoupling refactor: SEPARATE if multiple stores are tightly coupled

**Evidence:** TD-1-3a finding #3 (architectureStore reading uiStore state directly)

---

## Cross-Cutting Concerns (Step 4 Analysis)

These are checked across all epics after per-epic story generation:

1. **Schema evolution** -- do later epics modify schemas created in earlier epics? Flag migration story.
2. **Shared infrastructure** -- do multiple epics need the same test fixtures, mock patterns, or utility functions?
3. **Performance accumulation** -- does the combined feature set create bottleneck points not visible at the story level?
4. **Security surface growth** -- does the cumulative attack surface require additional defense stories?
5. **Production logging consistency** -- is error reporting consistent across all epics?

---

## Sizing Multiplier Reference

| Detection Rate | Multiplier | Meaning |
|----------------|------------|---------|
| 0% (no hardening) | 2.3x | Epic 1 actual experience |
| 50% | ~1.7x | Catches obvious patterns |
| 85%+ (this catalog) | ~1.1-1.3x | Catches most patterns, some emergent issues |
| 100% | 1.0x | Theoretical ideal |

Target: 85%+ detection rate, keeping multiplier under 1.3x.
