# Story 1.3: git-repository-setup

Status: ready-for-dev

## Story

As a developer,
I want the codebase tracked in version control on GitHub,
So that code is backed up, versioned, and ready for collaboration.

## Requirements Context

**Epic:** Production Deployment Readiness (Epic 1)

**Story Scope:**
This story initializes proper version control for the boletapp project and pushes the refactored modular codebase to GitHub. It establishes the foundation for professional development practices including code backup, version history, collaboration, and automated deployment pipelines.

**Key Requirements:**
- Initialize Git repository with proper configuration
- Create comprehensive .gitignore excluding sensitive files (node_modules, .env, dist)
- Verify no hardcoded secrets in source code before initial commit
- Push codebase to https://github.com/Brownbull/gmni_boletapp
- Update README.md with new project structure and setup instructions
- Ensure repository is accessible and properly configured

**Architectural Context:**
- Current: Modular Vite-based structure created in Story 1.1 (32 files in src/)
- Target: Full Git repository with clean commit history on GitHub
- Prerequisites: Story 1.1 (modular architecture) and Story 1.2 (environment variables) completed
- Security: Ensures .env and node_modules never committed to repository

[Source: docs/epics.md § Story 1.3]
[Source: docs/sprint-artifacts/tech-spec-epic-1.md § Implementation Details - Git Repository Setup]

## Acceptance Criteria

**AC #1:** Git repository initialized with proper .gitignore
- Verification: Run `git status`, verify .env and node_modules excluded
- Source: Story 1.3 from epics.md

**AC #2:** Initial commit includes all source code (excluding node_modules, .env, dist)
- Verification: Verify commit contains src/, docs/, config files
- Source: Story 1.3 from epics.md

**AC #3:** Repository pushed to https://github.com/Brownbull/gmni_boletapp
- Verification: Access GitHub URL and verify files visible
- Source: Story 1.3 from epics.md

**AC #4:** README.md updated with new project structure and setup instructions
- Verification: Review README for Vite, env setup, deployment instructions
- Source: Story 1.3 from epics.md

**AC #5:** Repository is accessible and viewable on GitHub web interface
- Verification: Open repository URL in browser, verify all files present
- Source: Story 1.3 from epics.md

## Tasks / Subtasks

### Task 1: Pre-commit Security Validation (AC: #1, #2)
- [ ] Search for hardcoded API keys in source code:
  - [ ] Run: `grep -r "AIza" src/` (should return empty)
  - [ ] Run: `grep -r "YOUR_" src/` (should return empty)
  - [ ] Run: `grep -r "firebaseapp.com" src/` (should only find in .env.example)
- [ ] Verify .env file exists and contains actual credentials
- [ ] Verify .env.example exists with placeholder values only
- [ ] Confirm .gitignore includes:
  - [ ] .env (not .env.example)
  - [ ] node_modules/
  - [ ] dist/
  - [ ] .DS_Store, *.log, .vscode (optional but recommended)
- [ ] Test .gitignore: Run `git status` (if repo exists) and verify exclusions work

### Task 2: Initialize Git Repository (AC: #1)
- [ ] Navigate to project root: `/home/khujta/projects/bmad/boletapp`
- [ ] Check if Git already initialized: `ls -la .git/`
- [ ] If not initialized: Run `git init`
- [ ] Configure user identity (if not set globally):
  - [ ] `git config user.name "Your Name"`
  - [ ] `git config user.email "your.email@example.com"`
- [ ] Set main branch: `git branch -M main`
- [ ] Add remote repository: `git remote add origin https://github.com/Brownbull/gmni_boletapp.git`
- [ ] Verify remote added: `git remote -v`

### Task 3: Prepare Initial Commit (AC: #2)
- [ ] Stage all files: `git add .`
- [ ] Review staged files: `git status` (should NOT include .env, node_modules, dist)
- [ ] Verify file count is reasonable (expect ~40-50 files)
- [ ] Review key files are staged:
  - [ ] src/ directory with all source code
  - [ ] package.json, tsconfig.json, vite.config.ts
  - [ ] .env.example (template)
  - [ ] .gitignore
  - [ ] README.md
  - [ ] docs/ directory
- [ ] If .env or node_modules appear: Fix .gitignore and re-stage

### Task 4: Create Initial Commit (AC: #2)
- [ ] Create commit with conventional message:
  ```bash
  git commit -m "feat: refactor to modular Vite architecture with Firebase + Gemini integration

  - Refactored single-file main.tsx (621 lines) to modular structure
  - Established Vite 5.x build pipeline with TypeScript 5.3.3
  - Created src/ with components, views, hooks, services, utils
  - Set up Firebase Auth + Firestore + Gemini AI integrations
  - Configured environment variable management (.env)
  - Preserved all existing features (auth, scanning, analytics, CRUD)

  Story: 1.1 (Refactor to Modular Architecture)
  Epic: Production Deployment Readiness"
  ```
- [ ] Verify commit created: `git log --oneline`

