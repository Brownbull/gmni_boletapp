# Step 08: Validate — Smoke Test + Behavioral Health

Verify all implemented gates work, no file size violations introduced, no broken step references.

<step n="8" goal="Validate: smoke test + behavioral health snapshot" tag="validate">

  <!-- CHECK 1: File size constraints -->
  <action>Find all files in _template/_ecc/workflows/ and _template/hooks/:
    Count lines in each. Flag any file >200 lines -> {{violations}}</action>

  <check if="{{violations}} is not empty">
    <output>**FILE SIZE VIOLATIONS:**
      {{violations}}
      These exceed the 200-line constraint from Path B migration.
      Fix before deploying — oversized files are the pattern we're trying to prevent.</output>
    <ask>Fix violations now? [Y] or mark as known exception with reason? [N + reason]</ask>
  </check>

  <!-- CHECK 2: Reference integrity -->
  <action>For each instructions.xml in _template/_ecc/workflows/:
    Extract all step-file references (steps/step-XX-*.md).
    Verify each file exists -> {{missing_steps}}</action>

  <check if="{{missing_steps}} is not empty">
    <output>**MISSING STEP FILES:**
      {{missing_steps}}
      Referenced in router files but do not exist on disk.
      These will cause workflow execution failures.</output>
    <ask>Create missing files or fix references? [describe fix]</ask>
  </check>

  <!-- CHECK 3: Behavioral health post-implementation -->
  <action>Run: bash scripts/behavioral-health-snapshot.sh {{target_project_path}}
    Capture output -> {{post_health_snapshot}}</action>

  <!-- CHECK 4: Gate smoke test — verify new gates produce expected output -->
  <action>For each newly implemented FF-A hook:
    Simulate a trigger condition (e.g., edit a file that exceeds line limit).
    Verify hook exits with expected code (0/1/2).</action>

  <output>**Validation Results**

    **File size check:** {{violations | count}} violations (target: 0)
    **Reference integrity:** {{missing_steps | count}} broken refs (target: 0)
    **Gate smoke tests:** {{gate_tests_passed}} / {{gate_tests_total}} passed

    **Behavioral Health (post-implementation):**
    {{post_health_snapshot}}

    **Template clean:** {{violations | count == 0 AND missing_steps | count == 0}}</output>

  <check if="any validation failed">
    <ask>Resolve the issues above before deploying.
      Describe what needs to be fixed, or explain why an exception is acceptable.</ask>
  </check>

  <output>**Validation passed.** Proceeding to Step 9: Deploy.</output>

</step>
