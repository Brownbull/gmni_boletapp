# Documentation Consolidation Plan (v3 — post solo-founder review)

**Status:** APPROVED — ready for execution
**Date:** 2026-04-02
**Scope:** 4 phases — Archive, Consolidate (KDBP canonical), Sync, Simplify
**Risk:** Medium (documentation + workflow config, no source code)
**Estimated:** 1-2 sessions

---

## Why Now, Not Later

The solo-founder reviewer asked: "is this worth it when features are waiting?"

Yes, because documentation debt compounds differently than code debt. Code debt slows you down linearly — you write slower. Documentation debt causes **wrong decisions**: Claude loads stale context, references patterns from a removed feature, sizes stories against outdated limits, or misses the scan-fix-handoff because MEMORY.md truncated it. Every wrong decision costs a full correction cycle (1-3 sessions). We've already burned sessions on this — the scan pipeline emergency fixes were partly caused by stale state management docs leading to wrong architectural assumptions.

The investment: 1-2 sessions. The payoff: every future session starts with accurate context. At 5+ sessions/week for the remaining 3 epics (~15-20 sessions), even 10 minutes saved per session = 3+ hours recovered. More importantly: zero sessions lost to decisions made from stale docs.

**After this plan: go fix scan delivery, then ship statement scanning.**

---

## Architectural Decision: KDBP is Canonical

**Decision:** KDBP is canonical for knowledge and hooks. ECC workflows remain active but consume KDBP knowledge.

This is NOT a hybrid — it's a clean separation:
- **KDBP** owns: hooks (runtime guards), knowledge files (patterns, checklists)
- **ECC** owns: workflow orchestration (step sequences, agent spawning, slash commands)
- **Both reference the same knowledge** — one source of truth, no divergence

| Layer | Owner | Path |
|-------|-------|------|
| Hooks | KDBP | `_kdbp/hooks/` |
| Knowledge | KDBP | `_kdbp/knowledge/` |
| Workflows | ECC | `_ecc/workflows/` |
| Rules | Project | `.claude/rules/` |
| Commands | ECC | `.claude/commands/ecc-*` |

---

## Success Criteria

1. MEMORY.md under 150 lines, all Epic 18 entries intact
2. Zero `_ecc/knowledge/` references in active workflow/config paths
3. `_ecc/setup.sh` cannot silently overwrite KDBP hooks
4. `sprint-status.yaml` reflects Epic 18 progress
5. CLAUDE.md References: zero broken paths
6. MEMORY.md has retention policy to prevent future overflow

---

## Phase 1: Clean Dead Weight

### Task 1.1: Archive superseded ADRs
- Move `docs/architecture/decisions/ADR-021-*` → `docs/archive/decisions/`
- Move `docs/architecture/decisions/ADR-022-*` → `docs/archive/decisions/`
- Both already have SUPERSEDED headers. Create `docs/archive/decisions/` if needed.

### Task 1.2: Audit copilot workflows
- These are NOT empty (500+ lines each) — audit before any action
- Check: `grep -rE "(bmad-check-readiness|bmad-create-architecture|bmad-create-epics|ecc-dev-story)-copilot" .claude/commands/ CLAUDE.md`
- Check git log for invocations
- **If unused:** Archive to `_ecc/workflows/_archived/` + remove corresponding `.claude/commands/` entries
- **If used:** Leave in place, update knowledge refs in Phase 2
- Delete `_ecc/knowledge/code-review-patterns.md.pre-deploy` (confirmed stale backup)

### Task 1.3: Trim MEMORY.md
- **Backup first:** `cp MEMORY.md MEMORY.md.bak-2026-04-02`
- **Protected (DO NOT TOUCH):** All Epic 18 entries, Epic 19 review, scan-fix-handoff, navigation restructure, testing plans, UX consistency, scan workflow restructuring, key patterns, workflow improvement backlog
- **Delete outright** (completed, git has history):
  - Shared Groups Removal (completed 2026-02-09)
  - Epic 15 Codebase Refactoring (done, metrics in docs/)
  - Epic 15b Continued Refactoring (done, metrics in docs/)
  - Implementation Runbook (all complete 2026-02-05)
  - Atlas Migration (completed 2026-02-05)
  - Architecture Docs Cleanup (completed one-time)
  - Workflow Files Updated During Migration (completed one-time)
  - Branching Divergence Incident (resolved, rules in CLAUDE.md)
  - Insights Report Improvements (completed, changes in the files)
- **Condense to 1 line each:**
  - Story Sizing → "Opus 4.6 limits: 8 tasks / 40 subtasks / 12 files"
  - Cozempic → "cozempic v0.7.0 — session pruning. Toggle: `_ecc/tools/cozempic-toggle.sh`"
  - dust/CLI → "dust v1.2.4 at ~/.local/bin/dust — directory size analysis"
  - ast-grep → "ast-grep v0.40.5 via npm. Skill: `.claude/skills/ast-grep/`"
  - Effort level → "CLAUDE_CODE_EFFORT_LEVEL=high in global ~/.claude/settings.json"
