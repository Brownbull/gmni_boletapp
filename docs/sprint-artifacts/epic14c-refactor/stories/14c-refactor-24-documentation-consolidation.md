# Story 14c-refactor.24: Documentation Consolidation and Folder Cleanup

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a **developer**,
I want **documentation consolidated, obsolete files removed, and non-code folders organized**,
So that **documentation is findable, up-to-date, and the project structure is clean for Epic 14d**.

## Acceptance Criteria

### Documentation Cleanup - Root Level Files

1. **Given** duplicate documentation files exist at `docs/` root
   **When** this story is completed
   **Then:**
   - Delete `docs/architecture-epic7.md` (duplicate of `docs/sprint-artifacts/epic7/architecture-epic7.md`)
   - Delete `docs/prd-epic7.md` (duplicate of `docs/sprint-artifacts/epic7/prd-epic7.md`)
   - Move `docs/branching-strategy.md` to `docs/ci-cd/branching-strategy.md`
   - Move `docs/ux-design-specification.md` to `docs/uxui/ux-design-specification.md`
   - Move root HTML design files to `docs/uxui/`:
     - `docs/ux-color-themes.html` → `docs/uxui/reference/ux-color-themes.html`
     - `docs/ux-design-directions.html` → `docs/uxui/reference/ux-design-directions.html`
   - No loose documentation files at `docs/` root except `README.md` and `index.md`

2. **Given** `docs/epics.md` and `docs/tech-spec.md` exist at root
   **When** reviewing these files
   **Then:**
   - Review if `docs/epics.md` and `docs/planning/epics.md` are duplicates
   - If duplicates: delete root version, keep `docs/planning/epics.md`
   - If different versions: rename root to indicate version (e.g., `epics-v4.5.md`) and move to `docs/planning/`
   - Same process for `docs/tech-spec.md` vs `docs/planning/tech-spec.md`

### Archive Consolidation

3. **Given** two archive folders exist
   **When** this story is completed
   **Then:**
   - Merge `docs/.archive/` contents into `docs/archive/`
   - Delete empty `docs/.archive/` directory
   - Single archive location at `docs/archive/`

4. **Given** old implementation readiness reports exist
   **When** this story is completed
   **Then:**
   - Move `docs/implementation-readiness-report-2025-12-05.md` to `docs/archive/`
   - Verify `docs/planning-artifacts/` contains current reports only

### Folder Restructuring

5. **Given** `docs/excalidraw-diagrams/` exists separately from architecture
   **When** this story is completed
   **Then:**
   - Create `docs/architecture/diagrams/excalidraw/` if not exists
   - Move contents of `docs/excalidraw-diagrams/` to `docs/architecture/diagrams/excalidraw/`
   - Delete empty `docs/excalidraw-diagrams/` directory

6. **Given** `docs/planning/` and `docs/planning-artifacts/` exist separately
   **When** this story is completed
   **Then:**
   - Move `docs/planning-artifacts/` contents to `docs/planning/artifacts/`
   - Delete empty `docs/planning-artifacts/` directory
   - Update any internal links

7. **Given** `docs/uxui/cc_chrome/` contains developer tooling docs
   **When** this story is completed
   **Then:**
   - Move `docs/uxui/cc_chrome/` to `docs/development/tooling/wsl-chrome/`
   - This is developer setup, not UX documentation

### Non-Code Folder Cleanup

8. **Given** `functions/_bmad/` may have orphaned structure
   **When** this story is completed
   **Then:**
   - Audit `functions/_bmad/` directory
   - If empty or contains only empty folders, delete it
   - Document decision in completion notes

9. **Given** `_bmad/agents/atlas/atlas-sidecar/backups/` contains multiple backup versions
   **When** this story is completed
   **Then:**
   - Review backup versions (v1 through v5)
   - Keep only latest 2 versions (v4, v5)
   - Delete older backup versions (v1, v2, v3)
   - Document what was removed

10. **Given** `test-results/` is marked deprecated in `.gitignore`
    **When** this story is completed
    **Then:**
    - Delete `test-results/` directory if exists
    - Verify `.gitignore` still covers this pattern for safety

### Documentation Index Updates

11. **Given** documentation was reorganized
    **When** this story is completed
    **Then:**
    - Update `docs/README.md` to reflect current folder structure
    - Update `docs/index.md` to reference current epic (14c/14d, not epic 7)
    - Verify all internal links in index files work

### Root README Update

