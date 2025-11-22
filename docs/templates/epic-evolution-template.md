# Epic Evolution: [Epic Number] - [Epic Name]

**Epic ID:** [E.g., Epic 1, Epic 2]
**Epic Name:** [E.g., Production Deployment Readiness]
**Start Date:** [YYYY-MM-DD]
**End Date:** [YYYY-MM-DD or In Progress]
**Owner:** [PM Name]

---

## Purpose of This Document

This Epic Evolution document tracks the **Before** and **After** state of the system as each story is completed. It provides:

1. **State Visibility:** Clear view of what exists before the epic and what will exist after
2. **Incremental Progress:** Story-by-story changes showing evolution
3. **Discovery Tracking:** New requirements or architectural decisions discovered during implementation
4. **Onboarding Aid:** New developers can understand how the system evolved
5. **Retrospective Input:** Concrete data for epic retrospectives

---

## Epic Overview

### Epic Goal
[2-3 sentence description of what this epic aims to achieve]

### Success Criteria
- [ ] [Criterion 1]
- [ ] [Criterion 2]
- [ ] [Criterion 3]

### Stories in This Epic
1. [Story 1.1: Story Name] - [Status: pending/in-progress/review/done]
2. [Story 1.2: Story Name] - [Status: pending/in-progress/review/done]
3. [Story 1.3: Story Name] - [Status: pending/in-progress/review/done]
[Add all stories]

---

## Before State (Epic Start)

### Architecture
**Pattern:** [E.g., Single-file React app, Monolith, Microservices]
**File Count:** [Number of source files]
**Lines of Code:** [Approximate LOC]

**Structure:**
```
[Directory tree or description of current architecture]
```

**Key Components:**
- [Component 1]: [Description and responsibility]
- [Component 2]: [Description and responsibility]

### Technology Stack
- **Frontend:** [Framework and version]
- **Build Tool:** [Tool and version]
- **Database:** [Database type and version]
- **Authentication:** [Auth method]
- **Hosting:** [Hosting platform or local only]
- **Version Control:** [Git status or none]

### Features Implemented
- [ ] [Feature 1]
- [ ] [Feature 2]
- [ ] [Feature 3]

### Features Missing/Pending
- [ ] [Missing feature 1]
- [ ] [Missing feature 2]

### Infrastructure
- **Deployment:** [Deployment status - e.g., local only, manual, automated]
- **CI/CD:** [CI/CD status - e.g., none, partial, full]
- **Testing:** [Test coverage - e.g., none, manual, automated]
- **Monitoring:** [Monitoring status]

### Data Model
**Collections/Tables:**
```
[Describe database schema before epic]
E.g.:
- users/: { uid, email, displayName }
- transactions/: { id, userId, date, category, total, description }
```

**Security Rules:**
```
[Describe security rules status]
E.g.: No security rules configured, open access
```

### API Integrations
- [Integration 1]: [Status and configuration]
- [Integration 2]: [Status and configuration]

### Known Issues/Tech Debt
1. [Issue 1]: [Description]
2. [Issue 2]: [Description]

---

## After State (Epic Complete)

### Architecture
**Pattern:** [E.g., Modular SPA, Layered architecture]
**File Count:** [Number of source files]
**Lines of Code:** [Approximate LOC]

**Structure:**
```
[Directory tree or description of new architecture]
```

**Key Components:**
- [Component 1]: [Description and responsibility]
- [Component 2]: [Description and responsibility]

### Technology Stack
- **Frontend:** [Framework and version - highlight changes]
- **Build Tool:** [Tool and version - highlight changes]
- **Database:** [Database type and version]
- **Authentication:** [Auth method]
- **Hosting:** [Hosting platform]
- **Version Control:** [Git status]

### Features Implemented
- [x] [Feature 1] ← NEW
- [x] [Feature 2]
- [x] [Feature 3]

### Infrastructure
- **Deployment:** [Deployment status - e.g., automated to production]
- **CI/CD:** [CI/CD status]
- **Testing:** [Test coverage]
- **Monitoring:** [Monitoring status]

### Data Model
**Collections/Tables:**
```
[Describe database schema after epic - highlight changes]
```

**Security Rules:**
```
[Describe security rules - highlight changes]
E.g.: User isolation rules implemented, all reads/writes validated
```

### API Integrations
- [Integration 1]: [Status and configuration - highlight changes]
- [Integration 2]: [Status and configuration]

### Resolved Issues/Tech Debt
- [x] [Issue 1]: Resolved in Story X.Y
- [x] [Issue 2]: Resolved in Story X.Z

