# boletapp - Epic Breakdown

**Date:** 2025-11-20
**Project Level:** Quick Flow

---

## Epic 1: Production Deployment Readiness

**Slug:** production-deployment

### Goal

Transform the boletapp single-file prototype into a production-ready, maintainable application with proper modular architecture, version control, and automated deployment to Firebase Hosting. Enable sustainable development practices and make the application accessible to end users.

### Scope

**In Scope:**
- Refactor main.tsx (621 lines) into modular component structure
- Establish Vite build pipeline with TypeScript configuration
- Set up proper dependency management via npm
- Initialize Git repository and push to https://github.com/Brownbull/gmni_boletapp
- Configure Firebase Hosting with deployment automation
- Deploy application to production with HTTPS
- Environment variable management for secure configuration
- Update all project documentation

**Out of Scope:**
- New features or functionality changes
- UI/UX redesign
- Database schema modifications
- Automated testing framework (deferred)
- Multi-environment setup (staging/prod)
- Custom domain configuration
- Performance optimizations beyond build improvements

### Success Criteria

1. ✅ Application successfully refactored from single-file to modular structure with no feature regressions
2. ✅ Code tracked in Git repository at https://github.com/Brownbull/gmni_boletapp
3. ✅ Production build process functional (`npm run build` succeeds)
4. ✅ Application deployed and accessible via Firebase Hosting URL with HTTPS
5. ✅ All existing features work identically in deployed production environment
6. ✅ Environment variables externalized (no hardcoded API keys in source)
7. ✅ Documentation updated to reflect new architecture and deployment process

### Dependencies

**External:**
- Firebase project already configured (Auth + Firestore)
- Google Gemini API key available
- GitHub repository created: https://github.com/Brownbull/gmni_boletapp
- Node.js 18+ and npm installed locally

**Internal:**
- Existing main.tsx contains all functional application code
- Comprehensive brownfield documentation already generated

---

## Story Map - Epic 1

```
Epic 1: Production Deployment Readiness (14 points total)
│
├── Story 1.1: Refactor to Modular Architecture (5 points)
│   Dependencies: None
│   Deliverable: Modular src/ structure with Vite build working
│
├── Story 1.2: Production Build Configuration (2 points)
│   Dependencies: Story 1.1
│   Deliverable: Environment variables, build scripts, production-ready config
│
├── Story 1.3: Git Repository Setup (2 points)
│   Dependencies: Stories 1.1, 1.2
│   Deliverable: Code pushed to GitHub with proper .gitignore
│
├── Story 1.4: Firebase Deployment Infrastructure (3 points)
│   Dependencies: Stories 1.1, 1.2
│   Deliverable: Firebase Hosting configured and tested
│
└── Story 1.5: Production Deployment & Verification (2 points)
    Dependencies: Stories 1.1, 1.2, 1.3, 1.4
    Deliverable: Application live at Firebase URL, fully functional
```

---

## Stories - Epic 1

### Story 1.1: Refactor to Modular Architecture

As a developer,
I want the single-file application refactored into a modular component structure,
So that the codebase is maintainable, testable, and follows modern development practices.

**Acceptance Criteria:**

AC #1: All code from main.tsx extracted into logical modules (components/, utils/, hooks/, services/)
AC #2: Vite development server runs successfully with hot module replacement
AC #3: TypeScript compilation succeeds with no errors
AC #4: All existing features work identically to original main.tsx
AC #5: No console errors in browser devtools during normal operation

**Prerequisites:** None (first story in sequence)

**Technical Notes:** Use Vite 5.x with TypeScript 5.3.3. Extract code in phases: utilities first (lowest risk), then services, hooks, and finally components. Preserve all existing functionality.

**Estimated Effort:** 5 story points

---

### Story 1.2: Production Build Configuration

As a developer,
I want proper environment variable management and production build configuration,
So that API keys are secure and the application can be built for production deployment.