### Task 5: Push to GitHub (AC: #3, #5)
- [ ] Verify GitHub repository exists at https://github.com/Brownbull/gmni_boletapp
- [ ] If repository doesn't exist: Create it on GitHub (public or private)
- [ ] Push initial commit: `git push -u origin main`
- [ ] Handle authentication:
  - [ ] If using HTTPS: Enter GitHub credentials or personal access token
  - [ ] If using SSH: Ensure SSH keys configured
- [ ] Verify push succeeded (check terminal output for success message)
- [ ] Open https://github.com/Brownbull/gmni_boletapp in browser
- [ ] Confirm files are visible on GitHub

### Task 6: Update README.md (AC: #4)
- [ ] Read current README.md (if exists) to understand existing content
- [ ] Update or create comprehensive README with sections:
  - [ ] Project title and description
  - [ ] Features overview (receipt scanning, analytics, etc.)
  - [ ] Tech stack (React, Vite, Firebase, Gemini)
  - [ ] Prerequisites (Node.js 18+, Firebase project, Gemini API key)
  - [ ] Environment setup instructions:
    - [ ] Clone repository
    - [ ] Install dependencies: `npm install`
    - [ ] Copy .env.example to .env
    - [ ] Configure Firebase credentials in .env
    - [ ] Add Gemini API key to .env
  - [ ] Development commands:
    - [ ] `npm run dev` - Start development server
    - [ ] `npm run build` - Build for production
    - [ ] `npm run preview` - Preview production build
  - [ ] Project structure overview (src/, docs/, config files)
  - [ ] Deployment instructions (reference Firebase Hosting)
  - [ ] License (if applicable)
- [ ] Stage README changes: `git add README.md`
- [ ] Commit: `git commit -m "docs: update README with Vite setup and environment instructions"`
- [ ] Push: `git push origin main`

### Task 7: Repository Configuration and Verification (AC: #5)
- [ ] Access https://github.com/Brownbull/gmni_boletapp in browser
- [ ] Verify repository settings:
  - [ ] Repository description set (add via Settings if needed)
  - [ ] Topics/tags added for discoverability (react, firebase, gemini-ai, expense-tracker)
  - [ ] README.md displays correctly on repository home page
- [ ] Review commit history (should have 1-2 commits)
- [ ] Check file tree structure in GitHub UI
- [ ] Verify .env is NOT visible in repository files
- [ ] Clone repository to temporary directory to test:
  ```bash
  cd /tmp
  git clone https://github.com/Brownbull/gmni_boletapp.git test-clone
  cd test-clone
  ls -la
  ```
- [ ] Confirm clone works and files are present
- [ ] Clean up test clone: `rm -rf /tmp/test-clone`

### Task 8: Documentation Update (AC: #4)
- [ ] Review and update docs/architecture.md:
  - [ ] Remove reference to "no version control" in Problem Statement section
  - [ ] Add ADR for Git repository initialization
  - [ ] Update deployment architecture section with GitHub integration
- [ ] Update docs/development-guide.md:
  - [ ] Add Git workflow section (clone, branch, commit, push)
  - [ ] Update setup instructions to reference GitHub repository
  - [ ] Add troubleshooting section for Git-related issues
- [ ] Stage documentation updates: `git add docs/`
- [ ] Commit: `git commit -m "docs: update architecture and dev guide for Git integration"`
- [ ] Push: `git push origin main`

## Dev Notes

### Learnings from Previous Story

**From Story 1-1-refactor-to-modular-architecture (Status: review)**

- **Modular Structure Created**: 32 new files created in src/ directory - all files need to be committed to Git
- **Original main.tsx Preserved**: Original single-file app kept as backup - decide if should be included in Git or removed
- **Configuration Files**: package.json, tsconfig.json, vite.config.ts created - these are critical for repo
- **Placeholder Credentials**: src/config/firebase.ts and src/config/gemini.ts contain placeholders - Story 1.2 externalizes to .env (MUST ensure .env git-ignored)
- **TypeScript Compilation Working**: All files compile with zero errors - Git should preserve this working state
- **NPM Security Warnings**: 12 moderate npm audit warnings noted - not blocking for Git init, but document for future resolution

**Files Created in Story 1.1 (Must Commit):**
- Configuration: package.json, tsconfig.json, vite.config.ts, index.html
- src/: App.tsx, main.tsx (new entry point)
- src/config/: firebase.ts, gemini.ts, constants.ts
- src/utils/: 7 utility files
- src/types/: transaction.ts, settings.ts
- src/services/: gemini.ts, firestore.ts
- src/hooks/: useAuth.ts, useTransactions.ts
- src/components/: 5 component files
- src/views/: 7 view files

**Files to EXCLUDE from Git (via .gitignore):**
- node_modules/ (dependencies, can be reinstalled)
- .env (contains actual API keys - CRITICAL SECURITY)
- dist/ (build output, regenerated)
- .DS_Store, *.log (OS/editor artifacts)

**Recommendations:**
- Include .env.example with placeholder values
- Preserve original main.tsx as backup reference (optional)
- Original backups (main_ORIGINAL_GEMINI.tsx) should be evaluated - may be redundant if Git tracks history

