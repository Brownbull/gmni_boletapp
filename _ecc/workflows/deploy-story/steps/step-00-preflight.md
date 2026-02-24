# Step 00: Preflight

Firebase MCP check + story status verification + branch guard.

<step n="0" goal="Firebase MCP pre-flight check + story verification + branch guard">

  <!-- Firebase MCP Check -->
  <action>Read {project-root}/.mcp.json</action>
  <action>Check if mcpServers.firebase.disabled == true</action>

  <check if="firebase.disabled is true">
    <output>**FIREBASE MCP DISABLED**
      The Firebase MCP server is disabled in `.mcp.json`.
      It is needed for post-deployment verification (security rules, function logs, etc.).
      To enable: set `"disabled": false` in `.mcp.json` under `mcpServers.firebase`
      then restart the Claude Code session for MCP changes to take effect.
      The `firebase deploy` CLI command will work either way.</output>
    <ask>Continue deployment without Firebase MCP tools? [Y/N]</ask>
    <check if="user says N">
      <action>Update {project-root}/.mcp.json: set mcpServers.firebase.disabled = false</action>
      <output>Firebase MCP enabled. **Please restart the session** and re-run `/deploy-story`.</output>
      <action>EXIT workflow</action>
    </check>
    <check if="user says Y">
      <output>Proceeding without Firebase MCP tools. Verification will be limited to CLI.</output>
    </check>
  </check>

  <check if="firebase.disabled is false or firebase entry not found">
    <output>Firebase MCP: available</output>
  </check>

  <!-- Story Verification -->
  <action>If {{story_path}} not provided, ask user which story to deploy</action>
  <action>Read COMPLETE story file</action>
  <action>Extract {{story_key}} from filename</action>
  <action>Extract story Status field</action>

  <check if="story status != 'done'">
    <output>**DEPLOYMENT BLOCKED**
      Story status is "{{story_status}}" - must be "done" to deploy.
      Run `code-review` first to complete the story.</output>
    <action>EXIT workflow</action>
  </check>

  <!-- Uncommitted Changes -->
  <action>Run `git status --porcelain` to check for uncommitted changes</action>
  <check if="uncommitted changes exist">
    <output>**WARNING: Uncommitted Changes Detected**
      Please commit or stash changes before deployment.</output>
    <ask>Commit changes now? [Y/N]</ask>
    <check if="user says Y">
      <action>Stage relevant files with `git add` (specific files, not -A)</action>
      <action>Run `git commit -m "chore: pre-deployment cleanup for {{story_key}}"`</action>
    </check>
    <check if="user says N">
      <output>Deployment cancelled. Commit changes and retry.</output>
      <action>EXIT workflow</action>
    </check>
  </check>

  <!-- Branch Guard -->
  <action>Detect current branch with `git branch --show-current`</action>
  <action>Set {{current_branch}} = result</action>

  <check if="{{current_branch}} == 'main' OR {{current_branch}} == 'develop'">
    <output>**DEPLOYMENT BLOCKED**
      You are on a protected branch ({{current_branch}}).
      Deployments must originate from a feature/fix/chore branch.</output>
    <action>EXIT workflow</action>
  </check>

  <output>**Story Ready for Deployment**
    **Story:** {{story_key}}
    **Current Branch:** {{current_branch}}
    **Status:** done
    Pipeline: {{current_branch}} -> develop (squash PR) -> main (merge PR)</output>
</step>
