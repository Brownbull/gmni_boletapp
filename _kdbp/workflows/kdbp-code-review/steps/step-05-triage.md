# Step 05: Smart Triage

Classify each finding by effort and product stage. Let user choose handling per item or batch.

<step n="4" goal="Auto-triage findings by effort + stage, user chooses handling" tag="triage">
  <critical>SMART TRIAGE: Every finding gets effort classification + stage classification + suggested action</critical>

  <!-- Load product stage configuration -->
  <action>Load triage mode from project config (sprint-status.yaml `triage.mode` or default):
    - Mode 1 (MVP-only): In-epic = MVP. Backlog = PROD + SCALE.
    - Mode 2 (MVP+PROD): In-epic = MVP + PROD. Backlog = SCALE.
    - Mode 3 (All stages): In-epic = MVP + PROD + SCALE. Backlog = none.
    If not configured, default to Mode 1.
    Set {{triage_mode}}, {{in_epic_stages}}, {{backlog_stages}}
  </action>

  <!-- Classify each finding by effort -->
  <action>For each finding from Step 3, classify effort:

    QUICK (fix in current session):
    - Missing validation/guard clause (1-5 lines), naming fix, missing error handling (single call)
    - Missing test assertion, import cleanup, simple type fix, missing null check
    - Documentation/comment fix, single-file localized change
    - Missing integration test for a single handoff (1 test file, <50 lines)

    COMPLEX (needs separate work):
    - Multi-file refactoring, new abstraction, architectural restructuring
    - Service layer redesign, new test infrastructure, security model change
    - State management refactoring, performance optimization requiring profiling
    - Changes touching >3 files
    - Missing integration test infrastructure (emulator setup, fixture system, new test patterns) → COMPLEX/MVP
    - Multiple untested integration seams across a pipeline → COMPLEX/MVP
  </action>

  <!-- Classify each COMPLEX finding by product stage -->
  <action>For each COMPLEX finding, classify product stage (see product-stages.md):

    MVP — Feature breaks or is unsafe without this fix:
    - Required by story/epic acceptance criteria
    - Breaks user-facing functionality if missing
    - Creates safety or data integrity risk
    - Type safety preventing runtime errors in current feature

    PROD — Required for production readiness, not for feature function:
    - Rate limiting, retry logic, circuit breakers
    - Persistent storage for ephemeral state
    - Input hardening beyond basic validation
    - Monitoring, alerting, operational runbooks
    - CI/CD guards, deployment safety

    SCALE — Enterprise / growth concerns:
    - Horizontal scaling, distributed systems
    - Advanced observability, SLO dashboards
    - Compliance, multi-region, data residency
    - Performance optimization for hypothetical load
  </action>

  <action>Apply certainty-based routing to each finding:
    - HIGH certainty (H): Fix or flag immediately — no additional context needed; safe to auto-apply for QUICK findings
    - MEDIUM certainty (M): Read surrounding code/context before acting — LLM found a pattern but judgment is needed
    - LOW certainty (L): Surface to human — heuristic finding, high false-positive risk; do not auto-fix
    Note: Certainty is independent of severity. A HIGH-certainty LOW-severity finding is a safe quick fix.
    A LOW-certainty CRITICAL finding still requires human verification before acting.
  </action>

  <action>Build {{numbered_findings}}: for each finding assign index, severity, certainty, agent, description, file, effort_class, stage (MVP/PROD/SCALE), suggested_action (FIX_NOW / DEFER_EPIC / DEFER_BACKLOG)</action>
  <action>Count {{quick_count}}, {{complex_mvp_count}}, {{complex_prod_count}}, {{complex_scale_count}}, {{total_findings}}</action>

  <!-- Route COMPLEX findings based on triage mode -->
  <action>For each COMPLEX finding:
    - If stage in {{in_epic_stages}}: suggested_action = DEFER_EPIC (TD story in current epic)
    - If stage in {{backlog_stages}}: suggested_action = DEFER_BACKLOG (deferred-findings.md)
  </action>

  <action>Set {{in_epic_count}} = count of COMPLEX findings where stage in {{in_epic_stages}}
  Set {{backlog_count}} = count of COMPLEX findings where stage in {{backlog_stages}}</action>

  <ask>**Smart Triage** — {{quick_count}} quick fixes, {{in_epic_count}} in-epic deferrals, {{backlog_count}} backlog deferrals

    **Stage breakdown:**
    | Stage | Count | Action (Mode {{triage_mode}}) |
    |-------|-------|------|
    | MVP | {{complex_mvp_count}} | {{#if MVP in in_epic_stages}}TD story (in-epic){{else}}Backlog{{/if}} |
    | PROD | {{complex_prod_count}} | {{#if PROD in in_epic_stages}}TD story (in-epic){{else}}Backlog{{/if}} |
    | SCALE | {{complex_scale_count}} | {{#if SCALE in in_epic_stages}}TD story (in-epic){{else}}Backlog{{/if}} |

    1. **[Q] Quick + Defer + Postpone** — Fix all QUICK now | TD stories for in-epic ({{in_epic_stages}}) | Backlog for ({{backlog_stages}}) *(Recommended)*
    2. **[F] Fix all** — Fix everything now (only if scope fits in session)
    3. **[C] Custom** — Per-item control: `fix 1-3, defer-mvp 4, defer-prod 5, defer-scale 6, archive 7`
    4. **[S] Skip** — Mark review complete without changes

    Choose [Q], [F], [C], or [S]:</ask>

  <check if="user chooses Q">
    <action>Fix all findings where effort_class = QUICK</action>
    <action>Re-run tests after fixes</action>
    <action>Store {{test_result_post_fix}} for Test Health step</action>
    <action>Set {{fixed_items}}, {{fixed_count}}</action>
    <action>Set {{td_items}} = COMPLEX findings where stage in {{in_epic_stages}} (preserve stage tag)</action>
    <action>Set {{backlog_items}} = COMPLEX findings where stage in {{backlog_stages}} (preserve stage tag)</action>
    <output>Fixed {{fixed_count}} quick items. {{td_items | length}} deferred to TD stories (Step 6). {{backlog_items | length}} postponed to backlog.</output>
  </check>

  <check if="user chooses F">
    <action>Fix ALL findings (both QUICK and COMPLEX)</action>
    <action>Re-run tests after fixes</action>
    <action>Store {{test_result_post_fix}} for Test Health step</action>
    <action>Update File List in story</action>
    <action>Set {{fixed_count}} = total_findings</action>
  </check>

  <check if="user chooses C">
    <ask>Enter triage commands:
      - `fix 1-5` or `fix 1,3,5` — fix these items now
      - `defer-mvp 6` — TD story in current epic (MVP stage)
      - `defer-prod 7-8` — TD story in current epic or backlog (per triage mode)
      - `defer-scale 9` — TD story in current epic or backlog (per triage mode)
      - `archive 10` — dismiss finding (no story, no backlog)
      - Combine: `fix 1-3, defer-mvp 4, defer-prod 5, archive 6`
      - Shortcuts: `fix quick`, `defer in-epic`, `postpone backlog`

      Note: `defer-prod` and `defer-scale` route to in-epic or backlog based on
      triage mode (currently Mode {{triage_mode}}). Use Custom to override per item.

      Enter triage commands:</ask>
    <action>Parse ranges/lists/keywords. Map each finding index to: FIX / DEFER_EPIC (with stage) / DEFER_BACKLOG (with stage) / ARCHIVE</action>
    <action>Fix all FIX findings, re-run tests</action>
    <action>Store {{test_result_post_fix}} for Test Health step</action>
    <action>Set {{fixed_items}}, {{fixed_count}}</action>
    <action>Set {{td_items}} = DEFER_EPIC findings (with stage tag)</action>
    <action>Set {{backlog_items}} = DEFER_BACKLOG findings (with stage tag)</action>
    <action>Set {{archived_items}} = ARCHIVE findings</action>
    <output>Fixed: {{fixed_count}} | In-epic TD: {{td_items | length}} | Backlog: {{backlog_items | length}} | Archived: {{archived_items | length}}</output>
  </check>

  <check if="user chooses S">
    <output>Review marked complete without changes.</output>
  </check>

</step>
