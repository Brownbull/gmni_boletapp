# Gastify Rebuild Documentation

This folder holds all documentation for the **Gastify** full-stack rebuild — moving the current BoletApp prototype (React + Firebase + Cloud Functions + Firestore) to a production-grade stack (FastAPI + PostgreSQL + React + TypeScript).

## Contents

| File | Purpose |
|---|---|
| [`ultraplan-rebuild-prompt.md`](ultraplan-rebuild-prompt.md) | The prompt to paste into `/ultraplan` — describes what to build. Incorporates all 16 architecture decisions. |
| [`ADR-2026-04-20-REBUILD-STACK.md`](ADR-2026-04-20-REBUILD-STACK.md) | The "why" behind each technology choice. 16 decisions with analogies, constraint boxes, options considered, and revisit triggers. |
| [`UX-PLAN.md`](UX-PLAN.md) | Phase-0 UX execution pipeline (7 phases, ~2 weeks). Resolves 17 UX gaps. Produces a Claude Code handoff bundle that the ultraplan implementation consumes. |
| `ux/` _(created in Phase U0)_ | All UX artifacts: `USER-JOURNEYS.md`, `IA.md`, `wireframes/`, `COMPONENTS.md`, `mockups/`, `INTERACTIONS.md`, `A11Y-CHECKLIST.md`, `handoff/`. |

## Workflow

1. **Read the ADR first** to understand why each choice was made. Each decision has a physical-system analogy to anchor the trade-off.
2. **Run adversarial roasts** before sending the prompt to `/ultraplan`:
   - ✅ `/gabe-roast architect` — completed 2026-04-20 (13 gaps → ADR D1-D13)
   - ✅ `/gabe-roast ux-designer` — completed 2026-04-20 (17 gaps → UX-PLAN Section 1 + ADR D14-D16)
   - Future passes (optional): domain expert, security auditor, QA/testing lead
3. **Apply roast outcomes** back into the prompt + ADR + UX-PLAN before handing off.
4. **Execute Phase 0 (UX)** per `UX-PLAN.md`. Produces `docs/rebuild/ux/handoff/`.
5. **Send prompt to `/ultraplan`** — it consumes the UX handoff bundle + this prompt + the ADR to generate the implementation plan.

## Naming Convention

- `ADR-YYYY-MM-DD-<topic>.md` — dated architecture decision records scoped to the rebuild
- Other future docs go here too (implementation plan, migration runbook, cutover checklist, post-mortem, etc.)

## Related

- Current codebase: root of this repo — serves as a reference for behavior to preserve, not a blueprint to copy
- Current architecture reference: [`docs/architecture/`](../architecture/) (Firestore schema, Cloud Functions, scan pipeline) — useful for understanding what needs to be translated
- Project-wide ADR convention: [`docs/decisions/TEMPLATE.md`](../decisions/TEMPLATE.md) — the rebuild ADR intentionally deviates (single umbrella ADR with 13 sub-decisions) because the decisions are interdependent foundation choices
