# Historical Lessons (Retrospectives)

> Section 6 of Atlas Memory
> Last Optimized: 2026-02-01 (Generation 6)
> Sources: Epic retrospectives, code reviews

## What Worked Well

| Pattern | Context |
|---------|---------|
| PRD + Tech-Spec Workflow | Essential for UX-heavy epics |
| Story-to-Story Knowledge Transfer | Dev records enable pattern reuse |
| Code Review Discipline | All stories get adversarial reviews |
| Parallel CI Jobs | 63% faster after Epic 8 optimization |
| Mockup-First Workflow | Design before implementation for UX |
| Tiered CI/CD | develop=smoke ~3min, main=full ~5min |
| Atlas Agent Integration | Consistent code reviews + architectural memory |
| Archie Pre-Review Pattern | Architecture review before code review |
| Review Follow-up in Same Story | Address findings immediately, avoid tech debt |
| Feature-Based Extraction (14e) | Extract business logic to features, views own their data |
| Layered Handler Extraction (14e) | Utilities → Subhandlers → Main (prevents 600-line single extractions) |
| Story Pre-Splitting (14e) | During planning, split stories >3 pts immediately |
| ECC Parallel Reviews (14d-v2) | Code + Security reviewers run simultaneously for faster feedback |
| Pre-existing Component Testing (14d-v2) | Add comprehensive tests to pre-existing components before integration |

## What to Avoid

| Failure | Prevention |
|---------|------------|
| Oversized Stories | Max 4 tasks, 15 subtasks, 8 files - split upfront |
| Bundle Size Growth | Code-splitting (2.92 MB current) |
| Delta Sync Cannot Detect Deletions | Design soft delete/tombstones BEFORE sync |
| Full Refetch Fallback | Costs explode - fix sync, don't ship band-aid |
| Aspirational LOC Targets | 1,500 line target was unrealistic for 4,800-line App.tsx |
| Untracked New Files | `git status --porcelain` verify `A `/`M ` prefix before commit |
| Orchestrator Outside Layout | Causes content to push views down |
| Dialog Type Conflicts | Check active dialog type before showing modals |
| Utility Created But Not Integrated | Verify utility is imported in src/ (not just tests), exported from entity module per FSD |
| Function Naming Collision | Check existing functions with same name before creating - different signatures cause confusion |
| Feature Module Export Gap | When adding types to `src/types/`, also re-export from `src/features/*/types.ts` + `index.ts` per FSD |

---

## Critical Patterns by Domain

### Git & Staging

| Pattern | Rule |
|---------|------|
| 3-Branch Strategy | `feature/* → develop → staging → main` |
| Merge commits | For sync PRs, not squash |
| Staging verification | `git status --porcelain` - no space before letter = staged |
| New directories | `git add path/` to stage - shows single `??` for whole tree |
| Deletion staging | `git rm` or `git add` required - ` D` vs `D ` |
| Multi-file verification | Verify ALL claimed files before review |

### Zustand State Management (Epic 14e)

| Pattern | Rule |
|---------|------|
| Store structure | Foundation → Actions → Selectors → Migration |
| useShallow for objects | Combined selectors, action objects |
| getState() | Synchronous access in callbacks |
| DEV-only devtools | `enabled: import.meta.env.DEV` |
| Phase guards | `if (phase !== expected) return null` |
| Atomic multi-store sync | Direct function object as single source |
| Store extension | Add state/actions/selectors incrementally |
| Context→Store migration | Add legacy aliases, remove Provider |

### React Patterns

| Pattern | Rule |
|---------|------|
| Hooks before early returns | ALL hooks called before `if (!user) return` |
| Pure utility extraction | Extract pure functions FIRST, enables testing |
| Dependency injection | Pass validators as params for testability |
| Composition hook ownership | `useViewData()` owns data, `useViewProps()` receives data |
| Context provider timing | Hooks execute BEFORE context providers render |

### Modal Manager (Epic 14e)

| Pattern | Rule |
|---------|------|
| Incremental migration | Keep old APIs while migrating |
| Code splitting | React.lazy() in registry |
| useEffect triggers | Open modals via useEffect, not in handlers |
| onClose composition | Store.closeModal() THEN props.onClose() |

### Firestore

