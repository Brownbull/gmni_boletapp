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

## Sync Notes

### Generation 6 (2026-02-01)
- Consolidated duplicate patterns across sections
- Removed verbose Key Additions by Date table
- Reduced file from 49KB to ~8KB
- Patterns now grouped by domain

### Generation 5 (2026-01-24)
- Consolidated Epic 14c-refactor code review patterns

**Detailed logs:** Story files in `docs/sprint-artifacts/`
**Epic 14c analysis:** `docs/sprint-artifacts/epic-14c-retro-2026-01-20.md`
