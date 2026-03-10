# Step 04: Firebase Backend Deployment (if needed)

Hosting auto-deploys on merge, but rules/indexes/functions do NOT.
Detect backend changes, deploy targets, sync staging.

<step n="4" goal="Firebase backend deployment (if needed)">
  <critical>Hosting auto-deploys on merge, but rules/indexes/functions do NOT.
    See docs/firebase/DEPLOYMENT-MANIFEST.md for the full artifact inventory.</critical>

  <action>Run `git diff origin/main~1..origin/main --name-only | grep -E '^(firestore\.(rules|indexes\.json)|storage\.rules|functions/src/)'`</action>
  <action>Set {{backend_files_changed}} = result (may be empty)</action>

  <check if="{{backend_files_changed}} is empty">
    <output>**No Firebase backend changes detected** — hosting-only deployment.
      Skipping backend deploy.</output>
    <action>Proceed to step 5</action>
  </check>

  <output>**Firebase Backend Changes Detected**
    The following backend files changed:
    ```
    {{backend_files_changed}}
    ```
    These require manual `firebase deploy` after merge to main.</output>

  <action>Set {{deploy_targets}} = ""</action>
  <check if="firestore.rules in {{backend_files_changed}}">
    <action>Append "firestore:rules" to {{deploy_targets}}</action>
  </check>
  <check if="firestore.indexes.json in {{backend_files_changed}}">
    <action>Append "firestore:indexes" to {{deploy_targets}}</action>
  </check>
  <check if="storage.rules in {{backend_files_changed}}">
    <action>Append "storage" to {{deploy_targets}}</action>
  </check>
  <check if="functions/src/ files in {{backend_files_changed}}">
    <action>Run `cd functions && npm run build && cd ..`</action>
    <action>Append "functions" to {{deploy_targets}}</action>
  </check>

  <ask>Deploy Firebase backend to production?
    Targets: {{deploy_targets}}
    Command: `firebase deploy --only {{deploy_targets}} --project boletapp-d609f`
    [Y/N]</ask>

  <check if="user says Y">
    <action>Run `firebase deploy --only {{deploy_targets}} --project boletapp-d609f`</action>
    <check if="deploy fails">
      <output>**BACKEND DEPLOY FAILED**
        Common issues: Eventarc permissions (retry in 2-5 min), storage not initialized, build errors.
        Fix and retry: `firebase deploy --only {{deploy_targets}} --project boletapp-d609f`</output>
    </check>
    <check if="deploy succeeds">
      <output>**Backend deployed to production** — Deployed: {{deploy_targets}}</output>
      <check if="firestore:rules or firestore:indexes in {{deploy_targets}}">
        <critical>INC-001 WARNING: boletapp-staging is SHARED with Gustify.
          Firestore rules are per-project — deploying overwrites BOTH apps' rules.
          The canonical combined rules file lives in the Gustify repo.
          Before deploying: verify firestore.staging.rules contains Gustify paths
          (canonicalIngredients, itemMappings, recipes, canonicalPreparedFoods, unknownIngredients, unknownPreparedFoods).
          deploy-staging.sh validates this automatically — use it instead of raw firebase CLI.</critical>
        <action>Run `bash scripts/deploy-staging.sh rules`</action>
        <check if="firestore:indexes in {{deploy_targets}}">
          <action>Run `firebase deploy --only firestore:indexes --project boletapp-staging`</action>
        </check>
        <output>Staging Firestore rules/indexes synced (rules validated for both apps).</output>
      </check>
    </check>
  </check>

  <check if="user says N">
    <output>**Backend deployment skipped.**
      Deploy later with: `firebase deploy --only {{deploy_targets}} --project boletapp-d609f`
      See `docs/firebase/DEPLOYMENT-MANIFEST.md` for full reference.</output>
  </check>
</step>