| Pattern | Rule |
|---------|------|
| Defensive timestamps | `try/catch` with `?.toDate?.()` |
| LISTENER_LIMITS | Always apply limits to real-time queries |
| Batch commit retry | `commitBatchWithRetry()` with exponential backoff |
| Cross-user queries | Cloud Function with server-side validation |

### Testing

| Pattern | Rule |
|---------|------|
| Explicit test groups | Module-based configs for CI |
| Collocated tests | Feature tests need CI group include patterns |
| Test path aliases | Relative imports in tests, explicit vitest aliases |
| useShallow test mock | Mock entire store module with `vi.hoisted()` |
| mockState object | Module-level object modified in beforeEach |
| Context→Store mock migration | Search ALL test files for deleted module mocks (`grep -r "mock.*@/contexts/Name"`) |

### i18n

| Pattern | Rule |
|---------|------|
| No hardcoded strings | Use `t('key')` always |
| Check existing keys | Search translations.ts before adding |
| Fallback masks bugs | Verify keys exist, don't rely on fallbacks |

---

## Story Documentation

| Pattern | Rule |
|---------|------|
| Task checkboxes | Mark `[x]` immediately, not batch at end |
| File List | MUST match git changes |
| Story sizing | SMALL (1-2 tasks), MEDIUM (2-3), LARGE (3-4 max) |
| Split patterns | foundation → actions → selectors → migration |
| Full-stack split | foundation → backend → UI → opt-in/errors → infrastructure |
| Split triggers | >4 tasks OR >15 subtasks OR >8 files = MUST SPLIT |

---

## UX Design Principles

### The Boletapp Voice
- **Observes without judging**: "Restaurants up 23%" not "You overspent"
- **Reveals opportunity**: Trade-off visibility without guilt
- **Celebrates progress**: Personal records, milestones

### Key Design Patterns
| Pattern | Rule |
|---------|------|
| Touch targets | Minimum 44px |
| Skeleton loading | `animate-pulse` + `role="status"` |
| Mobile-first | Always-visible buttons, not hover-only |

---

## Team Agreements

1. Mockups before implementation for UX work
2. Architecture decisions before UX changes
3. Every epic ends with deployment story
4. Hotfixes backported immediately
5. Merge commits for sync PRs

---

## Retrospectives

### Epic 14e Retrospective (2026-02-01)

**Summary:** Feature-based architecture refactoring - App.tsx 3,387→2,191 lines, 7 Zustand stores, 86 story files

**What Worked:**
- Feature slicing pattern (`src/features/scan/`, `src/features/batch-review/`)
- Zustand store sequence: Foundation → Actions → Selectors → Migration
- Layered extraction: Utilities first, subhandlers second, main last
- Archie-assisted refactoring for architectural decisions
- Story pre-splitting during planning (15+ stories split)

**What to Avoid:**
- Original 500-800 line target was unrealistic - revised to 1,800-2,200
- ViewHandlersContext approach failed - views owning data is cleaner

**Process Changes:**
- Pre-split stories >3 pts during planning, not during development
- Staging verification mandatory: `git status --porcelain` in Definition of Done

**Source:** `docs/sprint-artifacts/epic14e-feature-architecture/epic-14e-retro-2026-02-01.md`

---

## Sync Notes

### Story Sizing Analysis (2026-02-01)
- Story 14d-v2-1-6 split: 13 tasks, 74 subtasks, 13+ files → 5 sub-stories
- Split strategy: by_feature (foundation → backend → UI → opt-in → infrastructure)
- Lesson: Full-stack feature stories are prime split candidates during planning

### Story Sizing - Proactive Split (2026-02-01)
- Story 14d-v2-1-4c analyzed: 3 tasks, 15 subtasks (at limit), 2-3 files
- Classification: LARGE - technically acceptable but at capacity
- Decision: Proactive split to reduce risk
- Split strategy: by_feature (core → enhanced)
  - 14d-v2-1-4c-1: Core dialog + entry point (2 tasks, 7 subtasks)
  - 14d-v2-1-4c-2: Enhanced features + BC-1 limits (2 tasks, 8 subtasks)
- Lesson: UI component stories split well by separating core functionality from polish/limits
- Recommendation: Split proactively when at subtask ceiling, even if technically acceptable

### Generation 6 (2026-02-01)
- Consolidated duplicate patterns across sections
- Removed verbose Key Additions by Date table
- Reduced file from 49KB to ~8KB
- Patterns now grouped by domain
- Added Epic 14e retrospective insights

