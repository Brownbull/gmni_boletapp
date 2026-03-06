# Step 02: Discovery, Vision & Executive Summary

Classify the project, discover the product vision, and generate the executive summary.

<critical>Three phases in one flowing conversation:
1. Classification (project type + domain + complexity)
2. Vision discovery (differentiator + core insight)
3. Executive summary generation (first content written to document)
CSV data loaded on-demand for classification.</critical>

---

## Phase A: Project Classification

<action>Load classification data:
  - `{installed_path}/data/project-types.csv` — match against detection_signals
  - `{installed_path}/data/domain-complexity.csv` — match against domain indicators

  **If input documents exist:** Analyze for classification signals, then confirm.
  **If greenfield/no docs:** Start with open discovery:
  - What problem does this solve?
  - Who's it for?
  - What excites you about building this?

  Classify and confirm with user:
  - **Project Type:** web app, API, mobile, SaaS, CLI, etc.
  - **Domain:** healthcare, fintech, education, etc.
  - **Complexity:** low, medium, high
  - **Context:** greenfield vs. brownfield</action>

## Phase B: Product Vision

<action>Explore what makes the product special:
  - What's the core insight or unique approach?
  - What makes this different from existing solutions?
  - What's the "one sentence" that captures why this matters?
  - What would make someone switch from their current solution?

  For brownfield: What new capability changes everything?
  Validate understanding before proceeding.</action>

## Phase C: Executive Summary Generation

<action>Draft three sections from the conversation:

  **Executive Summary:**
  - Product vision (2-3 sentences)
  - Target audience and core problem
  - Key value proposition

  **What Makes It Special:**
  - Core differentiator with concrete examples
  - Why this approach wins

  **Project Classification:**
  - Type, domain, complexity, context
  - Key implications for development</action>

<ask>
  [A] Advanced Elicitation (deepen vision)
  [P] Party Mode (challenge assumptions)
  [C] Continue to success criteria</ask>

<action>Append "## Executive Summary", "## What Makes It Special",
  "## Project Classification" sections to prd.md.
  Save classification to frontmatter.
  Update stepsCompleted: [1, 2]</action>
