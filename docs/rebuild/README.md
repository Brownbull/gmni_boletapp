# Gastify Rebuild Documentation

This folder holds all documentation for the **Gastify** full-stack rebuild — moving the current BoletApp prototype (React + Firebase + Cloud Functions + Firestore) to a production-grade stack (FastAPI + PostgreSQL + React + TypeScript).

## Contents

| File | Purpose |
|---|---|
| [`ultraplan-rebuild-prompt.md`](ultraplan-rebuild-prompt.md) | The prompt to paste into `/ultraplan` — describes what to build, structured as two parallel workstreams + integration + cutover. Incorporates all 18 architecture decisions. |
| [`ADR-2026-04-20-REBUILD-STACK.md`](ADR-2026-04-20-REBUILD-STACK.md) | The "why" behind each technology choice. 18 decisions with analogies, constraint boxes, options considered, and revisit triggers. |
| [`UX-PLAN.md`](UX-PLAN.md) | Workstream A — 7-phase UX execution pipeline (~2 weeks). Resolves 17 UX gaps. Produces a Claude Code handoff bundle consumed by the Integration phase. |
| `ux/` _(created in Phase U0)_ | All UX artifacts: `USER-JOURNEYS.md`, `IA.md`, `wireframes/`, `COMPONENTS.md`, `mockups/`, `INTERACTIONS.md`, `A11Y-CHECKLIST.md`, `handoff/`. |

## Workflow

1. **Read the ADR first** to understand why each choice was made. Each decision has a physical-system analogy to anchor the trade-off.
2. **Adversarial roasts** before sending the prompt to `/ultraplan`:
   - ✅ `/gabe-roast architect` — completed 2026-04-20 (13 gaps → ADR D1–D13)
   - ✅ `/gabe-roast ux-designer` — completed 2026-04-20 (17 gaps → UX-PLAN Section 1 + ADR D14–D16)
   - ✅ Domain clarifications resolved 2026-04-20 — no UF / no RUT / IVA via TaxFees → ADR D17
   - Future passes (optional): security auditor, QA/testing lead
3. **Run `/ultraplan`** with `ultraplan-rebuild-prompt.md` as the input. It produces a phased implementation plan structured as two parallel workstreams + Integration + Cutover.
4. **Execute the plan** per the workstreams:
   - **Workstream A (UX):** follow `UX-PLAN.md` phases U0–U7 → handoff bundle in `docs/rebuild/ux/handoff/`
   - **Workstream B (Backend):** scaffold FastAPI, build DB + auth + scan pipeline + APIs, validate via simulated frontend payloads (pytest + OpenAPI + sandbox-mode Gemini)
   - A and B run in parallel after initial scaffolding
5. **Integration phase** — consume UX handoff + working backend; build real frontend; wire up SSE; E2E tests
6. **Cutover** — production migration per the Cutover Plan section of the prompt

## Naming Convention

- `ADR-YYYY-MM-DD-<topic>.md` — dated architecture decision records scoped to the rebuild
- Other future docs go here too (implementation plan, migration runbook, cutover checklist, post-mortem, etc.)

## Related

- Current codebase: root of this repo — serves as a reference for behavior to preserve, not a blueprint to copy
- Current architecture reference: [`docs/architecture/`](../architecture/) (Firestore schema, Cloud Functions, scan pipeline) — useful for understanding what needs to be translated
- Project-wide ADR convention: [`docs/decisions/TEMPLATE.md`](../decisions/TEMPLATE.md) — the rebuild ADR intentionally deviates (single umbrella ADR with 13 sub-decisions) because the decisions are interdependent foundation choices
