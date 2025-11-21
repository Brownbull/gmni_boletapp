# Boletapp Documentation Index

**AI-Assisted Development Reference**

This is the primary entry point for AI-assisted development of Boletapp, a Smart Expense Tracker PWA.

---

## Project Overview

- **Type:** Monolith (single cohesive codebase)
- **Primary Language:** TypeScript/JavaScript (React)
- **Architecture:** Single-Page Application (SPA)
- **Status:** Brownfield Project

### Quick Reference

- **Tech Stack:** React 18, TypeScript, Firebase (Auth + Firestore), Google Gemini AI, Lucide React
- **Entry Point:** [main.tsx](../main.tsx) (single-file application)
- **Architecture Pattern:** Component-based SPA with React Hooks state management
- **Database:** Firebase Firestore (NoSQL, real-time)
- **Authentication:** Firebase Auth (Google OAuth)
- **AI Integration:** Google Gemini 2.5 Flash (receipt OCR)

---

## Generated Documentation

### Core Documentation

1. **[Project Overview](./project-overview.md)**
   Executive summary, purpose, tech stack, key features, and repository structure

2. **[Architecture](./architecture.md)**
   Complete architecture documentation including patterns, data flow, integrations, security, and ADRs

3. **[Source Tree Analysis](./source-tree-analysis.md)**
   Annotated directory structure, critical files, application structure within main.tsx

### Development Documentation

4. **[Development Guide](./development-guide.md)**
   Prerequisites, local setup, running the app, testing approach, debugging, deployment

5. **[Component Inventory](./component-inventory.md)**
   Complete catalog of all React components, hierarchy, props, state management

### Technical Reference

6. **[Data Models](./data-models.md)**
   Firebase Firestore schema, transaction structure, data types, validation, security rules

7. **[API Contracts](./api-contracts.md)**
   Firebase Auth, Firestore CRUD, Gemini AI integration with request/response formats

### Operations & Deployment

8. **[Deployment Guide](./deployment-guide.md)**
   Deployment architecture, hosting options, deployment steps, monitoring, cost estimation

---

## Existing Documentation

### Project-Specific

- **[Setup Instructions](../gemini_instructions.md)**
  Step-by-step guide for Firebase project setup and Gemini API configuration

- **[Feature Overview](../gemini_summary.md)**
  High-level application overview, key workflows, data safety mechanisms

### Framework Documentation

The `.bmad/` directory contains the BMAD (Breakthrough Modern Agile Development) framework documentation. This is the development methodology framework and not part of the application code.

---

## Getting Started

### For New Developers

1. **Understand the App:** Start with [Project Overview](./project-overview.md) and [Feature Overview](../gemini_summary.md)
2. **Set Up Environment:** Follow [Development Guide](./development-guide.md) and [Setup Instructions](../gemini_instructions.md)
3. **Explore Architecture:** Read [Architecture](./architecture.md) to understand design decisions
4. **Review Components:** Check [Component Inventory](./component-inventory.md) for UI structure
5. **Start Coding:** Open [main.tsx](../main.tsx) - all application code is in this single file

### For AI Assistants

When planning new features or modifications:

1. **For UI Changes:** Reference [Component Inventory](./component-inventory.md) and [Architecture](./architecture.md) § Component Architecture
2. **For Data Changes:** Reference [Data Models](./data-models.md) and ensure Firestore security rules are updated
3. **For API Changes:** Reference [API Contracts](./api-contracts.md) for Firebase and Gemini integration patterns
4. **For New Features:** Follow architecture patterns in [Architecture](./architecture.md) § Architecture Pattern

---

## Key Application Areas

### Authentication & User Management
- **Files:** [main.tsx](../main.tsx) (Firebase Auth section)
- **Docs:** [API Contracts](./api-contracts.md) § Firebase Authentication
- **Pattern:** Google OAuth with Firebase Auth
- **Security:** [Architecture](./architecture.md) § Security Model

### Receipt Scanning & AI Integration
- **Files:** [main.tsx](../main.tsx) (`analyzeWithGemini` function)
- **Docs:** [API Contracts](./api-contracts.md) § Google Gemini AI API
- **Pattern:** Multi-image upload → Gemini OCR → Structured JSON
- **Components:** ScanView, EditView

### Data Management & Storage
- **Files:** [main.tsx](../main.tsx) (Firestore operations)
- **Docs:** [Data Models](./data-models.md), [API Contracts](./api-contracts.md) § Firebase Firestore
- **Pattern:** Real-time Firestore subscriptions with auto-repair logic
- **Security:** User-scoped data paths

### Analytics & Visualization
- **Files:** [main.tsx](../main.tsx) (TrendsView section)
- **Docs:** [Component Inventory](./component-inventory.md) § TrendsView
- **Pattern:** Hierarchical drill-down with custom charts
- **Components:** SimplePieChart, GroupedBarChart

---

## Application Structure

### main.tsx Sections

| Lines | Section | Description |
|-------|---------|-------------|
| 1-50 | Configuration | Imports, Firebase config, Gemini API, constants |
| 52-69 | Error Boundary | Global error handling component |
| 71-135 | Utilities | Currency, date, CSV, color utilities |
| 136-250 | AI Integration | Gemini API integration |
| 251+ | Application | Main App component with all views |

See [Source Tree Analysis](./source-tree-analysis.md) for detailed breakdown.

---

## Common Development Tasks

### Adding a New View
1. Create new view component function in main.tsx
2. Add navigation case in App component's view switcher
3. Add icon to BottomNav
4. Update component inventory documentation

### Modifying Data Schema
1. Update Firestore document structure in code
2. Update security rules in Firebase Console
3. Test with existing data
4. Document in [Data Models](./data-models.md)

### Adding API Integration
1. Add API logic in utilities section
2. Document request/response in [API Contracts](./api-contracts.md)
3. Add error handling
4. Update environment variable requirements

### Updating UI Components
1. Modify component in main.tsx
2. Test responsiveness
3. Update [Component Inventory](./component-inventory.md) if props changed

---

## Project Metadata

- **Documentation Generated:** 2025-11-20
- **Documentation Mode:** Initial Scan (Quick)
- **Files Documented:** 1 main file (main.tsx)
- **Total Documentation Files:** 8
- **Workflow:** BMAD Document Project v1.2.0

---

## Support & Resources

### Configuration Files
- **BMAD Workflow Status:** [bmm-workflow-status.yaml](./bmm-workflow-status.yaml)
- **Scan Report:** [project-scan-report.json](./project-scan-report.json)

### External Links
- Firebase Console: https://console.firebase.google.com/
- Gemini AI: https://ai.google.dev/
- React Documentation: https://react.dev/
- Lucide Icons: https://lucide.dev/

---

*Generated by BMAD Document Project Workflow*
*Workflow Version: 1.2.0*
*Date: 2025-11-20*
*Scan Level: Quick (Pattern-based analysis)*
