# Dependency Map: boletapp-dev

Version: 1.1.0
Last updated: 2026-03-13
Source: Epic 17 alignment check (first population)

## Value → Workflow Linkage

| Value | Handle | Workflow Steps | Alignment Test | Skills |
|-------|--------|---------------|----------------|--------|
| V1 | "Can they see the items, not just the total?" | kdbp-create-epics (taxonomy stories), ecc-dev-story (constants/types, UI labels), ecc-code-review (category display verification) | Can the user identify individual items by name and category in their language? | — |
| V2 | "Would you bet money on this number?" | ecc-dev-story (normalizer tests, migration safety, store quality), ecc-code-review (test coverage enforcement) | Are all data transformations tested? Is the migration idempotent and dry-run-first? | — |
| V3 | "Your money story is yours to tell" | kdbp-prd (won't-have decisions), deploy-story (Firestore rules) | Does this feature expose user data to anyone the user didn't choose? | — |
| V4 | "Detect the black holes, don't judge them" | kdbp-create-epics (taxonomy naming), ecc-dev-story (category design) | Does any category name, label, or grouping apply moral judgment to a spending pattern? | — |
| V5 | "Easier than the receipt drawer" | ecc-dev-story (scan workflow, auto-categorization, normalizer), ecc-code-review (friction check) | Does this change add a step, a wait, or a decision the user didn't have before? | critical-path-regression-guard |
| V7 | "Where does OUR money go?" | kdbp-create-epics (shared taxonomy, group epic scoping) | Does the shared vocabulary let group members understand each other's entries? | — |

## Orphan Analysis

| Type | Description | Count | Items |
|------|-------------|-------|-------|
| Type 2 | Steps with no value ground (BLOCKED) | 0 | — |
| Type 3 | Values with no linked steps (orphan) | 0 | All 6 values linked |

## Resolutions

| Date | Value | Decision | Rationale |
|------|-------|----------|-----------|
| 2026-03-10 | V4 | "Vicios" accepted | User self-categorization — dedicated category detects spending black holes (V1+V4). Hiding in "Otros" makes patterns invisible. The judgment is the user's, not the app's. |

## Skills

| Skill | Value | File | Created | Origin |
|-------|-------|------|---------|--------|
| v5-e2e-awareness | V5 | skills/v5-e2e-awareness.md | 2026-03-13 | Story 16-3 regression (scan happy path broken 7 days). Evolved: tiered test registry + coverage map. |
