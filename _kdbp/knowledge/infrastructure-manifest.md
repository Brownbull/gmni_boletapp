# Infrastructure Manifest

> Defines required infrastructure files per directory type.
> Used by: `pre-write-guard.py` (P1 — Missing Infrastructure)
> Value: Structural Humility — "Built the house, forgot the plumbing"

---

## Directory Types and Required Files

### `workflows/{name}/steps/` directory
A workflow steps directory MUST contain:
- `step-00-behavior-load.md` OR `step-00-preflight.md` — bookend opening (DBP load or preflight)

### `behaviors/trajectory/` directory
MUST contain:
- `PROJECT.md` — project values and value resolution order
- `ledger.md` — session logbook

### `src/features/{name}/` directory (FSD pattern)
MUST contain:
- `index.ts` or `index.tsx` — barrel export for the feature module

### `docs/decisions/` directory
MUST contain at least one `.md` file (not TEMPLATE.md) before any `src/` files are created.

### `_kdbp/knowledge/` directory
SHOULD contain at least one substantive `.md` file. *(Documentation only — not enforced by hook.)*

### Any new directory with files
SHOULD contain `.gitkeep` if empty, or a README/index if populated.

---

## Enforcement

- **Tier 1 (Hook):** `pre-write-guard.py` checks FSD barrel, workflow bookend, trajectory, and ADR rules on new file creation.
- **Tier 2 (Script):** `post-session-refs.py` detects orphaned path references in changed files (called from step-06).
- **Tier 2 (Workflow):** Architecture steps reference this manifest when designing new directory structures.
- Directory types not listed here: no infrastructure requirements enforced.