### Story Sizing - 14d-v2-1-5b (2026-02-01)
- Story 14d-v2-1-5b split: 3 tasks, 18 subtasks exceeded limit (15 max)
- Split strategy: by_feature (Core Service → Validation & Security)
- New stories: 14d-v2-1-5b-1 (1 task, 7 subtasks), 14d-v2-1-5b-2 (2 tasks, 11 subtasks)
- Lesson: Backend service stories with validation + security often exceed subtask limits
- Recommendation: Separate CRUD, validation, and security into distinct stories when approaching limits

### Story Sizing - 14d-v2-1-6c (2026-02-01)
- Story 14d-v2-1-6c analyzed: 3 tasks, 18 subtasks (exceeded 15 limit), 6 files
- Classification: TOO_LARGE - exceeded subtask limit by 3
- Split strategy: by_feature (foundation UI → interaction logic)
  - 14d-v2-1-6c-1: Badge + List (2 tasks, 10 subtasks, 4 files)
  - 14d-v2-1-6c-2: Accept Dialog (1 task, 8 subtasks, 2 files)
- Lesson: UI stories with badge + list + dialog naturally split by interaction complexity
- Recommendation: Split badge/notification + list from complex dialog interactions

### Story Sizing - 14d-v2-1-7 (2026-02-01)
- Story 14d-v2-1-7 split: 11 tasks, 69 subtasks, 12+ files → 6 sub-stories
- Original estimate 3 pts → Actual 13 pts after split
- Split strategy: by_feature (service foundation → deletion → cloud function → UI → security → tests)
- Lesson: Full-stack "leave/manage" stories covering multiple operations (leave, transfer, delete) should be split during planning
- Pattern: Service layer (CRUD ops) → Infrastructure (Cloud Functions) → UI → Security Rules → Integration Tests
- Recommendation: When a single story has 3+ distinct operations (leave, transfer, delete), split by operation first

### Story Sizing - 14d-v2-1-8 (2026-02-01)
- Story 14d-v2-1-8 split: 11 tasks, 45 subtasks exceeded limits (4 tasks/15 subtasks max)
- Split strategy: by_phase (foundation → validation → logging → testing)
- New stories: 14d-v2-1-8a (4 tasks, 16 subtasks), 14d-v2-1-8b (3 tasks, 9 subtasks),
  14d-v2-1-8c (2 tasks, 7 subtasks), 14d-v2-1-8d (2 tasks, 13 subtasks)
- Lesson: Cloud Function stories with validation, logging, and testing often exceed limits
- Pattern: Core implementation → Validation layer → Polish → Tests+Deploy
- Recommendation: Split Cloud Function stories along architectural boundaries (setup → security → observability → verification)

### Documentation Drift - 14d-1-1 Code Review (2026-02-01)
- Context→Zustand migrations leave stale documentation (docstrings, type comments)
- Found: ViewModeContext references in 3 files after migration to useViewModeStore
- Found: sharedGroupIds[] references in type docs after field removal
- Prevention: When migrating Context→Store, grep for old Context name in comments/docstrings, not just imports
- Pattern: `grep -r "OldContextName" src --include="*.ts" --include="*.tsx"` catches doc drift

### Story Sizing - 14d-v2-1-11 (2026-02-01)
- Story 14d-v2-1-11 analyzed: 6 tasks, 28 subtasks, ~12 files
- Classification: TOO_LARGE - exceeded ALL THREE limits (>4 tasks, >15 subtasks, >8 files)
- Original estimate: 3 pts → Actual: 6 pts after split (2+2+2)
- Split strategy: by_layer (foundation → service → UI)
  - 14d-v2-1-11a: Foundation (types + cooldown utility) - 2 tasks, 10 subtasks, 4 files
  - 14d-v2-1-11b: Service (Firestore service + security rules) - 2 tasks, 7 subtasks, 4 files
  - 14d-v2-1-11c: UI (toggle component + integration) - 2 tasks, 11 subtasks, 4 files
- Lesson: Full-stack toggle features with types/service/UI/security naturally split by architectural layer
- Pattern: Foundation (types+utils) → Backend (service+security) → Frontend (component+integration)
- Recommendation: When a story has types, service function, UI component, AND security rules, plan for 3 stories upfront

