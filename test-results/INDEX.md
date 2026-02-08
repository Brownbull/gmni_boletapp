# E2E Test Results Index

Screenshots captured by E2E specs live in per-spec subfolders below.
Each folder is **persistent** — re-running a spec only overwrites its own folder.
Playwright auto-artifacts (traces, videos) go to `playwright-artifacts/` instead.

---

## Staging Tests (`tests/e2e/staging/`)

These are the primary E2E tests, running against the staging environment via TestUserMenu.

| Folder | Spec File | Story | Description |
|--------|-----------|-------|-------------|
| `join-flow-opt-in/` | `join-flow-opt-in.spec.ts` | **14d-v2-1-13+14** | Join Flow with Opt-In Dialog (AC8-AC14). Tests join sharing-ON/OFF groups, opt-in dialog choices (Yes/No/Dismiss), default persistence, keyboard a11y. |
| `group-delete-journey/` | `group-delete-journey.spec.ts` | **14d-v2-1-7e** | Delete Group Journey. Owner deletes group with type-to-confirm protection, partial name keeps button disabled. |
| `transaction-sharing-toggle/` | `transaction-sharing-toggle.spec.ts` | **14d-v2-1-11c** | Transaction Sharing Toggle. Owner sees toggle with helper text in edit dialog (AC#1, AC#2). |
| `user-sharing-preferences/` | `user-sharing-preferences.spec.ts` | **14d-v2-1-12d** | User Sharing Preferences. MySharingPreferencesSection in EditGroupDialog — toggle, eventual consistency notice, info tooltip. |
| `view-mode-filtering-journey/` | `view-mode-filtering-journey.spec.ts` | **14d-v2-1-10d** | View Mode Filtering. Personal vs group mode switching, data filtering, overlay dismiss, full group switching journey. |
| `verify-staging-ui/` | `verify-staging-ui.spec.ts` | *(infrastructure)* | Staging UI Verification. Logs in as each test user (alice/bob/charlie/diana) and verifies transactions are visible. |

## Multi-User Tests (`tests/e2e/multi-user/`)

Require Firebase emulators. Each user gets an independent browser context.

| Folder | Spec File | Story | Description |
|--------|-----------|-------|-------------|
| *(emulator-only)* | `shared-groups.spec.ts` | **14d-v2-1-7g** | Multi-user shared group workflows: creation, navigation, dynamic auth, invitation skeleton, edit group owner-only, user identity verification. |
| *(emulator-only)* | `verify-transactions.spec.ts` | *(infrastructure)* | Verify seeded transactions visible in UI for each test user (alice/bob/charlie/diana). |

## Legacy/Unauthenticated Tests (`tests/e2e/`)

Older specs that test unauthenticated flows (login screens, UI structure). These don't generate persistent screenshots.

| Spec File | Story | Description |
|-----------|-------|-------------|
| `auth-workflow.spec.ts` | *(core)* | Authentication & navigation: login screen, branding, sign-in button, state persistence. |
| `transaction-management.spec.ts` | *(core)* | Transaction management UI structure for unauthenticated users. |
| `trends-export.spec.ts` | **5.5** | Trends export & upgrade prompt — unauthenticated baseline validation. |
| `category-mappings.spec.ts` | **6.5** | Category mappings management in settings — unauthenticated baseline. |
| `image-viewer.spec.ts` | *(core)* | Image viewer & thumbnail workflows — UI structure, authenticated navigation. |
| `invitation-flow.spec.ts` | **14d-v2-1-6e** | Invitation flow — unauthenticated access, URL pattern detection, share code in localStorage. |
| `group-creation.spec.ts` | **14d-v2-1-4d** | Group creation — unauthenticated validation (login screen blocks). |
| `accessibility.spec.ts` | *(ADR-010)* | WCAG 2.1 Level AA: axe-core scans, keyboard navigation, screen reader labels, focus management. |
| `lighthouse.spec.ts` | **3.6** | Lighthouse performance audits across 6 views (login, dashboard, scan, trends, history, settings). |
| `authenticated/dashboard.spec.ts` | *(core)* | Authenticated dashboard workflows — requires global setup auth state. |

---

*This file is tracked in git (exception in `.gitignore`). Update it when adding or removing E2E specs.*
