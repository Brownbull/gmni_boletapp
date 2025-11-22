# Story 1.3: Git Repository Setup

**Status:** Draft

---

## User Story

As a developer,
I want the codebase tracked in version control on GitHub,
So that code is backed up, versioned, and ready for collaboration.

---

## Acceptance Criteria

**AC #1:** Git repository initialized with proper .gitignore
- `git init` completed successfully
- .gitignore excludes: .env, node_modules/, dist/, *.log, .DS_Store
- .gitignore verified working (git status doesn't show excluded files)

**AC #2:** Initial commit includes all source code (excluding node_modules, .env, dist)
- All src/ files committed
- All configuration files committed (package.json, tsconfig.json, vite.config.ts)
- .env.example committed (but not .env)
- Original main.tsx files preserved as backups
- Commit message follows conventional format

**AC #3:** Repository pushed to https://github.com/Brownbull/gmni_boletapp
- Remote origin added with correct URL
- Main branch pushed successfully
- Code visible on GitHub web interface
- All files present in repository

**AC #4:** README.md updated with new project structure and setup instructions
- Project overview section updated
- New directory structure documented
- Setup instructions for Vite project included
- Environment variable configuration steps added
- Development and build commands documented

**AC #5:** Repository is accessible and viewable on GitHub web interface
- Repository exists at correct URL
- Files are browsable on GitHub
- README.md renders correctly on repository homepage
- No sensitive files (like .env) visible in repository

---

## Implementation Details

### Tasks / Subtasks

- [ ] Verify .gitignore is complete and working (AC: #1)
  - [ ] Run `git status` and verify .env not listed
  - [ ] Verify node_modules/ not listed
  - [ ] Verify dist/ not listed
  - [ ] Add any missing patterns if needed
- [ ] Initialize Git repository (AC: #1)
  ```bash
  git init
  git branch -M main
  ```
- [ ] Update README.md with new structure and instructions (AC: #4)
  - [ ] Add project overview section
  - [ ] Document new src/ directory structure
  - [ ] Add prerequisites (Node.js 18+, npm, Firebase CLI)
  - [ ] Add setup instructions:
    - Clone repository
    - Run `npm install`
    - Copy .env.example to .env and configure
    - Run `npm run dev`
  - [ ] Document available npm scripts (dev, build, preview, deploy)
  - [ ] Add deployment section
  - [ ] Update architecture notes for modular structure
- [ ] Create additional backup of original main.tsx (AC: #2)
  ```bash
  cp main.tsx main_BEFORE_REFACTOR.tsx
  ```
- [ ] Stage all files for initial commit (AC: #2)
  ```bash
  git add .
  ```
- [ ] Verify staging (AC: #2)
  - [ ] Run `git status` and review staged files
  - [ ] Confirm .env is NOT staged
  - [ ] Confirm node_modules/ is NOT staged
  - [ ] Confirm all src/ files ARE staged
  - [ ] Confirm configuration files ARE staged
- [ ] Create initial commit with conventional message (AC: #2)
  ```bash
  git commit -m "feat: refactor single-file app to modular Vite project

  - Extract utilities, services, hooks, and components from main.tsx
  - Set up Vite 5.x build system with TypeScript
  - Configure environment variable management
  - Establish production-ready project structure
  - Preserve all existing functionality (zero regressions)

  BREAKING CHANGE: Project structure changed from single-file to modular architecture

  🤖 Generated with Claude Code (https://claude.com/claude-code)

  Co-Authored-By: Claude <noreply@anthropic.com>"
  ```
- [ ] Add GitHub remote (AC: #3)
  ```bash
  git remote add origin https://github.com/Brownbull/gmni_boletapp.git
  ```
- [ ] Push to GitHub (AC: #3)
  ```bash
  git push -u origin main
  ```
- [ ] Verify push succeeded (AC: #3, #5)
  - [ ] Check terminal output for success message
  - [ ] Note any errors and resolve
- [ ] Open repository on GitHub web interface (AC: #5)
  - [ ] Navigate to https://github.com/Brownbull/gmni_boletapp
  - [ ] Verify files are visible
  - [ ] Check README.md renders correctly
  - [ ] Browse src/ directory structure
  - [ ] Verify .env is NOT visible in repository
  - [ ] Check commit history shows initial commit
- [ ] Add repository description on GitHub (AC: #5)
  - [ ] Navigate to repository settings
  - [ ] Add description: "Smart Expense Tracker PWA with AI-powered receipt scanning"
  - [ ] Add topics: pwa, react, typescript, firebase, ai, expense-tracker

### Technical Summary

This story establishes version control for the refactored codebase using Git and GitHub. Proper version control is essential for:

- **Code Backup:** Protects against data loss
- **Change History:** Track what changed, when, and why
- **Collaboration:** Enable team development
- **Deployment Automation:** Enable CI/CD in future

**Git Best Practices Applied:**
- Comprehensive .gitignore to prevent sensitive file commits
- Conventional commit message format for clarity
- Main branch as default (modern Git standard)
- Atomic initial commit with complete working state

**README.md Structure:**
The updated README serves as the primary entry point for developers, covering:
- Project overview and features
- Prerequisites and dependencies
- Step-by-step setup instructions
- Development workflow commands
- Deployment process
- Project structure documentation

**Security Note:**
The .gitignore file is critical - it must be created and verified BEFORE any commits to ensure .env (with API keys) is never committed to the repository.

### Project Structure Notes

- **Files to modify:**
  - README.md (complete rewrite for modular structure)

- **Files to create:**
  - .git/ directory (via git init)
  - main_BEFORE_REFACTOR.tsx (additional backup)

- **Commands to run:**
  - `git init` - Initialize repository
  - `git add .` - Stage files
  - `git commit -m "..."` - Create initial commit
  - `git push -u origin main` - Push to GitHub

- **Expected test locations:**
  - N/A (no testing for Git operations)
  - Verification via GitHub web interface

- **Estimated effort:** 2 story points (1-2 days)

- **Prerequisites:** Stories 1.1 and 1.2 (requires completed refactoring and build configuration)

### Key Code References

**Conventional Commit Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: feat, fix, docs, style, refactor, test, chore

**Example .gitignore for Node.js/Vite Project:**
```
# Dependencies
node_modules/

# Build output
dist/
*.local

# Environment variables
.env
.env.local

# Logs
*.log

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

**GitHub Repository URL:**
https://github.com/Brownbull/gmni_boletapp

---

## Context References

**Tech-Spec:** [tech-spec.md](../tech-spec.md) - Primary context document containing:

- Complete project structure documentation
- Development setup instructions
- Build and deployment process
- .gitignore requirements

**Git Documentation:** https://git-scm.com/doc

---

## Dev Agent Record

### Agent Model Used

<!-- Will be populated during dev-story execution -->

### Debug Log References

<!-- Will be populated during dev-story execution -->

### Completion Notes

<!-- Will be populated during dev-story execution -->

### Files Modified

<!-- Will be populated during dev-story execution -->

### Test Results

<!-- Will be populated during dev-story execution -->

---

## Review Notes

<!-- Will be populated during code review -->
