# Step 06: Deferred Item Audit + Tech Debt Story Creation

Audit ALL deferred items. Route to in-epic TD stories or project backlog based on product stage.

<step n="4.5" goal="Audit deferred items, route by stage, track every one" tag="debt-tracking">
  <critical>TECH DEBT TRACKING — Every deferred item MUST be tracked (TD story or backlog entry)</critical>
  <critical>This step is MANDATORY even when triage has zero deferred items</critical>

  <!-- Collect ALL deferred items from FOUR sources -->
  <action>Build {{all_deferred_items}} from:
    1. {{td_items}} from Step 5 (in-epic triage deferrals — have stage tags)
    2. {{backlog_items}} from Step 5 (backlog triage deferrals — have stage tags)
    3. Story Dev Notes containing "Deferred", "out of scope", "follow-up", "future"
    4. Agent outputs flagged as "out of scope", "pre-existing", "follow-up recommended"
    For items from sources 3-4: classify stage (MVP/PROD/SCALE) using product-stages.md criteria
  </action>

  <!-- Verify existing coverage -->
  <action>For EACH item in {{all_deferred_items}}, check if already tracked:
    1. Search {sprint_artifacts}/stories/ for story files covering this item
    2. Search {sprint_artifacts}/deferred-findings.md for matching backlog entries
    3. Search {sprint_status} for matching story descriptions
    4. Set {{item.tracked}} = true/false | {{item.tracking_story}} = story ID if tracked
  </action>

  <!-- Handle tracked items -->
  <check if="any items have item.tracked = true">
    <action>For each tracked item: verify coverage is real, update source story deferred reference to link to tracking story</action>
  </check>

  <!-- ═══ IN-EPIC TD STORIES (DEFER_EPIC items) ═══ -->
  <check if="any untracked items have suggested_action = DEFER_EPIC">
    <action>For each untracked DEFER_EPIC item:
      Option A: Add to existing ready-for-dev story if related theme exists
      Option B: Create new TD story — group related items by stage to minimize story count
    </action>

    <action>For each new TD story, create file using template:
      ```markdown
      # Tech Debt Story TD-{{epic_id}}-{{td_number}}: {{title}}

      Status: ready-for-dev

      > **Source:** ECC Code Review ({{date}}) on story {{story_key}}
      > **Priority:** {{priority}} | **Estimated Effort:** {{effort_estimate}}
      > **Stage:** {{stage}}

      ## Story
      As a **developer**, I want **{{what}}**, so that **{{why}}**.

      ## Acceptance Criteria
      {{acceptance_criteria}}

      ## Tasks / Subtasks
      {{tasks}}

      ## Dev Notes
      - Source story: [{{story_key}}](./{{story_filename}})
      - Review findings: {{finding_indices}}
      - Files affected: {{affected_files}}
      ```
    </action>

    <action>Write story files to: {sprint_artifacts}/stories/TD-{{epic_id}}-{{td_number}}-{{slug}}.md</action>
  </check>

  <!-- ═══ BACKLOG ENTRIES (DEFER_BACKLOG items) ═══ -->
  <check if="any untracked items have suggested_action = DEFER_BACKLOG">
    <action>Append each DEFER_BACKLOG item to {sprint_artifacts}/deferred-findings.md:
      ```markdown
      ### [{{stage}}] {{title}}

      - **Source:** {{story_key}} review ({{date}})
      - **Finding:** {{description}}
      - **Files:** {{affected_files}}
      - **Stage:** {{stage}} — {{stage_justification}}
      - **Estimated effort:** {{effort_estimate}}
      ```
      Group entries under stage headers (## PROD Backlog, ## SCALE Backlog).
      Create the file if it does not exist, with header:
      ```markdown
      # Deferred Findings Backlog

      > Items identified during code review but deferred beyond the current epic.
      > Grouped by product stage. Review during epic planning for future epics.
      ```
    </action>
  </check>

  <!-- Update sprint-status.yaml + source story (MANDATORY) -->
  <action>For each NEW in-epic TD story: add to sprint-status.yaml:
    ```yaml
    TD-{{epic_id}}-{{td_number}}-{{slug}}:
      status: ready-for-dev
      stage: {{stage}}
      depends: {{story_key}}
    ```
  </action>

  <action>Update source story {{story_key}} with tracking table:
    | # | Finding | Stage | Destination | Tracking |
    |---|---------|-------|-------------|----------|
    {{#each all_deferred_items}}
    | {{index}} | {{description}} | {{stage}} | {{#if DEFER_EPIC}}TD-{{tracking_id}}{{else if DEFER_BACKLOG}}Backlog{{else}}Archived{{/if}} | {{action}} |
    {{/each}}
  </action>

  <output>**Deferred Item Audit Complete**

    **In-epic TD stories:** {{new_td_count}} created ({{td_mvp_count}} MVP, {{td_prod_count}} PROD, {{td_scale_count}} SCALE)
    **Backlog entries:** {{backlog_new_count}} added to deferred-findings.md
    **Already tracked:** {{already_tracked_count}} | **Archived:** {{archived_count}}

    Sprint status updated. All deferred items are tracked.
  </output>
</step>