### New Tech Debt Identified
1. [New issue 1]: [Description and impact]
2. [New issue 2]: [Description and impact]

---

## Story-by-Story Evolution

### Story [X.1]: [Story Name]

**Status:** [pending/in-progress/review/done]
**Completed:** [YYYY-MM-DD or N/A]
**Branch:** [feature/branch-name or N/A]

#### What Changed
- [Change 1]: [Description]
- [Change 2]: [Description]

#### Files Added/Modified
- `[file/path.ts]`: [What changed and why]
- `[file/path2.tsx]`: [What changed and why]

#### Architecture Impact
[Describe how this story changed the system architecture]

#### Data Model Changes
[Describe any database schema or security rule changes]

#### Discoveries
[New requirements, blockers, or decisions discovered during implementation]

#### Before → After Snapshot
```diff
Before: [Brief description]
After:  [Brief description]

E.g.:
Before: Single App.tsx file with 621 lines
After:  Modular structure with config/, types/, services/, hooks/, utils/, components/, views/
```

---

### Story [X.2]: [Story Name]

**Status:** [pending/in-progress/review/done]
**Completed:** [YYYY-MM-DD or N/A]
**Branch:** [feature/branch-name or N/A]

#### What Changed
- [Change 1]: [Description]
- [Change 2]: [Description]

#### Files Added/Modified
- `[file/path.ts]`: [What changed and why]

#### Architecture Impact
[Describe how this story changed the system architecture]

#### Data Model Changes
[Describe any database schema or security rule changes]

#### Discoveries
[New requirements, blockers, or decisions discovered during implementation]

#### Before → After Snapshot
```diff
Before: [Brief description]
After:  [Brief description]
```

---

### Story [X.3]: [Story Name]

[Repeat structure for each story]

---

## Architectural Decisions (ADRs)

### ADR-[Number]: [Decision Title]

**Date:** [YYYY-MM-DD]
**Status:** Accepted
**Story:** [X.Y where decision was made]

#### Context
[What situation required a decision?]

#### Decision
[What did we decide?]

#### Rationale
[Why did we make this decision?]

#### Consequences
- **Positive:** [Benefit 1], [Benefit 2]
- **Negative:** [Trade-off 1], [Trade-off 2]

#### Alternatives Considered
1. [Alternative 1]: [Why rejected]
2. [Alternative 2]: [Why rejected]

---

### ADR-[Number]: [Decision Title]

[Repeat for each ADR made during this epic]

---

## Discoveries & Learnings

### Critical Discoveries

#### Discovery 1: [Title]
- **Discovered In:** Story X.Y
- **Impact:** [HIGH/MEDIUM/LOW]
- **Description:** [What we learned]
- **Action Taken:** [How we responded]

#### Discovery 2: [Title]
- **Discovered In:** Story X.Y
- **Impact:** [HIGH/MEDIUM/LOW]
- **Description:** [What we learned]
- **Action Taken:** [How we responded]

### Gotchas & Pitfalls
1. **[Gotcha 1]:** [Description and how to avoid]
2. **[Gotcha 2]:** [Description and how to avoid]

### Best Practices Established
1. **[Practice 1]:** [Description]
2. **[Practice 2]:** [Description]

---

## Metrics

### Code Metrics
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Total Files | [number] | [number] | +[delta] |
| Lines of Code | [number] | [number] | +[delta] |
| TypeScript Files | [number] | [number] | +[delta] |
| Components | [number] | [number] | +[delta] |
| Test Files | [number] | [number] | +[delta] |
| Test Coverage | [percent] | [percent] | +[delta]% |

### Build & Performance
| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Build Time | [seconds] | [seconds] | [delta]s |
| Bundle Size | [KB] | [KB] | [delta]KB |
| Lighthouse Score | [score] | [score] | +[delta] |

### Deployment
| Metric | Before | After |
|--------|--------|-------|
| Deployment Method | [manual/automated] | [manual/automated] |
| Deployment Time | [minutes] | [minutes] |
| Rollback Capability | [yes/no] | [yes/no] |

---

## Risks & Mitigation

### Risks Identified

