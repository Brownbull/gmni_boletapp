# Step 06: Output Finalization

Write all final files and prepare for development.

<step n="6" goal="Write all final files and prepare for development" tag="finalization">

  <action>Write final {{epics_file}} with:
    - Frontmatter (stepsCompleted, inputDocuments, hardeningAnalysis metadata)
    - Requirements Inventory (all FRs, NFRs, ARs, UX)
    - FR Coverage Map (FR -> Epic -> Story)
    - Epic List (summary)
    - Intent Block per epic (Gabe Lens format from Step 02)
    - Per-Epic sections with story details</action>

  <action>Create or update {{sprint_status}} with all stories as "drafted":
    - Group by epic
    - Include comments with epic descriptions
    - Stories start as "drafted" — sprint planning promotes to "ready-for-dev"</action>

  <output>**Epic and Story Creation Complete!**

    **Output Files:**
    - Epic Overview: {{epics_file}}
    - Sprint Status: {{sprint_status}}
    - Story Files: {{story_file_count}} files in {story_dir}/

    **Summary:**
    - Epics: {{epic_count}}
    - User Stories: {{user_story_count}}
    - Hardening Stories: {{hardening_story_count}}
    - Total Stories: {{total_story_count}}
    - Hardening Multiplier: {{actual_multiplier}}x
    - Estimated Total Points: {{total_points}}

    **Next Steps:**
    1. Run sprint planning to select stories for the first sprint
    2. Promote selected stories from "drafted" to "ready-for-dev"
    3. Run `/ecc-dev-story` to implement with ECC agents
    4. Run `/ecc-code-review` after implementation for formal review</output>
</step>
