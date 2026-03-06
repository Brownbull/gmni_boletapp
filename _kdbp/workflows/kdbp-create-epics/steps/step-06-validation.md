# Step 06: Final Validation

ALL validations must pass before finalization. USER GATE: final approval.

<step n="5" goal="Validate completeness and readiness for development" tag="final-validation">

  <action>Run validation checklist:
    1. **FR Coverage** — every FR from PRD mapped to at least one story
       - Check {{fr_coverage_map}} for unmapped FRs -> {{fr_coverage_status}} = PASS/FAIL
    2. **NFR Coverage** — every NFR addressed in relevant story ACs
       -> {{nfr_coverage_status}} = PASS/FAIL
    3. **Sizing Compliance** — no story exceeds TOO_LARGE threshold
       - Check: >8 tasks OR >40 subtasks OR >12 files -> {{sizing_status}} = PASS/FAIL
    4. **Dependency Check** — no forward dependencies within epics
       -> {{dependency_status}} = PASS/FAIL
    5. **Epic Independence** — each epic delivers complete user value
       -> {{epic_independence_status}} = PASS/FAIL
    6. **Hardening Coverage** — every story with risk surface has hardening
       -> {{hardening_coverage_status}} = PASS/FAIL
    7. **Story Files** — all approved stories have files in {story_dir}
       -> {{story_files_status}} = PASS/FAIL
    8. **Story Format** — all story files have required sections
       (Functional ACs, Architectural ACs, File Spec, Tasks/Subtasks, Dev Notes)
       -> {{story_format_status}} = PASS/FAIL</action>

  <output>**Final Validation Report**

    | Check | Status |
    |-------|--------|
    | FR Coverage ({{fr_count}}/{{fr_count}}) | {{fr_coverage_status}} |
    | NFR Coverage ({{nfr_count}}/{{nfr_count}}) | {{nfr_coverage_status}} |
    | Sizing Compliance | {{sizing_status}} |
    | Dependency Check | {{dependency_status}} |
    | Epic Independence | {{epic_independence_status}} |
    | Hardening Coverage | {{hardening_coverage_status}} |
    | Story Files | {{story_files_status}} |
    | Story Format | {{story_format_status}} |

    **Summary:**
    - Total Epics: {{epic_count}}
    - Total Stories: {{total_story_count}} ({{user_story_count}} user + {{hardening_story_count}} hardening)
    - Hardening Multiplier: {{actual_multiplier}}x (target: <1.3x)
    - Estimated Total Points: {{total_points}}</output>

  <check if="any validation FAIL">
    <output>**Validation Failures Detected:**
      {{validation_failures}}
      These must be resolved before proceeding.</output>
    <ask>How would you like to resolve these failures?</ask>
  </check>

  <check if="all validations PASS">
    <ask>All validations pass. Approve for development?
      - [A] Approve — finalize all files and update sprint status
      - [R] Revise — go back and modify specific stories</ask>
  </check>
</step>