### Story Sizing - 14d-v2-1-12 (2026-02-01)
- Story 14d-v2-1-12 analyzed: 8 tasks, 34 subtasks, 8 files
- Classification: TOO_LARGE - exceeded task limit (8 vs 4 max) and subtask limit (34 vs 15 max)
- Original estimate: 3 pts → Actual: 8 pts after split (2+2+2+2)
- Split strategy: by_layer (foundation → service → UI → integration)
  - 14d-v2-1-12a: Foundation (types + cooldown utility) - 2 tasks, 8 subtasks, 2 files
  - 14d-v2-1-12b: Service (backend + security rules) - 2 tasks, 7 subtasks, 2 files
  - 14d-v2-1-12c: UI (toggle component + hook) - 2 tasks, 11 subtasks, 2 files
  - 14d-v2-1-12d: Integration (settings + leave cleanup) - 2 tasks, 8 subtasks, 2 files
- Lesson: User preference stories with types/cooldown/service/UI/integration are 4-layer stories
- Pattern: Foundation (types+cooldown) → Backend (service+security) → UI (component+hook) → Integration (settings+cleanup)
- Recommendation: For user preference features, plan for 4 stories when cleanup/integration is separate from UI component

### Code Review - Integration Gap Detection (2026-02-01)
- Story 14d-v2-1-2b created utility functions but DID NOT integrate them into data pipeline
- Finding: `normalizeTransaction()` existed but was never imported in src/ (only in tests)
- Finding: Two functions named `normalizeTransaction` with different signatures caused confusion
- Finding: Entity module not updated to export new utilities (FSD violation)
- Fixes applied: Renamed to `ensureTransactionDefaults()`, integrated into 3 Firestore functions, exported from `@entities/transaction`
- Prevention: During code review, ALWAYS verify: (1) utility imported in src/, (2) no naming collisions, (3) entity module exports
- Pattern: `grep -r "from.*newUtilFile" src/` to verify integration

### Story Sizing - 14d-v2-1-14 (2026-02-01)
- Story 14d-v2-1-14 analyzed: 7 tasks, 37 subtasks, 7 files
- Classification: TOO_LARGE - exceeded BOTH task limit (7 vs 4 max) and subtask limit (37 vs 15 max)
- Original estimate: 3 pts -> Actual: 9 pts after split (2+3+2+2)
- Split strategy: by_layer (component -> service -> polish -> tests)
  - 14d-v2-1-14a: Dialog Component Foundation (1 task, 9 subtasks, 2 files)
  - 14d-v2-1-14b: Service Layer & Flow Integration (2 tasks, 10 subtasks, 3 files)
  - 14d-v2-1-14c: Polish & Edge Cases (3 tasks, 11 subtasks, 2 files)
  - 14d-v2-1-14d: Integration Tests (1 task, 7 subtasks, 1 file)
- Lesson: Join flow stories with dialog + service + edge cases + E2E tests are 4-layer stories
- Pattern: Component (UI) -> Backend (service+integration) -> Polish (toasts+offline+analytics) -> Tests (E2E verification)
- Recommendation: When a story has standalone UI component + service changes + polish layer + E2E tests, plan for 4 stories upfront

### Code Review - Feature Module Export Gap (2026-02-01)
- Story 14d-v2-1-4a created `SharedGroupMember` type in `src/types/sharedGroup.ts`
- Finding: Type exported from `@/types` but NOT re-exported from `@features/shared-groups`
- FSD requires types accessible via both `@/types` AND feature barrel (`@features/{name}`)
- Prevention: When adding types to `src/types/`, also update feature module barrels
- Pattern: `grep -r "TypeName" src/features/*/index.ts` to verify feature re-exports
- Verification command after adding new type: check both `@/types` and `@features/*` exports

### Code Review - Missing Input Sanitization (2026-02-01)
- Story 14d-v2-1-4c-1 code review found missing sanitization in group service
- Finding: `createGroup()` used `input.name` directly without calling `sanitizeInput()`
- Atlas Section 4 documents `src/utils/sanitize.ts` exists for XSS protection
- Fix applied: Added `import { sanitizeInput }` and sanitized group name before Firestore write
- Prevention: When creating service functions that accept user input, ALWAYS use sanitization utilities
- Pattern: `grep -r "sanitizeInput" src/features/*/services/` to verify sanitization usage