**Acceptance Criteria:**

AC #1: .env file configured with all Firebase and Gemini credentials (git-ignored)
AC #2: .env.example template created and documented
AC #3: `npm run build` completes successfully producing optimized dist/ folder
AC #4: `npm run preview` serves production build locally with all features functional
AC #5: No hardcoded API keys remain in source code

**Prerequisites:** Story 1.1 (requires modular structure and Vite configuration)

**Technical Notes:** Use Vite environment variables (VITE_* prefix). Configure .gitignore to exclude .env, node_modules, and dist/. Test production build thoroughly.

**Estimated Effort:** 2 story points

---

### Story 1.3: Git Repository Setup

As a developer,
I want the codebase tracked in version control on GitHub,
So that code is backed up, versioned, and ready for collaboration.

**Acceptance Criteria:**

AC #1: Git repository initialized with proper .gitignore
AC #2: Initial commit includes all source code (excluding node_modules, .env, dist)
AC #3: Repository pushed to https://github.com/Brownbull/gmni_boletapp
AC #4: README.md updated with new project structure and setup instructions
AC #5: Repository is accessible and viewable on GitHub web interface

**Prerequisites:** Stories 1.1 and 1.2 (requires completed refactoring and build configuration)

**Technical Notes:** Use conventional commit message format. Ensure .gitignore properly excludes sensitive files before initial commit. Update README with Vite-specific instructions.

**Estimated Effort:** 2 story points

---

### Story 1.4: Firebase Deployment Infrastructure

As a developer,
I want Firebase Hosting configured and ready for deployment,
So that the application can be deployed to production with automated deployment scripts.

**Acceptance Criteria:**

AC #1: Firebase CLI installed and authenticated
AC #2: `firebase init hosting` completed with correct settings (public: dist, SPA config)
AC #3: firebase.json includes caching headers for optimized asset delivery
AC #4: Staging deployment tested successfully
AC #5: Deployment process documented in README.md

**Prerequisites:** Stories 1.1 and 1.2 (requires production build working)

**Technical Notes:** Configure Firebase Hosting to serve dist/ folder. Set up SPA rewrites for client-side routing. Add cache headers for static assets (31536000 seconds for JS/CSS).

**Estimated Effort:** 3 story points

---

### Story 1.5: Production Deployment & Verification

As a product owner,
I want the application deployed to production and verified working,
So that end users can access the live application via HTTPS.

**Acceptance Criteria:**

AC #1: Production build created and tested locally
AC #2: `firebase deploy --only hosting` succeeds without errors
AC #3: Application accessible via Firebase Hosting URL with HTTPS enabled
AC #4: All features (auth, scanning, CRUD, analytics) work in production environment
AC #5: No errors in Firebase Console logs after deployment
AC #6: Production URL documented and shared

**Prerequisites:** All previous stories (1.1, 1.2, 1.3, 1.4)

**Technical Notes:** Run full regression test suite in production. Document Firebase Hosting URL. Verify Firebase Console shows hosting activity. Test rollback procedure.

**Estimated Effort:** 2 story points

---

## Implementation Timeline - Epic 1

**Total Story Points:** 14 points

**Estimated Timeline:** 7-10 days (assuming 1.5-2 points per day)

**Implementation Sequence:**
1. Story 1.1 (Refactor) - Foundation work, highest risk, must be done first
2. Story 1.2 (Build Config) - Depends on refactored structure
3. Story 1.3 (Git) and Story 1.4 (Firebase) - Can be done in parallel after 1.2
4. Story 1.5 (Deploy) - Final integration, depends on all previous stories

**Recommended Approach:** Sequential execution (1→2→3→4→5) for single developer. Stories 1.3 and 1.4 could be parallelized if multiple developers available.

---

*Generated by BMAD Tech-Spec Workflow*
*Epic Slug: production-deployment*
*Total Stories: 5*
