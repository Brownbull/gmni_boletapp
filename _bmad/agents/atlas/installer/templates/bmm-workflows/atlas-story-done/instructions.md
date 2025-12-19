# Atlas Story Done - Story Completion with Lesson Capture

<critical>The workflow execution engine is governed by: {project-root}/_bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>
<critical>Communicate all responses in {communication_language}</critical>

## Atlas Integration

This workflow enhances standard story-done with:
- **Workflow Chain Update**: Mark story complete in dependency tracking
- **Lesson Capture**: Record implementation lessons for future reference
- **Feature Completion Tracking**: Update feature progress

<workflow>

<step n="0" goal="Atlas initialization - Load workflow chain context">
  <action>Check if {atlas_index} exists</action>

  <check if="{atlas_index} exists">
    <action>Load {atlas_index} to identify relevant fragments</action>
    <action>Load {atlas_knowledge}/08-workflow-chains.md for dependency tracking</action>
    <action>Set {{atlas_enabled}} = true</action>

    <output>**Atlas Knowledge Loaded**
      - Workflow chains: {{chain_count}} tracked
      - Feature progress: Ready for update
    </output>
  </check>

  <check if="{atlas_index} does NOT exist">
    <output>Atlas not configured - proceeding with standard story-done</output>
    <action>Set {{atlas_enabled}} = false</action>
  </check>
</step>

<step n="1" goal="Find reviewed story to mark done" tag="sprint-status">
  <check if="{story_path} is provided">
    <action>Use {story_path} directly</action>
    <action>Read COMPLETE story file and parse sections</action>
    <action>Extract story_key from filename or story metadata</action>
    <action>Verify Status is "review" - if not, HALT</action>
  </check>

  <check if="{story_path} is NOT provided">
    <critical>MUST read COMPLETE sprint-status.yaml file</critical>
    <action>Load the FULL file: {output_folder}/sprint-status.yaml</action>
    <action>Parse the development_status section completely</action>
    <action>Find FIRST story with status "review"</action>

    <check if="no story with status 'review' found">
      <output>No stories with status "review" found

All stories are either still in development or already done.

**Next Steps:**
1. Run `atlas-dev-story` to implement stories
2. Run `atlas-code-review` if stories need review first
      </output>
      <action>HALT</action>
    </check>

    <action>Use the first reviewed story found</action>
    <action>Find matching story file using story_key pattern</action>
    <action>Read the COMPLETE story file</action>
  </check>

  <action>Extract story_id and story_title from the story file</action>
  <action>Update story file: Change Status to "done"</action>
  <action>Add completion notes to Dev Agent Record section</action>
  <action>Save the story file</action>
</step>

<step n="2" goal="Update sprint status to done" tag="sprint-status">
  <action>Load the FULL file: {output_folder}/sprint-status.yaml</action>
  <action>Find development_status key matching {story_key}</action>
  <action>Update development_status[{story_key}] = "done"</action>
  <action>Save file, preserving ALL comments and structure</action>
</step>

<step n="3" goal="Atlas Workflow Chain Update" tag="atlas-chain">
  <check if="{{atlas_enabled}} == true">
    <action>Update {{atlas_chains}} to mark story as complete</action>
    <action>Check for downstream stories that are now unblocked</action>

    <output>**Atlas Workflow Chain Update**

      **Story Completed:** {{story_key}}
      **Dependencies Updated:** {{dependency_count}}
      **Unblocked Stories:** {{unblocked_stories}}
    </output>
  </check>
</step>

<step n="4" goal="Atlas Memory Feeding - Capture Lessons" tag="atlas-feed">
  <check if="{{atlas_enabled}} == true">
    <ask>Were there any notable lessons from implementing this story? (Enter lessons or 'skip'):</ask>

    <check if="user provides lessons">
      <action>Prepare lesson nugget for Atlas memory</action>

      <output>**Atlas Memory Update**

        **Story:** {{story_key}}
        **Lessons Captured:**
        {{user_lessons}}

        Feeding to Atlas memory...
      </output>

      <action>Update {atlas_knowledge}/06-lessons.md with lesson entry</action>
      <action>Update {atlas_knowledge}/09-sync-history.md with sync entry</action>
      <output>Atlas memory updated with story lessons</output>
    </check>
  </check>
</step>

<step n="5" goal="Confirm completion to user">
  <output>**Story Approved and Marked Done, {user_name}!**

Story file updated -> Status: done
Sprint status updated: review -> done
{{#if atlas_enabled}}
Atlas workflow chains updated
{{/if}}

**Completed Story:**
- **ID:** {story_id}
- **Key:** {story_key}
- **Title:** {story_title}
- **Completed:** {date}

**Next Steps:**
1. Continue with next story in your backlog
   - Run `atlas-create-story` for next backlog story
   - Or run `atlas-dev-story` if ready stories exist
2. Check epic completion status
   - Run `atlas-retrospective` to check if epic is complete
  </output>
</step>

</workflow>