#### Risk 1: [Risk Title]
- **Likelihood:** [High/Medium/Low]
- **Impact:** [High/Medium/Low]
- **Description:** [What could go wrong]
- **Mitigation:** [How we're addressing it]
- **Status:** [Open/Mitigated/Accepted]

#### Risk 2: [Risk Title]
- **Likelihood:** [High/Medium/Low]
- **Impact:** [High/Medium/Low]
- **Description:** [What could go wrong]
- **Mitigation:** [How we're addressing it]
- **Status:** [Open/Mitigated/Accepted]

---

## Dependencies

### External Dependencies Added
- `[package-name]@[version]`: [Purpose]
- `[package-name]@[version]`: [Purpose]

### Internal Dependencies
- [Story X.1 blocks Story X.3]: [Reason]
- [Story X.2 depends on Story X.1]: [Reason]

### Blockers Encountered
1. **[Blocker 1]:** [Description and resolution]
2. **[Blocker 2]:** [Description and resolution]

---

## Action Items for Next Epic

Based on learnings from this epic:

1. **[Action Item 1]:** [Description and owner]
2. **[Action Item 2]:** [Description and owner]
3. **[Action Item 3]:** [Description and owner]

---

## Visual State Evolution

### Architecture Diagram (Before)
```
[Mermaid diagram or ASCII art showing before state]
```

### Architecture Diagram (After)
```
[Mermaid diagram or ASCII art showing after state]
```

### Data Flow (Before)
```
[Mermaid sequence diagram or description]
```

### Data Flow (After)
```
[Mermaid sequence diagram or description]
```

---

## References

- **Epic Planning:** [Link to epic definition in epics.md]
- **Tech Spec:** [Link to technical specification]
- **Story Files:** [Link to sprint-artifacts/ directory]
- **Retrospective:** [Link to epic retrospective document]
- **Architecture:** [Link to architecture.md]
- **ADRs:** [Links to individual ADR documents if separated]

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| [YYYY-MM-DD] | Epic evolution document created | [Author] |
| [YYYY-MM-DD] | Story X.1 completed, state updated | [Author] |
| [YYYY-MM-DD] | Story X.2 completed, state updated | [Author] |

---

## Template Instructions

### How to Use This Template

1. **Create at Epic Start:**
   - Copy this template to `docs/sprint-artifacts/epic-[number]-evolution.md`
   - Fill in the "Before State" section completely
   - Define "After State" based on epic goals (will be refined)

2. **Update After Each Story:**
   - When a story moves to "review" or "done", update the corresponding "Story X.Y" section
   - Document what changed, files modified, and discoveries
   - Update metrics if applicable
   - Add ADRs if architectural decisions were made

3. **Finalize at Epic End:**
   - Verify "After State" matches reality
   - Complete all metrics
   - Document all discoveries and learnings
   - Generate action items for next epic
   - Create/update visual diagrams

4. **Link to Other Documents:**
   - Reference this evolution doc in retrospective
   - Link from architecture.md for historical context
   - Reference in onboarding documentation

### What Makes a Good Evolution Entry

- **Specific:** Don't write "refactored code" - write "extracted Firebase config to src/config/firebase.ts (45 lines)"
- **Visual:** Use before/after code snippets, diffs, or diagrams
- **Contextual:** Explain WHY the change was made, not just WHAT changed
- **Forward-looking:** Note implications for future work
- **Honest:** Document gotchas, mistakes, and surprises

### Example: Good vs. Bad Entries

**Bad Entry:**
> Story 1.1: Refactored the app. Made it modular. Works better now.

**Good Entry:**
> Story 1.1: Modular Architecture Migration
>
> **What Changed:**
> - Extracted 621-line App.tsx into 31 TypeScript files across 7 logical layers
> - Created config/, types/, services/, hooks/, utils/, components/, views/ directories
> - Implemented barrel exports (index.ts) for clean imports
>
> **Files Added:**
> - `src/config/firebase.ts`: Firebase initialization (45 lines)
> - `src/types/Transaction.ts`: TypeScript interfaces (18 lines)
> - `src/services/firestore.ts`: Firestore CRUD operations (87 lines)
> [... list continues]
>
> **Architecture Impact:**
> Transformed from single-file monolith to layered modular architecture. Each layer has clear responsibility:
> - config: Environment and API configuration
> - types: TypeScript type definitions
> - services: External API integrations
> [... explanation continues]
>
> **Discoveries:**
> - TypeScript types improved IDE autocomplete significantly
> - Vite HMR works better with smaller file changes
> - Import paths needed tsconfig baseUrl configuration
>
> **Before → After:**
> ```diff
> Before: src/App.tsx (621 lines) - everything in one file
> After:  src/ (31 files, 7 layers) - separation of concerns
> ```

---

**Template Version:** 1.0
**Created:** 2025-11-21
**Last Updated:** 2025-11-21
**Owner:** Winston (Architect)