12. **Given** the project has many non-code folders
    **When** this story is completed
    **Then:**
    - Update root `README.md` with a "Project Structure" section:
      ```markdown
      ## Project Structure

      | Directory | Purpose |
      |-----------|---------|
      | `_bmad/` | BMAD framework - AI agent configurations and workflows |
      | `docs/` | Project documentation |
      | `functions/` | Firebase Cloud Functions |
      | `prompt-testing/` | AI prompt testing framework |
      | `public/` | Static assets (PWA icons, sounds) |
      | `scripts/` | Utility and admin scripts |
      | `shared/` | Shared code between frontend and functions |
      | `src/` | Main application source code |
      | `tests/` | Test suites |
      ```
    - Keep description concise (1 line per folder)

### Design References Evaluation

13. **Given** `docs/design-references/tailwind_templates/` contains 23MB of HTML files
    **When** evaluating this folder
    **Then:**
    - Determine if these templates are actively used
    - If not actively used: add to `.gitignore` with comment "# External reference material"
    - If actively used: document purpose in `docs/design-references/README.md`
    - Note: Do NOT delete - may be useful for future reference

### Prompt Testing Evaluation

14. **Given** `prompt-testing/` folder exists
    **When** evaluating this folder
    **Then:**
    - Check last modification date and recent usage
    - If actively used: keep as-is
    - If obsolete: move `prompt-testing/ARCHITECTURE.md` and `prompt-testing/QUICKSTART.md` to `docs/archive/prompt-testing/`
    - Document decision in completion notes

## Tasks / Subtasks

### Task 1: Clean Docs Root Level (AC: #1, #2)

- [x] 1.1 Delete `docs/architecture-epic7.md` (verify duplicate first)
- [x] 1.2 Delete `docs/prd-epic7.md` (verify duplicate first)
- [x] 1.3 Move `docs/branching-strategy.md` to `docs/ci-cd/`
- [x] 1.4 Move `docs/ux-design-specification.md` to `docs/uxui/`
- [x] 1.5 Create `docs/uxui/reference/` directory
- [x] 1.6 Move HTML design files to `docs/uxui/reference/`
- [x] 1.7 Compare `docs/epics.md` vs `docs/planning/epics.md`
- [x] 1.8 Consolidate or rename epics files based on comparison
- [x] 1.9 Compare `docs/tech-spec.md` vs `docs/planning/tech-spec.md`
- [x] 1.10 Consolidate or rename tech-spec files based on comparison

### Task 2: Consolidate Archives (AC: #3, #4)

- [x] 2.1 List contents of `docs/.archive/`
- [x] 2.2 Move contents to `docs/archive/`
- [x] 2.3 Delete `docs/.archive/` directory
- [x] 2.4 Move old readiness report to `docs/archive/`

### Task 3: Restructure Folders (AC: #5, #6, #7)

- [x] 3.1 Create `docs/architecture/diagrams/excalidraw/` if needed
- [x] 3.2 Move excalidraw diagrams
- [x] 3.3 Delete empty `docs/excalidraw-diagrams/`
- [x] 3.4 Create `docs/planning/artifacts/`
- [x] 3.5 Move planning-artifacts contents
- [x] 3.6 Delete empty `docs/planning-artifacts/`
- [x] 3.7 Create `docs/development/tooling/wsl-chrome/`
- [x] 3.8 Move cc_chrome contents
- [x] 3.9 Delete empty `docs/uxui/cc_chrome/`
- [x] 3.10 Update any internal links in moved files (none needed - paths are self-contained)

### Task 4: Clean Non-Code Folders (AC: #8, #9, #10)

- [x] 4.1 Audit `functions/_bmad/` directory
- [x] 4.2 Delete if empty/orphaned (was empty, deleted)
- [x] 4.3 List BMAD backup versions in `_bmad/agents/atlas/atlas-sidecar/backups/`
- [x] 4.4 Keep v4, v5 - delete v1, v2, v3
- [x] 4.5 Delete `test-results/` directory if exists

### Task 5: Update Documentation Indexes (AC: #11)

- [x] 5.1 Read current `docs/README.md`
- [x] 5.2 Update to reflect current folder structure
- [x] 5.3 Read current `docs/index.md`
- [x] 5.4 Update epic references to current (14c/14d)
- [x] 5.5 Verify all internal links work (key paths verified)

### Task 6: Update Root README (AC: #12)

- [x] 6.1 Read current `README.md`
- [x] 6.2 Add "Project Structure" section if missing (expanded existing section)
- [x] 6.3 Document each major folder's purpose
- [x] 6.4 Keep descriptions concise

### Task 7: Evaluate Large Folders (AC: #13, #14)