[Source: stories/1-1-refactor-to-modular-architecture.md#Dev-Agent-Record]

### Architecture Patterns to Follow

**Git Workflow Best Practices:**
- Conventional commit messages: `type(scope): description` format
- Types: feat, fix, docs, refactor, test, chore, ci
- Keep commits atomic and focused
- Write descriptive commit messages explaining "why" not just "what"
- Use present tense ("add feature" not "added feature")

**Branch Strategy (Future):**
- Main branch: Production-ready code
- Feature branches: `feature/story-number-description`
- Hotfix branches: `hotfix/issue-description`
- For this story: Direct commits to main (initial setup)

**Security in Version Control:**
- Never commit API keys, credentials, or secrets
- Use .env for all sensitive configuration
- Commit .env.example as template
- Review files before each commit
- Use `.gitignore` aggressively

[Source: docs/sprint-artifacts/tech-spec-epic-1.md § Implementation Details - Git Repository Setup]

### Project Structure Notes

**Git Repository Structure After This Story:**

```
boletapp/
├── .git/                           # Git repository metadata (created by git init)
├── .gitignore                      # Git exclusion rules (from Story 1.1)
├── .env.example                    # Environment variable template (committed)
├── .env                            # Actual credentials (GIT-IGNORED)
├── node_modules/                   # Dependencies (GIT-IGNORED)
├── dist/                           # Build output (GIT-IGNORED)
├── package.json                    # Dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite build configuration
├── index.html                      # HTML template
├── README.md                       # Project documentation (updated in this story)
├── src/                            # Source code (all committed)
│   ├── App.tsx
│   ├── main.tsx
│   ├── config/                     # Configuration files
│   ├── utils/                      # Utility functions
│   ├── types/                      # TypeScript types
│   ├── services/                   # API services
│   ├── hooks/                      # Custom hooks
│   ├── components/                 # Reusable components
│   └── views/                      # View components
├── docs/                           # Documentation (all committed)
│   ├── architecture.md
│   ├── development-guide.md
│   ├── tech-spec.md
│   ├── epics.md
│   └── sprint-artifacts/           # Story files
├── .bmad/                          # BMAD framework (should be committed)
└── main.tsx                        # Original single-file app (preserved backup)
```

**Critical .gitignore Rules:**
```gitignore
# Environment variables (CRITICAL - contains secrets)
.env
.env.local
.env.production

# Dependencies (can be reinstalled)
node_modules/

# Build output (regenerated)
dist/
dist-ssr/

# Logs
*.log
npm-debug.log*

# OS files
.DS_Store
Thumbs.db

# Editor directories
.vscode/*
!.vscode/extensions.json
.idea/

# Temporary files
*.tmp
*.swp
```

### Testing Strategy

**Pre-Commit Validation:**
1. Security check: No hardcoded API keys in source
2. File exclusion: Verify .env not staged
3. Dependency exclusion: Verify node_modules not staged
4. Build output exclusion: Verify dist/ not staged

**Post-Push Validation:**
1. Clone repository to fresh directory
2. Verify all source files present
3. Run `npm install` to test package.json
4. Run `npm run dev` to test development setup
5. Verify no secrets visible in GitHub web interface

**README.md Testing:**
1. Follow setup instructions from fresh clone
2. Verify all commands work as documented
3. Test environment variable configuration process
4. Ensure instructions are clear for new developers

[Source: docs/sprint-artifacts/tech-spec-epic-1.md § Test Strategy Summary]

### References

**Technical Specifications:**
- [docs/sprint-artifacts/tech-spec-epic-1.md](../tech-spec-epic-1.md#git-repository-setup) - Git setup detailed steps
- [docs/epics.md](../epics.md#story-13-git-repository-setup) - Story acceptance criteria
- [docs/architecture.md](../architecture.md) - Architecture decisions and ADRs

**Previous Story Context:**
- [stories/1-1-refactor-to-modular-architecture.md](1-1-refactor-to-modular-architecture.md) - Modular structure created
- [stories/1-2-production-build-configuration.md](1-2-production-build-configuration.md) - Environment variables externalized

**GitHub Repository:**
- Target: https://github.com/Brownbull/gmni_boletapp
- Owner: Brownbull
- Repository name: gmni_boletapp

**Git Documentation:**
- Git initialization: https://git-scm.com/docs/git-init
- Git ignore patterns: https://git-scm.com/docs/gitignore
- Conventional commits: https://www.conventionalcommits.org/

**Workflow Context:**
- Epic 1: Production Deployment Readiness
- Story 1.3: Third story in epic (after refactoring and build config)
- Dependencies: Stories 1.1 (modular structure), 1.2 (environment variables)
- Enables: Story 1.4 (Firebase deployment), Story 1.5 (production deployment)

## Dev Agent Record

### Context Reference

- [docs/sprint-artifacts/1-3-git-repository-setup.context.xml](1-3-git-repository-setup.context.xml)

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
