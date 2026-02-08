# ECC Impact Analysis — Design Document

Status: IMPLEMENTED
Date: 2026-02-07

## Purpose

A command (`/ecc-impact-analysis`) that uses import dependency graphs (madge) and sprint-status metadata to answer: **"If I change feature X, what else breaks?"**

Replaces the removed Step 5 (Cross-Cutting Impact Analysis) from `ecc-create-story` with a dedicated, reusable capability that can be invoked on-demand from any workflow.

## How It Works

### Phase 1: Build Dependency Graph

```bash
# Generate JSON dependency graph for the project (--extensions required for full src/)
npx madge --json --ts-config tsconfig.json --extensions ts,tsx src/ > /tmp/dep-graph.json

# Or for a specific feature:
npx madge --json --ts-config tsconfig.json --extensions ts,tsx src/features/shared-groups/
```

Madge 7.0.0 is already installed in the project. It traces ES module imports and produces a JSON adjacency list:

```json
{
  "src/features/shared-groups/services/groupService.ts": [
    "src/services/firebaseService.ts",
    "src/types/sharedGroup.ts"
  ],
  "src/components/settings/subviews/GruposView.tsx": [
    "src/features/shared-groups/services/groupService.ts",
    "src/features/shared-groups/hooks/useGroups.ts"
  ]
}
```

### Phase 2: Identify Affected Files

Given a set of files being changed (from story File Specification or git diff):

1. **Direct dependents** — files that import the changed files (1 hop)
2. **Transitive dependents** — files that import the direct dependents (2+ hops, configurable depth)
3. **Feature boundaries** — which `src/features/*/` modules are affected

### Phase 3: Cross-Reference with Sprint Status

Load `docs/sprint-artifacts/sprint-status.yaml` and check:

- Are any affected files part of **in-progress** stories? (merge conflict risk)
- Do affected features have **ready-for-dev** stories queued? (sequencing concern)
- Are there `DEPENDS:` tags linking stories that touch the same files?

### Phase 4: Output Impact Report

```
## Impact Analysis: story-key

### Files Changed (from story)
- src/features/shared-groups/services/groupService.ts
- src/features/shared-groups/types.ts

### Direct Dependents (1 hop)
- src/features/shared-groups/hooks/useGroups.ts
- src/features/shared-groups/components/GroupList.tsx
- src/components/settings/subviews/GruposView.tsx

### Transitive Dependents (2 hops)
- src/pages/Settings.tsx (via GruposView)

### Feature Boundaries Affected
- shared-groups (primary)
- settings (secondary — GruposView imports)

### Sprint Conflict Check
- [WARN] 14d-v2-1-14-polish (in-progress) touches GruposView.tsx
- [OK] No other in-progress stories touch affected files

### Recommendations
- Coordinate with 14d-v2-1-14-polish before merging
- Add DEPENDS: 14d-v2-1-14-polish to story if not already present
```

## When to Run

| Trigger | How |
|---------|-----|
| After `ecc-create-story` | Story output suggests: "Run `/ecc-impact-analysis` for cross-cutting impact" |
| Before `ecc-dev-story` starts | Optional pre-flight check in Step 1 |
| After `ecc-code-review` finds architectural drift | Reviewer recommends impact check |
| Manual — developer wants to assess risk | `/ecc-impact-analysis <story-key>` or `/ecc-impact-analysis <file-path>` |

## Workflow Integration Points

### ecc-create-story (Step 5)
Currently a 3-line note. After this command exists, Step 5 becomes:

```xml
<step n="5" goal="Cross-cutting impact check">
  <action>If story touches shared modules or multiple features, suggest:
    "Run /ecc-impact-analysis {{story_key}} to check cross-cutting impact"
  </action>
</step>
```

### ecc-dev-story (optional pre-flight)
Add as optional check before implementation starts — helps identify merge conflict risks early.

### ecc-code-review (informational)
If architect agent detects feature boundary crossings, recommend running impact analysis.

## Implementation: Command Stub

File: `_ecc/commands/ecc-impact-analysis.md`

```markdown
---
name: 'ecc-impact-analysis'
description: 'Analyze cross-cutting impact of story changes using dependency graphs'
disable-model-invocation: true
---
<steps CRITICAL="TRUE">
1. Always LOAD the FULL @{project-root}/_bmad/core/tasks/workflow.xml
2. READ its entire contents - this is the CORE OS for EXECUTING the specific workflow-config @{project-root}/_ecc/workflows/ecc-impact-analysis/workflow.yaml
3. Pass the yaml path as 'workflow-config' parameter
4. Follow workflow.xml instructions EXACTLY
</steps>
```

## Implementation: Workflow Structure

```
_ecc/workflows/ecc-impact-analysis/
  workflow.yaml       # Config: madge path, depth limits, sprint-status path
  instructions.xml    # 4-phase analysis (graph → dependents → sprint → report)
```

## Implementation Prompt

Use this prompt to implement the full `ecc-impact-analysis` workflow:

```
Create the ecc-impact-analysis workflow in _ecc/workflows/ecc-impact-analysis/.

The workflow accepts either:
- A story key (looks up File Specification from story file)
- A list of file paths (direct input)

Phase 1: Run `npx madge --json src/` to get the full dependency graph.
Phase 2: For each input file, walk the graph to find all direct and transitive dependents (max depth: 3).
Phase 3: Load sprint-status.yaml and cross-reference affected files against in-progress and ready-for-dev stories.
Phase 4: Output a structured impact report with:
  - Direct/transitive dependents grouped by feature
  - Sprint conflict warnings
  - DEPENDS tag recommendations

Use the existing ECC workflow patterns (see ecc-dev-story for reference).
The workflow should be lightweight — no ECC agents needed, just madge + file analysis.
Keep instructions.xml under 200 lines.
```

## Existing Tooling

- **madge 7.0.0** — installed, generates import dependency graphs
- **sprint-status.yaml** — has `DEPENDS:` tags for manual dependency tracking
- **source-tree-analysis.md** — maps 539 files (can be used as fallback if madge is slow)
- **doc-updater agent** — has codemap capability that could be extended

## Sizing

Small implementation: ~200 lines instructions.xml + ~30 lines workflow.yaml + command stub.
Estimated: 1-2 hours to implement.