### Code Review - Entry Point Test Coverage (2026-02-01)
- Story 14d-v2-1-4c-1 modified `GruposView.tsx` but had no unit tests
- Finding: 302-line entry point component (Settings > Grupos) had 0% test coverage
- Fix applied: Created GruposView.test.tsx with 20 tests covering loading/empty/list states
- Prevention: When modifying entry point components in Settings views, require test coverage
- Lesson: UI component stories should include tests for ALL modified files, not just new components

### Code Review - Git Staging Verification (2026-02-01)
- Story 14d-v2-1-4c-1 had CREATE files that were untracked (??) not staged (A )
- Finding: `CreateGroupDialog.tsx` and test file existed but wouldn't be committed
- Fix applied: `git add` to stage files
- Prevention: Verify `git status --porcelain` shows `A ` (staged) not `??` (untracked) for CREATE files
- Pattern: Story File List should use git reality check before marking story as review

### Code Review - Integration Gap Detection (2026-02-01)
- Story 14d-v2-1-4c-2: Dialog component had props for BC-1 limits and error handling
- Finding: Parent component (GruposView) never passed these props to the dialog
- Finding: Service layer defense-in-depth was documented but not implemented
- Finding: Tests passed because they tested dialog in isolation with mock props
- Prevention: When reviewing UI components with optional props, verify parent actually passes them
- Pattern: `grep -r "ComponentName" src/ --include="*.tsx" | grep -v "test"` to find usages
- Lesson: "Props exist" ≠ "Props are used" - always check integration points

### Code Review - E2E Test Strategy Pattern (2026-02-02)
- Story 14d-v2-1-4d: Integration testing story with OAuth-dependent E2E tests
- Finding: Firebase Auth Emulator OAuth popup not automatable in headless CI
- Decision: Document limitation, use comprehensive unit tests as equivalent coverage
- Pattern: When E2E tests require OAuth, create E2E file with:
  1. Unauthenticated access protection tests (automatable)
  2. Detailed documentation of test strategy deviation
  3. Reference to equivalent unit test coverage
  4. Manual E2E testing procedures
- Lesson: 82 unit tests can provide equivalent coverage to blocked E2E tests when properly documented
- Prevention: Check for existing OAuth limitation patterns (auth-workflow.spec.ts) before writing new E2E tests

### Code Review - E2E Documentation Consistency (2026-02-02)
- Story 14d-v2-1-4d code review found test count discrepancy in E2E file comments
- Finding: E2E file documented "62 tests" but actual count was 82 (50+32)
- Cause: Test files grew during development (BC-1, discard, error handling) but E2E comments weren't updated
- Fix applied: Updated all test count references in E2E file from 31+31=62 to 50+32=82
- Prevention: When E2E files reference unit test counts, run tests to verify counts before marking story as review
- Pattern: `npm run test -- --run <file> | grep "passed"` to get actual test count

### Code Review - Foundation Story Git Staging (2026-02-02)
- Story 14d-v2-1-5a: All 5 CREATE files were `??` (untracked), not `A ` (staged)
- Story file itself was also untracked - wouldn't be committed
- File List was missing `src/types/sharedGroup.ts` (modified file)
- Dev Notes showed different interface structure than actual implementation
- Fixes applied: Staged all files, updated File List, synced Dev Notes
- Prevention: Run `git status --porcelain | grep "^\??"` before marking story as review
- Lesson: Foundation stories that CREATE new files need extra staging verification
- Pattern: For CREATE files, verify `A ` prefix; for MODIFY files, verify `M ` prefix

### Code Review - Service Sanitization Pattern (2026-02-02)
- Story 14d-v2-1-5b-1: invitationService had same sanitization gap as 14d-v2-1-4c-1
- Finding: 3 CRITICAL files untracked (service, tests, story) - wouldn't be committed
- Finding: `groupName`, `invitedByName`, `groupIcon` written without `sanitizeInput()`
- Fix applied: Added `sanitizeInput()` with maxLength limits (100 chars name, 10 chars icon)
- Prevention: Service functions accepting user strings MUST use sanitizeInput()
- Pattern: `import { sanitizeInput } from '@/utils/sanitize'` in all service files with user input
- Lesson: Backend service stories inherit sanitization requirement from prior code reviews
- Verification: `grep -r "sanitizeInput" src/services/` to audit sanitization usage