- Delete `memory/epic18-architecture-plan-v3.md` and `memory/epic18-architecture-plan-v4.md` (superseded by v5)
- **Add retention policy header:**
  ```
  Retention: 1 line per completed epic (dates + key lesson only). 1 line per tool.
  Delete stale entries — git preserves history. Protect active epic entries.
  ```
- Target: under 150 lines

### Task 1.4: Archive stale sprint artifacts
- Move `docs/sprint-artifacts/sprint-status_epics1to13.yaml` → `docs/archive/`

**Phase 1 verification:**
- `grep -rE "ADR-021|ADR-022" docs/architecture/decisions/` → 0 matches
- `wc -l MEMORY.md` < 150
- All Epic 18 memory entries present (grep for "Epic 18", "scan-fix", "architecture-plan-v5")
- `memory/epic18-architecture-plan-v3.md` and v4 gone

---

## Phase 2: KDBP Knowledge Canonical

### Task 2.1: Content-verify then merge knowledge files

**Critical finding from content diff:**
- `hardening-patterns.md`: Section headers MATCH exactly between ECC (151L) and KDBP (163L). **Safe to migrate.**
- `code-review-patterns.md`: KDBP has new Section 8 "Single Source of Truth (SSoT)" that shifts numbering. ECC has 243 lines, KDBP has 277 lines (+34). All original sections preserved, just renumbered.

**Impact on workflows:** ECC workflow steps reference "Pattern 9" and "Integration Seam Coverage" in comments (lines like `<!-- Pipeline context for integration seam checks (Pattern 9) -->`). These are informational comments, not programmatic lookups. The actual content matching is by pattern text, not section numbers. **Risk: LOW.**

**Action:**
- Diff both files, confirm KDBP is a superset (no ECC-only content lost)
- Update "Pattern 9" comment references in workflow steps to "Pattern 9" (content unchanged, just the section before it is new) — optional but clean
- Delete ECC copies after confirming KDBP is complete. No symlinks.
- **Files touched:** 0-2 KDBP (if merge needed), 2 ECC deleted

### Task 2.2: Update all ECC workflow references
- Find-replace `_ecc/knowledge/` → `_kdbp/knowledge/` across 18 files:

**Workflow YAMLs (7):**
1. `_ecc/workflows/deploy-story/workflow.yaml`
2. `_ecc/workflows/ecc-create-story/workflow.yaml`
3. `_ecc/workflows/ecc-dev-story-copilot/workflow.yaml`
4. `_ecc/workflows/ecc-dev-story/workflow.yaml`
5. `_ecc/workflows/ecc-code-review/workflow.yaml`
6. `_ecc/workflows/ecc-create-epics-and-stories/workflow.yaml`
7. `_ecc/workflows/story-sizing/workflow.yaml`

**Workflow step docs (7):**
8. `_ecc/workflows/deploy-story/steps/step-01-validation.md`
9. `_ecc/workflows/ecc-create-story/steps/step-00-knowledge.md`
10. `_ecc/workflows/ecc-dev-story-copilot/instructions.xml`
11. `_ecc/workflows/story-sizing/steps/step-00-knowledge.md`
12. `_ecc/workflows/ecc-code-review/steps/step-00-knowledge.md`
13. `_ecc/workflows/ecc-dev-story/steps/step-00-knowledge.md`
14. `_ecc/workflows/ecc-create-epics-and-stories/steps/step-00-knowledge.md`

**Rules & config (4):**
15. `_ecc/rules/workflow.md`
16. `_ecc/rules/security.md`
17. `_ecc/config/learning-config.yaml`
18. `_bmad/bmm/config/learning-config.yaml`

### Task 2.3: Update CLAUDE.md (same commit — no broken-reference window)
- CLAUDE.md References: `_ecc/knowledge/code-review-patterns.md` → `_kdbp/knowledge/code-review-patterns.md`
- Verify all other paths resolve

### Task 2.4: Defuse setup.sh
- `_ecc/setup.sh` line 32 copies `_ecc/config/settings.json` → `.claude/settings.json`, overwriting KDBP hooks with dead ECC paths
- **Fix:** Update `_ecc/config/settings.json` to mirror current `.claude/settings.json` (KDBP hook paths)
- This keeps setup.sh functional (still copies commands, rules, learning config) without breaking hooks

### Task 2.5: Archive dead ECC hooks
- Move `_ecc/hooks/*` → `_ecc/hooks/_archived/`
- Dead since KDBP migration — archiving makes this explicit

### Task 2.6: Consolidate Epic 19 mockup specs
- Diff `EPIC-19-MOCKUP-SCREENS.md` vs `EPIC-19-MOCKUP-SPECS.md`
- Merge or mark one as canonical with pointer from the other

**Phase 2 verification:**
- `grep -rE "_ecc/knowledge/" _ecc/workflows/ _ecc/rules/ _ecc/config/ _bmad/bmm/config/ CLAUDE.md` → 0 matches
- Smoke test file chain: `.claude/commands/ecc-dev-story.md` → `_ecc/workflows/ecc-dev-story/workflow.yaml` → `_kdbp/knowledge/code-review-patterns.md` (all exist, all readable)
- `_ecc/config/settings.json` hooks point to `_kdbp/hooks/`
- `_ecc/knowledge/` directory is empty (or only has _archived backup)

