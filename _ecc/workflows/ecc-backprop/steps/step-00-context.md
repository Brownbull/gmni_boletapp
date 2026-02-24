# Step 00: Context Init — Load State & Check Phase

Load execution context from docs/00-state/ and check for prior project runs.

<step n="0" goal="Load prior state and determine current phase" tag="context-init">

  <action>Read docs/00-state/ recursively. Collect:
    - All concern files (01-concerns/) -> {{prior_concerns}}
    - Context files (02-context/) -> {{developer_profile}}
    - Most recent session handoff (03-sessions/) -> {{last_handoff}}</action>

  <check if="{{target_project}} not set in workflow.yaml">
    <ask>What is the path to the project to analyze?
      Example: /home/user/projects/myapp
      (This is the project whose git history will be examined.)</ask>
  </check>

  <action>Set {{target_project_path}} = resolved path to target project</action>
  <action>Set {{project_name}} = basename of {{target_project_path}} (e.g. "archie", "boletapp")</action>
  <action>Set {{analysis_output_dir}} = docs/{{project_name}}/01-observe/02-evidence/</action>
  <action>Set {{neurons_dir}} = docs/02-understand/02-neurons/</action>  <!-- shared canonical: neurons accumulate across projects -->
  <action>Set {{template_dir}} = {backprop_root}/_template/</action>

  <action>Check if docs/{{project_name}}/execution-plan.md exists:
    - If yes: read it, find phase marked "executing" -> {{current_phase}}
      If none "executing", find first "pending" -> {{current_phase}}
      If all phases complete -> {{current_phase}} = "all-complete"
    - If no: set {{current_phase}} = "fresh-run"</action>

  <check if="{{current_phase}} == 'all-complete'">
    <output>**All backprop phases complete for {{project_name}}.**

      Nothing to do. Run again when 3+ new epics completed.
      Signal to rerun: fix:feat ratio climbs above 0.9, OR new blast event >100 files.
      Check docs/{{project_name}}/03-act/04-action-items.md for any unresolved items.</output>
    <action>HALT workflow — all phases complete.</action>
  </check>

  <output>**Context Loaded**

    **Target project:** {{target_project_path}}
    **Project name:** {{project_name}}
    **Evidence dir:** {{analysis_output_dir}}
    **Current phase:** {{current_phase}}
    **Prior concerns:** {{prior_concerns | count}} concern files
    **Last handoff:** {{last_handoff | first_line}}

    Proceeding to Step 1: Observe.</output>

</step>