### Code Review - Security Rules Staging Critical (2026-02-02)
- Story 14d-v2-1-5b-2: Business constraint validation + Firestore security rules for invitations
- Finding: `firestore.rules` with pendingInvitations security rules was NOT STAGED (` M` status)
- Finding: Story file, integration tests, and test setup all unstaged or untracked
- Risk: If committed without staging, security rules would be missing from the commit!
- Fix applied: `git add` for all 7 files including firestore.rules
- Prevention: Security rules files are CRITICAL - always verify they're staged before review
- Pattern: `git status --porcelain firestore.rules` must show `M ` (staged) not ` M` (unstaged)
- Lesson: Validation/security stories split from backend stories need extra staging verification
- Testing: 72 unit tests + 12 security rules tests (all passing)

### Code Review - Incremental Story Staging (2026-02-02)
- Story 14d-v2-1-6b: All 3 implementation files were NOT STAGED despite story marked "review"
- Finding: Service file had `AM` status (earlier story staged, current story unstaged)
- Finding: Test file had `AM` status (same issue - incremental work not staged)
- Finding: Story file was `??` (untracked) - wouldn't be committed at all
- Risk: Committing would include old code but NOT the accept/decline functions!
- Prevention: For stories extending existing files, verify BOTH old and new changes staged
- Pattern: `git diff --cached <file> | wc -l` vs `git diff <file> | wc -l` to detect split staging
- Lesson: Stories that build on prior stories need extra staging verification
- Also fixed: Missing `sanitizeInput()` on userProfile fields (Atlas Section 6 pattern)

### Code Review - Git Staging Split Changes (2026-02-02)
- Story 14d-v2-1-6e: Types in `src/types/sharedGroup.ts` had `MM` status (split staging)
- Finding: User Group Preferences types (50+ lines) were unstaged while other parts of file were staged
- Cause: Prior stories staged partial changes, current story additions remained unstaged
- Risk: Committing would include old types but NOT the new UserGroupPreference interfaces
- Prevention: When extending shared type files, verify FULL file staging with `git status --porcelain`
- Pattern: `MM` status = both staged AND unstaged changes - always resolve before review
- Lesson: Type files shared across stories need extra staging verification

