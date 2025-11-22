# Project Overview: Boletapp

## Executive Summary

**Boletapp** is a Smart Expense Tracker Progressive Web Application (PWA) designed to automate receipt entry using AI. The application focuses on capturing detailed spending data at the item level while providing high-level analytics to track spending patterns over time.

## Project Information

- **Project Name:** boletapp
- **Project Type:** Expense Tracker PWA
- **Architecture:** Single-Page Application (SPA)
- **Repository Structure:** Monolith
- **Primary Language:** TypeScript/JavaScript (React)
- **Status:** Brownfield Project

## Purpose

The application enables users to:
- **AI Receipt Scanning:** Automatically extract merchant names, dates, amounts, and line items from receipt photos
- **Smart Data Entry:** Intelligent categorization with alias system and duplicate detection
- **Deep Analytics:** Hierarchical drill-down analytics with interactive charts
- **Data Management:** Full transaction history with editing capabilities

## Technology Stack Summary

| Category | Technology | Version/Details | Justification |
|----------|-----------|----------------|---------------|
| **Frontend Framework** | React | 18.x | Component-based UI with hooks |
| **Language** | TypeScript/JSX | ES6+ | Type-safe development |
| **UI Library** | Lucide React | Latest | Modern icon system |
| **Styling** | Tailwind CSS | Utility classes | Inline utility-first CSS |
| **Backend/Database** | Firebase Firestore | Latest | Real-time NoSQL database |
| **Authentication** | Firebase Auth | Latest | Google OAuth integration |
| **AI Integration** | Google Gemini AI | 2.5-flash-preview | Receipt OCR and parsing |
| **Internationalization** | Native Intl API | Browser-native | Multi-currency (CLP, USD) |
| **Data Visualization** | Custom Charts | Recharts-style | Pie and bar charts |
| **Build Tool** | None (Single File) | N/A | Direct browser execution |

## Architecture Pattern

**Single-File Component Architecture**
- All application logic contained in [main.tsx](../main.tsx)
- Component-based structure using React functional and class components
- State management using React hooks (useState, useEffect, useRef)
- Error boundary pattern for fault tolerance

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
├── main.tsx                    # Single-file application
├── gemini_instructions.md      # Firebase & Gemini setup guide
├── gemini_summary.md          # Application overview
├── docs/                      # Generated documentation
│   ├── index.md              # Master index
│   ├── project-overview.md   # This file
│   └── ...                   # Other generated docs
├── .bmad/                    # BMAD framework (development methodology)
├── .github/                  # GitHub configuration
├── .claude/                  # Claude Code commands
└── .vscode/                  # VSCode settings
```

## Getting Started

Refer to:
- [gemini_instructions.md](../gemini_instructions.md) - Firebase setup and configuration
- [gemini_summary.md](../gemini_summary.md) - Application functionality overview
- [Development Guide](./development-guide.md) - Local setup and commands

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
*Date: 2025-11-20*
