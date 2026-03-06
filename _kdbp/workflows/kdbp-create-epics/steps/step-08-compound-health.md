# Step 08: Compound Health Check

Run behavioral health snapshot after epic creation. Silent if healthy. Generates correction story if 2+ signals trigger.

<step n="7" goal="Behavioral health snapshot and correction story injection" tag="compound-health">

  <!-- FF-C: Run after every epic close. Watches 3 signals: churn, LOC, fix:feat ratio. -->
  <!-- Glass cockpit: silent when healthy, alarm when falling. -->

  <check if="docs/behavioral-health/ exists in project root">

    <action>Identify the epic just created: {{current_epic_label}} (e.g. "epic-01").</action>
    <action>Identify the repo root path: {{repo_root}}.</action>

    <action>Run the behavioral health snapshot:
      bash scripts/behavioral-health-snapshot.sh {{repo_root}} {{current_epic_label}}

      Capture exit code: {{health_exit_code}}
      - 0 = healthy (silent, auto-proceed)
      - 1 = 1 warning (display report, continue)
      - 2 = 2+ warnings (ALERT — inject correction story)</action>

    <check if="{{health_exit_code}} == 0">
      <output>Behavioral health: ✓ All signals healthy. No correction needed.</output>
    </check>

    <check if="{{health_exit_code}} == 1">
      <output>**⚠️  BEHAVIORAL HEALTH WARNING**

        One signal exceeded threshold. Review:
        docs/behavioral-health/compound-reports/{{current_epic_label}}.md

        No correction story required. Monitor next epic.</output>
    </check>

    <check if="{{health_exit_code}} == 2">
      <output>**🚨 BEHAVIORAL HEALTH ALERT**

        2+ signals exceeded threshold. A correction story is required.
        Review: docs/behavioral-health/compound-reports/{{current_epic_label}}.md

        **Injecting correction story into next epic backlog:**

        Story: "Health: Behavioral correction for {{current_epic_label}}"
        Type: hardening
        Priority: high (add to top of next epic)

        Tasks based on signals triggered:
        - C1 spike → "Refactor: extract [gravity-well file] into smaller modules"
        - C2 spike → "Consolidation: audit and compress duplicate patterns from recent epics"
        - C3 spike × 2 → "Scope review: decompose large stories to reduce fix churn"

        BoletApp evidence: Epic 15 (cleanup) consumed 15-20% of total cost because
        no behavioral correction ran between Epics 1-14.</output>
      <action>Add correction story to {{sprint_status}} as "drafted", priority high.</action>
      <ask>Confirm correction story added. Ready to finalize?</ask>
    </check>

  </check>

  <check if="docs/behavioral-health/ does NOT exist">
    <output>**Behavioral health folder not found.**

      Initialize once per project:
        cp -r _template/docs/behavioral-health/ docs/behavioral-health/

      After initialization, this step runs automatically each epic.
      First snapshot will establish baseline — no signals fire until Epic 2.</output>
    <ask>Create docs/behavioral-health/ now? [Y] create / [N] skip this epic</ask>
  </check>

</step>
