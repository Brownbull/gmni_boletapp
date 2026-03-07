# Story 16-4: Move scanStateMachine.ts Into Feature & Extract Shared Types

## Status: review

## Intent
**Epic Handle:** "Untangle the wires, open the test door"
**Story Handle:** "This story untangles the wires by putting type definitions where they belong -- inside the feature or explicitly shared"

## Story
As a developer, I want scan types co-located with the scan feature and shared types exported from shared/, so that import boundaries are clean.

## Acceptance Criteria

### Functional
- **AC-1:** Given `src/types/scanStateMachine.ts` (528 lines) exists outside the feature, when moved, then scan-internal types live in `features/scan/types/`
- **AC-2:** Given batch-review and transaction-editor need `ScanPhase`, `ScanMode`, `BatchReceipt`, `BatchProgress`, when extracted, then shared types live in `shared/types/scanWorkflow.ts`
- **AC-3:** Given all consumer imports update, when build runs, then zero TypeScript errors
- **AC-4:** Given barrel re-exports are set up, when consumers import from `@shared/types`, then shared scan types are available

### Architectural
- **AC-ARCH-LOC-1:** Scan-internal types at `src/features/scan/types/scanStateMachine.ts`
- **AC-ARCH-LOC-2:** Shared workflow types at `src/shared/types/scanWorkflow.ts`
- **AC-ARCH-PATTERN-1:** Feature barrel `src/features/scan/types/index.ts` exports internal types
- **AC-ARCH-PATTERN-2:** Shared barrel `src/shared/types/index.ts` exports shared types
- **AC-ARCH-NO-1:** No types that are only used by scan remain in `shared/types/`
- **AC-ARCH-NO-2:** No files remain in `src/types/scanStateMachine.ts` after move

## File Specification

| File/Component | EXACT Path | Pattern Reference | Status |
|----------------|------------|-------------------|--------|
| Original type file | `src/types/scanStateMachine.ts` | — | DELETED (moved) |
| Scan-internal types | `src/features/scan/types/scanStateMachine.ts` | FSD types | NEW |
| Scan types barrel | `src/features/scan/types/index.ts` | FSD barrel | NEW |
| Shared workflow types | `src/shared/types/scanWorkflow.ts` | Shared types | NEW |
| Shared types barrel | `src/shared/types/index.ts` | Shared barrel | NEW or MODIFIED |
| Consumer imports (~8 files) | Various | — | MODIFIED (import path only) |

## Tasks

### Task 1: Analyze Type Usage (2 subtasks)
- [x] 1.1: Grep all imports from `@/types/scanStateMachine` or `src/types/scanStateMachine` — catalog every consumer
- [x] 1.2: Classify each type as scan-internal (only imported by scan feature) or shared (imported by batch-review, transaction-editor, or app layer)

### Task 2: Create Shared Types File (2 subtasks)
- [x] 2.1: Create `src/shared/types/scanWorkflow.ts` with shared types: `ScanPhase`, `ScanMode`, `BatchReceipt`, `BatchProgress`, `ScanState` (interface for shared reads)
- [x] 2.2: Create or update `src/shared/types/index.ts` barrel to export shared scan types

### Task 3: Move Scan-Internal Types (2 subtasks)
- [x] 3.1: Create `src/features/scan/types/scanStateMachine.ts` with remaining scan-internal types
- [x] 3.2: Create `src/features/scan/types/index.ts` barrel, update feature barrel to re-export types

### Task 4: Update Consumer Imports (3 subtasks)
- [x] 4.1: Update scan feature imports to use local types path
- [x] 4.2: Update batch-review, transaction-editor imports to use `@shared/types/scanWorkflow`
- [x] 4.3: Update app layer imports (useScanWorkflowOrchestrator, etc.)

### Task 5: Delete Original and Verify (2 subtasks)
- [x] 5.1: Delete `src/types/scanStateMachine.ts`
- [x] 5.2: Run `npx tsc --noEmit` and `npm run test:quick` — zero errors

## Sizing
- **Points:** 3 (MEDIUM)
- **Tasks:** 5
- **Subtasks:** 11
- **Files:** ~8

## Dependencies
- None (independent of 16-1/16-2 chain — can run in parallel)

## Risk Flags
- None

## Dev Notes
- The 528-line file is mostly type definitions and enums — no runtime code. The move is purely organizational.
- Key shared types to extract: `ScanPhase`, `ScanMode`, `BatchReceipt`, `BatchProgress`, `ScanResult`
- Key scan-internal types: dialog enums, credit-specific types, overlay types, scan request types
- Some types may need to stay in both places (re-exported from feature barrel for backward compatibility). Prefer a clean break — update all consumers.
- Complexity Growth Accepted 2026-03-06: story estimated ~8 files, actual ~48 (28 src + 18 test + 2 new). All growth is mechanical import path changes. Low risk.
- Scan-internal types file re-exports shared types for backward compatibility. Feature barrel does NOT `export * from './types'` to avoid TS2308 duplicate export conflicts with store re-exports.

<!-- CITED: none -->
<!-- INTENT: aligned -->
<!-- ORDERING: clean -->
