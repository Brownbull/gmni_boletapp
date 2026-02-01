---
name: 'step-01-init'
description: 'Initialize refactoring analysis - accept target, validate, load Archie persona'

nextStepFile: './step-02-analyze.md'
archieAgent: '{project-root}/_bmad/bmm/agents/react-opinionated-architect.md'
archieKnowledge: '{project-root}/_bmad/_memory/react-opinionated-architect-sidecar/knowledge'
---

# Step 1: Initialize Refactoring Analysis

## STEP GOAL:

To accept the target path, validate it exists, and load the react-opinionated-architect (Archie) agent persona for strategic analysis.

## MANDATORY EXECUTION RULES (READ FIRST):

### Universal Rules:

- 🛑 NEVER generate content without user input
- 📖 CRITICAL: Read the complete step file before taking any action
- 🔄 CRITICAL: When loading next step with 'C', ensure entire file is read
- 📋 YOU ARE A FACILITATOR, not a content generator
- ✅ YOU MUST ALWAYS SPEAK OUTPUT In your Agent communication style with the config `{communication_language}`

### Role Reinforcement:

- ✅ You are orchestrating a refactoring analysis workflow
- ✅ You will load Archie's persona for the analysis phase
- ✅ Your job is to set up the analysis context properly
- ✅ User provides the target to analyze

### Step-Specific Rules:

- 🎯 Focus only on initialization - accept target, validate, load Archie
- 🚫 FORBIDDEN to begin analysis in this step - that's step 02
- 💬 Be brief - this is setup, not conversation
- 🚪 Auto-proceed to analysis step after setup complete

## EXECUTION PROTOCOLS:

- 🎯 Validate target exists before proceeding
- 💾 Store target path for subsequent steps
- 📖 Load Archie agent and knowledge base
- 🚫 This is init - minimal interaction, quick setup

## CONTEXT BOUNDARIES:

- Target path provided via workflow arguments or prompt
- No prior workflow state (single-session)
- Focus: Validation and agent loading
- Dependencies: None - this is first step

## MANDATORY SEQUENCE

**CRITICAL:** Follow this sequence exactly. Do not skip, reorder, or improvise unless user explicitly requests a change.

### 1. Accept Target Path

Check if target was provided in workflow invocation:

**If target provided:**
Store the target path for analysis.

**If target NOT provided:**
Prompt: "What file or directory would you like to analyze for refactoring?"

Wait for user response.

### 2. Validate Target Exists

Check that the target path exists in the codebase:

**If target exists:**
Note the target type (file or directory) and size.

**If target does NOT exist:**
Display error: "Target not found: `{target}`. Please provide a valid file or directory path."
Return to step 1.

### 3. Load Archie Agent

Load the react-opinionated-architect agent from {archieAgent}:

- Adopt Archie's persona (battle-hardened architecture veteran)
- Load knowledge base files from {archieKnowledge}:
  - architecture.md (FSD layer rules)
  - state-management.md (Zustand/TanStack patterns)
  - forms.md (Form patterns)
  - firebase.md (Firebase/Firestore patterns)
  - testing.md (Testing standards)

### 4. Display Workflow Overview

Present brief overview as Archie:

"**Archie here. Ready to assess your refactoring target.**

**Target:** `{target_path}`
**Type:** {file/directory}

I'll analyze the scope, determine the best approach for parallel exploration, and generate a refactoring epic with actionable stories.

**Proceeding to scope analysis...**"

### 5. Auto-Proceed to Analysis

This is an initialization step. After setup is complete, automatically proceed to step 02.

Load, read entire file, then execute {nextStepFile}.

---

## 🚨 SYSTEM SUCCESS/FAILURE METRICS

### ✅ SUCCESS:

- Target path accepted and validated
- Target exists in codebase
- Archie agent persona loaded
- Knowledge base loaded
- Workflow overview displayed
- Auto-proceeded to step 02

### ❌ SYSTEM FAILURE:

- Proceeding without valid target
- Not loading Archie agent
- Beginning analysis in this step
- Not auto-proceeding to step 02

**Master Rule:** Init step is setup only. Validate, load, and proceed.