---

## Phase 3: Sync to Current Reality

### Task 3.1: Update sprint-status.yaml
- Mark completed Epic 18 stories: TD-18-4 through TD-18-12, 18-8, 18-13a, 18-13b
- Mark remaining with status (drafted/blocked/in-progress)
- Add scan delivery bug as active blocker
- Story statuses from: git log + MEMORY.md scan-fix-handoff + story files (not git alone)
- Mark Epics 15/15b as COMPLETED

### Task 3.2: Tag deferred-findings.md
- Add triage header with date stamp
- Quick scan: mark obviously-fixed findings (check git log)
- Tag rest as "NEEDS-TRIAGE — next Epic 18 dev session"
- Full triage deferred to when technical context is loaded

### Task 3.3: Update docs/index.md
- Reflect current state: Epic 18 in progress, 19/20 backlog
- Add decision docs (Plan A, Plan B, this consolidation plan)
- Fix architecture doc paths (proposals/implemented/)
- Note KDBP canonical for knowledge

### Task 3.4: Grep architecture docs for stale references
- `grep -rE "shared.group|group.*feature" docs/architecture/*.md`
- Fix refs to removed features. Allow Epic 19 forward-looking refs.

**Phase 3 verification:**
- sprint-status.yaml has all completed Epic 18 stories
- deferred-findings.md has triage header
- docs/index.md links resolve to existing files

---

## Phase 4: Prevention

**Goal:** Prevent this from happening again — not tracking, but structural guardrails.

### Task 4.1: Final MEMORY.md pass
- Verify consolidation outcomes reflected
- Verify under 150 lines
- Retention policy header in place

### Task 4.2: Add consolidation outcome to MEMORY.md
- One entry documenting:
  - KDBP canonical decision (hooks + knowledge)
  - ECC workflows reference _kdbp/knowledge/ (not _ecc/)
  - setup.sh defused
  - Retention policy: delete stale, don't archive

**Phase 4 verification:**
- MEMORY.md under 150 lines with retention policy header
- No new tracking files created (nothing that will go stale)

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| ECC workflow breaks after path update | High | Mechanical find-replace on verified paths; smoke test |
| setup.sh trap overwrites KDBP hooks | High | Task 2.4 defuses it |
| MEMORY.md loses Epic 18 context | High | Backup + explicit protection list |
| Knowledge content mismatch after migration | Medium | Task 2.1: content-level diff before delete |
| Sprint status misrepresents story state | Medium | Cross-ref git + MEMORY.md + story files |
| Copilot workflows deleted when used | Medium | Task 1.2: audit first, archive (not delete) |

## Execution

```
Phase 1 → commit "Archive stale docs, trim memory to <150 lines"
Phase 2 → commit "KDBP canonical: migrate knowledge, defuse setup.sh, archive dead hooks"
Phase 3 → commit "Sync sprint status and docs to current state"
Phase 4 → commit "Final memory pass with retention policy"
```

Phase 2 must be atomic: all 18 file updates + CLAUDE.md + setup.sh + hook archival in one commit.

## Adversarial Findings Resolution

| Finding | Resolution |
|---------|-----------|
| ADV-001: "Empty stubs" are 2,278 lines | Audit-first, archive not delete |
| ADV-002: setup.sh trap | Defuse by updating _ecc/config/settings.json |
| ADV-003: CLAUDE.md broken between phases | Moved to Phase 2 same commit |
| ADV-004: 20+ workflow files break | All 18 files updated with exact paths |
| ADV-005: Incoherent hybrid | Clean separation: KDBP=knowledge, ECC=orchestration |
| ADV-006: MEMORY.md loses Epic 18 | Explicit protection list + backup |
| ADV-007: Wrong grep regex | All use `grep -rE` |
| ADV-008: Sprint from git alone insufficient | Cross-ref multiple sources |
| ADV-009: MEMORY.md no git rollback | Backup before trimming |
| ADV-010: Shallow findings triage | Lightweight tag, defer deep triage |
| ADV-011: Symlinks on WSL2 | No symlinks, delete + path update |
| SF-001: Plan is its own disease | Tightened from 327→~250 lines, 2-3→1-2 sessions |
| SF-002: Phase 2 is infra migration | Yes. That's the point. Misaligned infra IS the debt. |
| SF-006: Hybrid worse than parallel | Reframed: one knowledge source, clean ownership table |
| SF-007: Content mismatch risk | Task 2.1 adds content-level diff + section header verification |

## Scoped Out

- **ECC→KDBP workflow unification** — separate epic, this plan makes it easier
- **Deep deferred-findings triage** — next Epic 18 dev session
- **`.claude/rules/` divergence from `_ecc/rules/`** — deferred to workflow unification
- **Command directory cleanup** (101 files in .claude/commands/) — usage audit needed
