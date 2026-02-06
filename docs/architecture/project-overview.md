# Project Overview: Boletapp

## Executive Summary

**Boletapp** is a Smart Expense Tracker Progressive Web Application (PWA) designed to automate receipt entry using AI. The application focuses on capturing detailed spending data at the item level while providing high-level analytics to track spending patterns over time.

## Project Information

- **Project Name:** boletapp
- **Project Type:** Expense Tracker PWA
- **Architecture:** Feature-Based SPA with Zustand State Management
- **Repository Structure:** Modular Monolith (Feature-Sliced Design)
- **Primary Language:** TypeScript (React 18)
- **Status:** Production (Active Development)

## Purpose

The application enables users to:
- **AI Receipt Scanning:** Automatically extract merchant names, dates, amounts, and line items from receipt photos
- **Smart Data Entry:** Intelligent categorization with alias system and duplicate detection
- **Deep Analytics:** Hierarchical drill-down analytics with interactive charts
- **Data Management:** Full transaction history with editing capabilities

## Technology Stack Summary

| Category | Technology | Version/Details | Justification |
|----------|-----------|----------------|---------------|
| **Frontend Framework** | React | 18.3.1 | Component-based UI with hooks |
| **Language** | TypeScript | 5.3.3 | Type-safe development |
| **State Management** | Zustand + TanStack Query | 5.x | Client state (Zustand), server state (TQ) |
| **Build Tool** | Vite | 5.4.0 | Fast ES module bundler with HMR |
| **UI Library** | Lucide React | 0.460.0 | Modern icon system |
| **Styling** | Tailwind CSS | 3.x | Utility-first CSS via CDN |
| **Backend/Database** | Firebase Firestore | 10.14.1 | Real-time NoSQL database |
| **Authentication** | Firebase Auth | 10.14.1 | Google OAuth integration |
| **AI Integration** | Google Gemini AI | 2.5-flash | Receipt OCR via Cloud Function |
| **Internationalization** | Native Intl API | Browser-native | Multi-currency (CLP, USD) |
| **Data Visualization** | Custom Charts | SVG-based | Pie and bar charts |
| **Testing** | Vitest + React Testing Library | Latest | Unit and component tests |

## Architecture Pattern

**Feature-Based Architecture (Epic 14e)**

- **Feature Modules:** Self-contained features in `src/features/` with own stores, handlers, and hooks
- **Zustand State:** 7 stores managing client state (scan, batch-review, navigation, settings, etc.)
- **TanStack Query:** Server state caching with Firestore real-time sync
- **Entity Layer:** Domain models in `src/entities/` (transaction utils, reconciliation)
- **Shared Layer:** Cross-cutting utilities, stores, and components in `src/shared/`

**Key Directories:**
```
src/features/       # Feature modules (scan, batch-review, transaction-editor, etc.)
src/entities/       # Domain entities (transaction)
src/shared/         # Shared stores, utilities, UI components
src/managers/       # Infrastructure (modal management)
src/contexts/       # React Context providers
src/views/          # Page-level view components
```

## Key Features

### 1. AI Receipt Scanning
- Multi-image upload support
- Google Gemini AI integration for OCR
- Intelligent date selection (closest to today)
- Structured JSON extraction

### 2. Smart Data Entry
- **Alias System:** Groups transactions from same merchant
- **Duplicate Detection:** Warns on same date/amount entries
- **Auto-Categorization:** Broad groups and specific subcategories
- **Store Category Assignment:** 14 predefined categories

### 3. Deep Analytics (Trends)
- **Hierarchical Drill-Down:** Year → Month → Category → Group → Subcategory
- **Interactive Charts:** Toggle between Pie (distribution) and Bar (timeline)
- **CSV Export:** Download specific datasets for Excel/Sheets

### 4. History & Management
- Paginated transaction list (20 per page)
- Full editing capabilities
- Database management tools (Factory Reset, Repair Data)

## Supported Locales

- **Currencies:** Chilean Peso (CLP), US Dollar (USD)
- **Languages:** Spanish, English
- **Date Formats:** LatAm (DD/MM/YYYY), US (MM/DD/YYYY)

## Repository Structure

```
boletapp/
├── src/                       # Source code
│   ├── features/              # Feature modules (scan, batch-review, etc.)
│   ├── entities/              # Domain entities (transaction)
│   ├── shared/                # Shared stores, utils, UI
│   ├── managers/              # Infrastructure (modal)
│   ├── contexts/              # React Context providers
│   ├── views/                 # Page-level components
│   ├── components/            # Shared UI components
│   ├── hooks/                 # App-level hooks
│   ├── services/              # External API integrations
│   ├── config/                # Configuration files
│   ├── App.tsx                # Main orchestrator (~2,191 lines)
│   └── main.tsx               # React DOM entry point
├── functions/                 # Firebase Cloud Functions
├── tests/                     # Test files (unit, integration)
├── docs/                      # Documentation
│   ├── architecture/          # Architecture docs
│   ├── reference/             # Reference docs (this file)
│   └── sprint-artifacts/      # Sprint planning & stories
├── _bmad/                     # BMAD framework
├── .github/                   # GitHub workflows
└── .vscode/                   # VSCode settings
```

## Getting Started

Refer to:
- [gemini_instructions.md](../archive/gemini_instructions.md) - Firebase setup and configuration
- [gemini_summary.md](../archive/gemini_summary.md) - Application functionality overview
- [Development Guide](../development/development-guide.md) - Local setup and commands

## Security & Privacy

- **User Isolation:** Data stored in path unique to User ID
- **Firebase Rules:** Users can only access their own transactions
- **Authentication:** Google Sign-In required
- **API Keys:** Must be configured per deployment

## Data Architecture

### Primary Collection Structure
```
/artifacts/{appId}/users/{userId}/transactions/{transactionId}
```

### Transaction Document Schema
- `merchant`: String (store name)
- `alias`: String (custom merchant grouping)
- `category`: String (store category)
- `date`: String (YYYY-MM-DD)
- `total`: Number (total amount)
- `currency`: String (CLP or USD)
- `items`: Array of objects (line items)
  - `name`: String
  - `price`: Number
  - `group`: String (broad category)
  - `subcat`: String (specific subcategory)
- `timestamp`: Firestore serverTimestamp

## Links

- [Architecture Documentation](./architecture.md)
- [Data Models](./data-models.md)
- [API Contracts](./api-contracts.md)
- [Component Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)

---

*Generated by BMAD Document Project Workflow*
*Last Updated: 2026-02-01 (Epic 14e Feature Architecture)*