- [x] 7.1 Check if `docs/design-references/tailwind_templates/` is used (already gitignored)
- [x] 7.2 Add to `.gitignore` or create README based on decision (created README.md)
- [x] 7.3 Check `prompt-testing/` last modification and usage (Jan 8, 2026 - actively used)
- [x] 7.4 Document decision (keep or archive) - KEEP prompt-testing (active)

### Task 8: Final Verification

- [x] 8.1 Run `find docs -name "*.md" -type f | head -50` to verify structure
- [x] 8.2 Verify no broken internal links (key paths verified)
- [x] 8.3 Run TypeScript check: `npm run type-check` (passes - no code affected)
- [x] 8.4 Document all changes in completion notes

## Completion Notes

### Files Deleted (7)
1. `docs/architecture-epic7.md` - duplicate of `docs/sprint-artifacts/epic7/architecture-epic7.md`
2. `docs/prd-epic7.md` - duplicate of `docs/sprint-artifacts/epic7/prd-epic7.md`
3. `_bmad/agents/atlas/atlas-sidecar/backups/v1/` - old backup
4. `_bmad/agents/atlas/atlas-sidecar/backups/v2/` - old backup
5. `_bmad/agents/atlas/atlas-sidecar/backups/v3/` - old backup
6. `run_app.local.md` - duplicate of `docs/development/local-setup.md`
7. `steps_for_epics.md` - duplicate of `docs/planning/steps-for-epics.md`

### Files Moved/Reorganized (11)
1. `docs/branching-strategy.md` → `docs/ci-cd/`
2. `docs/ux-design-specification.md` → `docs/uxui/`
3. `docs/ux-color-themes.html` → `docs/uxui/reference/`
4. `docs/ux-design-directions.html` → `docs/uxui/reference/`
5. `docs/epics.md` → `docs/archive/epics-v4.5-dec2025.md` (older version)
6. `docs/tech-spec.md` → `docs/archive/tech-spec-epic4.5-nov2025.md` (older version)
7. `docs/.archive/*` → `docs/archive/`
8. `docs/implementation-readiness-report-2025-12-05.md` → `docs/archive/`
9. `docs/excalidraw-diagrams/*` → `docs/architecture/diagrams/excalidraw/`
10. `docs/planning-artifacts/*` → `docs/planning/artifacts/`
11. `docs/uxui/cc_chrome/*` → `docs/development/tooling/wsl-chrome/`

### Directories Created (4)
1. `docs/uxui/reference/`
2. `docs/architecture/diagrams/excalidraw/`
3. `docs/planning/artifacts/`
4. `docs/development/tooling/wsl-chrome/`

### Directories Deleted (6)
1. `docs/.archive/` (merged with archive/)
2. `docs/excalidraw-diagrams/`
3. `docs/planning-artifacts/`
4. `docs/uxui/cc_chrome/`
5. `test-results/`
6. `functions/_bmad/`

### Files Updated (3)
1. `docs/README.md` - Updated to reflect current structure, v5.0
2. `docs/index.md` - Updated header and folder list, v10.0
3. `README.md` - Added comprehensive Project Structure section

### Files Created (1)
1. `docs/design-references/README.md` - Documents gitignored tailwind_templates

### Evaluation Decisions
- `docs/design-references/tailwind_templates/` - KEEP (already gitignored, added README)
- `prompt-testing/` - KEEP (actively used, last modified Jan 8, 2026)

## Dev Notes

### Files to DELETE

| File | Reason |
|------|--------|
| `docs/architecture-epic7.md` | Duplicate of `docs/sprint-artifacts/epic7/` |
| `docs/prd-epic7.md` | Duplicate of `docs/sprint-artifacts/epic7/` |
| `docs/.archive/` | Merge with `docs/archive/` |
| `test-results/` | Deprecated (marked in .gitignore) |
| `_bmad/agents/atlas/atlas-sidecar/backups/v1/` | Old backup |
| `_bmad/agents/atlas/atlas-sidecar/backups/v2/` | Old backup |
| `_bmad/agents/atlas/atlas-sidecar/backups/v3/` | Old backup |

### Files to MOVE

| Current Location | New Location |
|------------------|--------------|
| `docs/branching-strategy.md` | `docs/ci-cd/branching-strategy.md` |
| `docs/ux-design-specification.md` | `docs/uxui/ux-design-specification.md` |
| `docs/ux-color-themes.html` | `docs/uxui/reference/ux-color-themes.html` |
| `docs/ux-design-directions.html` | `docs/uxui/reference/ux-design-directions.html` |
| `docs/excalidraw-diagrams/*` | `docs/architecture/diagrams/excalidraw/` |
| `docs/planning-artifacts/*` | `docs/planning/artifacts/` |
| `docs/uxui/cc_chrome/*` | `docs/development/tooling/wsl-chrome/` |
| `docs/implementation-readiness-report-2025-12-05.md` | `docs/archive/` |
| `docs/.archive/*` | `docs/archive/` |