### Code Review - Firestore Batch Consistency (2026-02-02)
- Story 14d-v2-1-7b: Deletion service with cascade cleanup
- Finding: `deleteSubcollection()` and `deletePendingInvitationsForGroup()` missing batch handling
- Context: `clearTransactionsSharedGroupId()` correctly used BATCH_SIZE=500 pattern, but other helpers didn't
- Risk: Firestore batch limit is 500 operations - functions would fail silently or throw for large datasets
- Fix applied: Applied same batching pattern to all helper functions
- Pattern: When using `writeBatch(db)`, ALWAYS implement 500-operation chunking:
  ```typescript
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
- Prevention: Code review MUST verify ALL batch operations use chunking, not just the obvious ones
- Lesson: When one function in a file uses correct batching, verify pattern applies to ALL batch operations

### Security Review - TOCTOU Race Condition (2026-02-02)
- Story 14d-v2-1-7b: Deletion functions identified with race condition vulnerability
- Finding: Authorization check (getDoc) separate from deletion (deleteDoc) = TOCTOU vulnerability
- Attack scenario: Attacker passes owner check → ownership transferred → attacker's deletion continues
- Current implementation: Acceptable for MVP but flagged for production hardening
- Root cause: `getDoc()` is non-transactional; other service functions use `runTransaction()`
- Recommendation: Wrap authorization + deletion in `runTransaction()` OR use Cloud Functions with Admin SDK
- Pattern: When validating authorization before destructive action, use same transaction:
  ```typescript
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (snap.data().ownerId !== requesterId) throw new Error('Unauthorized');
    transaction.delete(ref);  // Same transaction = atomic
  });
  ```
- Prevention: Client-side authorization + separate deletion = always flag for TOCTOU review
- Lesson: Cascade deletion across multiple collections cannot be fully transactional in client SDK

### ECC Workflow - First Full Orchestration (2026-02-02)
- Story 14d-v2-1-7b: First story using full ECC-dev-story workflow
- Agents used: Planner → TDD Guide → Build Resolver → Code Reviewer + Security Reviewer (parallel)
- Flow: Atlas Puppeteer spawned 5 specialized agents via Task tool
- Findings: 26 tests created, 3 HIGH code issues found, 1 CRITICAL security issue flagged
- Observation: Parallel Code + Security review in single message worked well
- Observation: Build Resolver quickly fixed batching issues identified by Code Reviewer
- Lesson: ECC workflow effective for service layer stories with security-sensitive operations
- Recommendation: Use ECC workflow for stories involving: deletion, authorization, cross-user data

### ECC Workflow - Integration Testing Story (2026-02-03)
- Story 14d-v2-1-7f: Integration tests for leave/manage group flows
- Agents used: Planner → TDD Guide → Code Reviewer + Security Reviewer (parallel)
- No Build Resolver needed (all 43 tests passed first time)
- Findings: 43 tests created, 2 HIGH code issues (1 fixed: unused variable), 0 security issues
- Testing patterns:
  - `withSecurityRulesDisabled` for service-level integration tests (bypass rules for direct service testing)
  - Firebase emulator setup/teardown pattern reused across test files
  - ARRANGE-ACT-ASSERT with separate `withSecurityRulesDisabled` callbacks
  - Concurrent operation testing with `Promise.allSettled`
- Code Review insight: Duplicate test helpers across files identified as MEDIUM - consider shared test helper module
- Security Review insight: Path traversal, authorization, TOCTOU prevention all covered - LOW risk
- Lesson: Test-only stories benefit from ECC workflow for parallel quality/security reviews
- Lesson: When existing tests cover related scenarios (security rules, unit tests), document references rather than duplicate
- Recommendation: For testing stories, include references to related existing tests in story notes

### ECC Workflow - Edit Group Settings (2026-02-03)
- Story 14d-v2-1-7g: Edit group name/icon/color (owner-only)
- Agents used: Planner → TDD Guide → Code Reviewer + Security Reviewer (parallel)
- Findings: 49 tests created, parallel reviews both scored 7.5/10
- TOCTOU vulnerability found: `updateGroup` used `getDoc + updateDoc` instead of `runTransaction`
- Fix applied: Wrapped ownership check + update in `runTransaction` for atomicity
- Missing translations found: 10 i18n keys missing from translations.ts
- Test mock update: Had to update test mocks from `mockGetDoc + mockUpdateDoc` to `mockTransactionGet + mockTransactionUpdate`
- Lesson: TOCTOU pattern applies to ALL authorization-before-mutation functions, not just deletion
- Lesson: When code reviewer and security reviewer BOTH flag same issue = HIGH priority
- Pattern: Verify test mocks match actual implementation when refactoring to transactions
- Recommendation: After TOCTOU fix in one function, audit ALL similar functions in same file

### ECC Parallel Review - Cloud Function Validation (2026-02-04)
- Story 14d-v2-1-8b: Changelog Writer validation layer (membership check, batch writes)
- Agents used: Code Reviewer + Security Reviewer + Architect + TDD Guide (ALL 4 PARALLEL)
- First use of full 4-agent parallel ECC review for Cloud Functions
- Overall score: 8.25/10 (8 Code, 8 Security, 9 Architecture, 8 Testing)
- TOCTOU identified: Membership validation separate from batch commit (MEDIUM - mitigated by security rules)
- Defense-in-depth confirmed: Server sanitization + client escaping requirement documented
- Pattern: Type duplication for Cloud Functions isolation is acceptable with TD tracking (TD-14d-9)
- Pattern: Basic HTML sanitization acceptable when client-side escaping is primary defense (TD-14d-14)
- Pattern: N+1 queries acceptable when operation is rare (group changes vs single-group operations)
- Tech debt tracking: 7 TD stories created/referenced from single code review
- Lesson: Cloud Function stories benefit from 4-agent parallel review (catches type sync, TOCTOU, sanitization, test gaps)
- Lesson: When multiple agents flag same issue (TOCTOU) = consensus confirms acceptable risk with documentation
- Recommendation: Use 4-agent ECC review for Cloud Functions touching security-sensitive data

### Generation 5 (2026-01-24)
- Consolidated Epic 14c-refactor code review patterns

**Detailed logs:** Story files in `docs/sprint-artifacts/`
**Epic 14c analysis:** `docs/sprint-artifacts/epic-14c-retro-2026-01-20.md`
**Epic 14e analysis:** `docs/sprint-artifacts/epic14e-feature-architecture/epic-14e-retro-2026-02-01.md`
