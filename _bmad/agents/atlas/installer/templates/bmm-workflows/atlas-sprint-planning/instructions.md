# Atlas Sprint Planning - Sprint Status Generator with Feature Mapping

<critical>The workflow execution engine is governed by: {project-root}/_bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {installed_path}/workflow.yaml</critical>

## Atlas Integration

This workflow enhances standard sprint-planning with:
- **Feature-to-Story Mapping**: Maps stories to Atlas feature inventory
- **Workflow Chain Analysis**: Identifies story dependencies
- **Memory Feeding**: Updates Atlas with sprint structure

## 📚 Document Discovery - Full Epic Loading

**Strategy**: Sprint planning needs ALL epics and stories to build complete status tracking.

**Epic Discovery Process:**
1. **Search for whole document first** - Look for `epics.md`, `bmm-epics.md`, or any `*epic*.md` file
2. **Check for sharded version** - If whole document not found, look for `epics/index.md`
3. **If sharded version found**: Read ALL epic section files from the index
4. **Priority**: If both whole and sharded versions exist, use the whole document

<workflow>

<step n="0" goal="Atlas initialization - Load feature inventory">
<action>Check if {atlas_index} exists</action>

<check if="{atlas_index} exists">
  <action>Load {atlas_index} to identify relevant fragments</action>
  <action>Load {atlas_knowledge}/02-features.md for feature inventory</action>
  <action>Load {atlas_knowledge}/08-workflow-chains.md for dependencies</action>
  <action>Store as {{atlas_features}} and {{atlas_chains}}</action>

  <output>🗺️ **Atlas Knowledge Loaded**
    - Feature inventory: {{feature_count}} features tracked
    - Workflow chains: {{chain_count}} dependencies mapped
    - Will map stories to features during planning
  </output>
</check>

<check if="{atlas_index} does NOT exist">
  <output>ℹ️ Atlas not configured - proceeding with standard sprint-planning</output>
  <action>Set {{atlas_enabled}} = false</action>
</check>
</step>

<step n="0.5" goal="Discover and load project documents">
  <invoke-protocol name="discover_inputs" />
  <note>After discovery: {epics_content} available (uses FULL_LOAD strategy)</note>
</step>

<step n="1" goal="Parse epic files and extract all work items">
<action>Communicate in {communication_language} with {user_name}</action>
<action>Look for all files matching `{epics_pattern}` in {epics_location}</action>

<action>For each epic file found, extract:</action>
- Epic numbers from headers like `## Epic 1:` or `## Epic 2:`
- Story IDs and titles from patterns like `### Story 1.1: User Authentication`
- Convert story format from `Epic.Story: Title` to kebab-case key

**Story ID Conversion Rules:**
- Original: `### Story 1.1: User Authentication`
- Replace period with dash: `1-1`
- Convert title to kebab-case: `user-authentication`
- Final key: `1-1-user-authentication`

<action>Build complete inventory of all epics and stories from all epic files</action>
</step>

<step n="2" goal="Atlas feature mapping" tag="atlas-feature-map">
<check if="{{atlas_enabled}} == true">
  <action>For each story discovered, attempt to map to Atlas feature inventory</action>
  <action>Compare story titles and descriptions to {{atlas_features}}</action>
  <action>Build feature-to-story mapping table</action>

  <output>🗺️ **Atlas Feature Mapping**

    **Mapped Stories:**
    {{mapped_stories_table}}

    **Unmapped Stories (new features?):**
    {{unmapped_stories}}
  </output>

  <action>Flag any stories that don't map to known features for review</action>
</check>

<action>For each epic found, create entries in this order:</action>
1. **Epic entry** - Key: `epic-{num}`, Default status: `backlog`
2. **Story entries** - Key: `{epic}-{story}-{title}`, Default status: `backlog`
3. **Retrospective entry** - Key: `epic-{num}-retrospective`, Default status: `optional`
</step>

<step n="3" goal="Apply intelligent status detection">
<action>For each epic, check if tech context file exists:</action>
- Check: `{output_folder}/epic-{num}-context.md`
- If exists → set epic status to `contexted`
- Else → keep as `backlog`

<action>For each story, detect current status by checking files:</action>

**Story file detection:**
- Check: `{story_location_absolute}/{story-key}.md`
- If exists → upgrade status to at least `drafted`

**Story context detection:**
- Check: `{story_location_absolute}/{story-key}-context.md`
- If exists → upgrade status to at least `ready-for-dev`

**Preservation rule:**
- If existing `{status_file}` exists and has more advanced status, preserve it
- Never downgrade status
</step>

<step n="4" goal="Generate sprint status file with Atlas annotations">
<action>Create or update {status_file} with complete structure</action>

<check if="{{atlas_enabled}} == true">
  <action>Add Atlas feature mapping as comments in sprint-status.yaml</action>
  <action>Include workflow chain dependencies for complex stories</action>
</check>

<action>Write the complete sprint status YAML to {status_file}</action>
<action>CRITICAL: Metadata appears TWICE - once as comments (#), once as YAML key:value</action>
<action>Ensure all items are ordered: epic, its stories, its retrospective, next epic...</action>
</step>

<step n="5" goal="Atlas memory feeding - Update feature inventory" tag="atlas-feed">
<check if="{{atlas_enabled}} == true">
  <action>Prepare knowledge update for Atlas</action>

  <output>🗺️ **Atlas Memory Update**

    **New features detected from stories:**
    {{new_features}}

    **Feature-Story mapping updates:**
    {{mapping_updates}}

    Would you like to update Atlas memory?
  </output>

  <ask>Update Atlas memory? [Y/N]</ask>

  <check if="user confirms">
    <action>Update {atlas_knowledge}/02-features.md with new features</action>
    <action>Update {atlas_knowledge}/08-workflow-chains.md with dependencies</action>
    <action>Update {atlas_knowledge}/09-sync-history.md with sync entry</action>
    <output>✅ Atlas memory updated with sprint structure</output>
  </check>
</check>
</step>

<step n="6" goal="Validate and report">
<action>Perform validation checks:</action>
- [ ] Every epic in epic files appears in {status_file}
- [ ] Every story in epic files appears in {status_file}
- [ ] Every epic has a corresponding retrospective entry
- [ ] All status values are legal
- [ ] File is valid YAML syntax

<action>Display completion summary to {user_name}:</action>

**Sprint Status Generated Successfully**
- **File Location:** {status_file}
- **Total Epics:** {{epic_count}}
- **Total Stories:** {{story_count}}
- **Atlas Feature Coverage:** {{feature_coverage}}%

**Next Steps:**
1. Review the generated {status_file}
2. Use `atlas-sprint-status` to track progress with workflow visualization
3. Use `atlas-create-story` for story drafting with context
</step>

</workflow>