### Proposed docs/ Structure After Cleanup

```
docs/
├── README.md                    # Updated overview
├── index.md                     # Main index (updated to Epic 14)
│
├── architecture/                # System architecture
│   ├── diagrams/
│   │   └── excalidraw/         # Moved from docs/excalidraw-diagrams/
│   └── ...
│
├── archive/                     # Single archive location
│   ├── epic-14c-shared-groups/ # From deprecation
│   ├── prompt-testing/         # If archived
│   └── ...
│
├── ci-cd/                       # CI/CD docs
│   ├── branching-strategy.md   # Moved from root
│   └── ...
│
├── development/                 # Developer guides
│   ├── local-setup.md          # Moved from run_app.local.md
│   └── tooling/
│       └── wsl-chrome/         # Moved from uxui/cc_chrome/
│
├── planning/                    # Consolidated planning
│   ├── artifacts/              # From planning-artifacts/
│   ├── steps-for-epics.md      # Moved from root
│   └── ...
│
├── uxui/                        # UX/UI documentation
│   ├── reference/              # Design reference files
│   │   ├── ux-color-themes.html
│   │   └── ux-design-directions.html
│   └── ...
│
└── sprint-artifacts/            # Sprint work (unchanged)
    └── ...
```

### Root README Project Structure Template

```markdown
## Project Structure

| Directory | Purpose |
|-----------|---------|
| `_bmad/` | BMAD framework - AI agent configurations and workflows |
| `docs/` | Project documentation (architecture, guides, sprint artifacts) |
| `functions/` | Firebase Cloud Functions backend |
| `prompt-testing/` | AI prompt testing framework for receipt scanning |
| `public/` | Static assets (PWA icons, sounds, manifest) |
| `scripts/` | Utility scripts (admin, data generation, CI) |
| `shared/` | Shared TypeScript schemas between frontend and functions |
| `src/` | Main React application source code |
| `tests/` | Test suites (unit, integration, e2e) |

### Configuration Files

Standard configuration files in root:
- `package.json` - Node.js project manifest
- `firebase.json` - Firebase project configuration
- `vite.config.ts` - Vite bundler configuration
- `vitest.config.unit.ts` - Vitest test configuration
- `playwright.config.ts` - E2E test configuration
```

### Verification Commands

```bash
# Check docs structure
find docs -type d | sort

# Find remaining files at docs root
ls -la docs/*.md docs/*.html 2>/dev/null

# Verify no broken links (manual)
grep -r "](.*\.md)" docs/ | head -20

# Check folder sizes
du -sh docs/*/ | sort -h
```

### References

- [Source: docs/sprint-artifacts/epic14c-refactor/epics.md] - Epic definition
- [Source: docs/README.md] - Current docs index
- [Source: docs/index.md] - Current main index

## Atlas Workflow Analysis

> This section was generated by Atlas workflow chain analysis

### Affected Workflows

- **Documentation Discovery**: Developers finding documentation will use updated index
- **Onboarding**: New developers will use updated README

### Downstream Effects to Consider

- Any external links to moved files will break (internal only - acceptable)
- Documentation indexes must be updated to avoid confusion

### Testing Implications

- **Existing tests to verify:** None (documentation only)
- **New scenarios to add:** None (documentation only)
- **Validation:** Verify all internal links work after moves

### Workflow Chain Visualization

```
[Delete duplicates] → [Move files] → [Update indexes]
                                           ↓
                             [Clean non-code folders]
                                           ↓
                             [Update root README]
```

## Code Review Fixes (2026-01-22)

### Issues Found and Fixed

| # | Severity | Issue | Fix Applied |
|---|----------|-------|-------------|
| 1 | HIGH | Broken link in `docs/index.md:268` - referenced `./tech-spec.md` which was archived | Updated link to `./archive/tech-spec-epic4.5-nov2025.md` |
| 2 | MEDIUM | Missing file deletions in Completion Notes - `run_app.local.md` and `steps_for_epics.md` not documented | Added items 6-7 to "Files Deleted" section, updated count to (7) |
| 3 | MEDIUM | Completion Notes header mismatch - "Directories Deleted (5)" listed 6 items | Updated header to "(6)" |

### Files Modified During Code Review
- `docs/index.md` - Fixed broken Epic 4.5 Tech Spec link
- `docs/sprint-artifacts/epic14c-refactor/stories/14c-refactor-24-documentation-consolidation.md` - Updated Completion Notes accuracy
