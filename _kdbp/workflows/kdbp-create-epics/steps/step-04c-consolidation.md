# Step 04c: Story List Consolidation

Merge story breakdown with hardening findings. USER GATE: approve per-epic story list.

<step n="3c" goal="Merge story breakdown with hardening findings" tag="consolidation">

  <action>For each user story in {{story_list}}:
    1. Merge BUILT-IN hardening tasks from {{hardening_analysis}} into story tasks
    2. Merge security tasks from {{security_analysis}} into story tasks
    3. Re-check sizing: if story now exceeds LARGE threshold, flag for splitting</action>

  <action>Collect SEPARATE hardening stories from {{hardening_analysis}}:
    1. Merge overlapping findings (architect + security on same concern)
    2. Position each hardening story AFTER the user story it hardens
    3. Assign story keys: e.g., N.Mh for hardening story after story N.M</action>

  <action>Build {{consolidated_story_list}}:
    - User stories (with built-in hardening tasks integrated)
    - Separate hardening stories (positioned after parent stories)
    - Total count: {{user_story_count}} user + {{hardening_story_count}} hardening = {{total_story_count}}</action>

  <check if="any story exceeds TOO_LARGE threshold">
    <output>**Sizing Alert:** The following stories exceed sizing limits after hardening integration:
      {{oversized_stories}}
      **Options:**
      1. Split the story into 2 smaller stories
      2. Move some hardening tasks to a SEPARATE story
      3. Accept the larger size (not recommended)</output>
    <ask>How should we handle oversized stories?</ask>
  </check>

  <output>**Story List for Epic {{current_epic.number}}: {{current_epic.title}}**

    **User Stories:** {{user_story_count}}
    **Hardening Stories:** {{hardening_story_count}}
    **Total:** {{total_story_count}}

    {{consolidated_story_list_summary}}

    **Hardening Patterns Applied:**
    {{hardening_patterns_applied}}

    **FR Coverage for This Epic:**
    {{epic_fr_coverage}}</output>

  <!-- USER GATE: Approve per-epic story list -->
  <ask>Approve this story list for Epic {{current_epic.number}}? You can:
    - [A] Approve and generate story files
    - [M] Modify — add, remove, or adjust stories
    - [S] Skip — skip file generation for now (stories saved in epics.md only)</ask>
</step>
