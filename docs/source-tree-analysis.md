# Source Tree Analysis: Boletapp

## Directory Structure

```
boletapp/                                    # Project root
├── main.tsx                                 # 🎯 MAIN ENTRY POINT - Single-file application
│                                           # Contains ALL app logic, components, and state
│
├── gemini_instructions.md                   # 📋 Setup guide for Firebase & Gemini API
├── gemini_summary.md                       # 📋 Application feature overview
│
├── docs/                                   # 📚 Generated documentation
│   ├── index.md                           # Master documentation index
│   ├── project-overview.md                 # Project summary
│   ├── architecture.md                     # Architecture documentation
│   ├── source-tree-analysis.md             # This file
│   ├── component-inventory.md              # UI component catalog
│   ├── development-guide.md                # Setup and dev instructions
│   ├── data-models.md                      # Database schema
│   ├── api-contracts.md                    # External API integrations
│   ├── bmm-workflow-status.yaml            # BMAD workflow tracking
│   └── project-scan-report.json            # Workflow state file
│
├── .bmad/                                  # ⚙️ BMAD framework (AI-assisted dev methodology)
│   ├── core/                              # Core BMAD modules
│   ├── bmb/                               # BMAD Builder module
│   ├── bmm/                               # BMAD Method module (project workflows)
│   ├── cis/                               # Creative & Innovation module
│   └── _cfg/                              # Configuration and agent definitions
│
├── .github/                                # 🔧 GitHub configuration
│   └── chatmodes/                         # BMAD agent chat mode definitions
│
├── .claude/                                # 🤖 Claude Code slash commands
│   └── commands/                          # BMAD workflow commands
│
└── .vscode/                                # 🛠️ VSCode editor settings
```

## Critical Files

### Application Files

#### **main.tsx** (Single-File Application)
- **Location:** `/main.tsx`
- **Size:** ~47KB (1400+ lines)
- **Purpose:** Complete React application in single file
- **Contents:**
  - Configuration (Firebase, Gemini API)
  - Error Boundary component
  - Utility functions (currency, date formatting, CSV export)
  - Color management utilities
  - Gemini AI integration
  - Firebase Auth logic
  - Firebase Firestore operations
  - Main App component
  - All UI components inline
  - State management (React hooks)
  - Routing logic (view-based navigation)

### Documentation Files

#### **gemini_instructions.md**
- **Location:** `/gemini_instructions.md`
- **Purpose:** Setup guide for Firebase project and Gemini API integration
- **Content:** Step-by-step instructions with configuration examples

#### **gemini_summary.md**
- **Location:** `/gemini_summary.md`
- **Purpose:** High-level application overview and workflow descriptions
- **Content:** Feature descriptions, user workflows, data safety mechanisms

## Application Structure (within main.tsx)

### 1. Configuration Section (Lines 1-50)
```typescript
// Imports
import React from 'react'
import { Camera, Plus, ... } from 'lucide-react'
import { initializeApp } from 'firebase/app'
import { getAuth, ... } from 'firebase/auth'
import { getFirestore, ... } from 'firebase/firestore'

// Firebase Config
const firebaseConfig = { ... }

// Gemini API Config
const GEMINI_API_KEY = "..."
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025"

// Constants
const STORE_CATEGORIES = [...]
const ITEMS_PER_PAGE = 20
```

### 2. Error Handling (Lines 52-69)
```typescript
class ErrorBoundary extends Component {
  // Global error boundary for fault tolerance
}
```

### 3. Utility Functions (Lines 71-135)
- `cleanJson()` - Parse Gemini AI responses
- `parseStrictNumber()` - Sanitize numeric input
- `getSafeDate()` - Handle various date formats
- `formatCurrency()` - Intl-based currency formatting
- `formatDate()` - Localized date display
- `exportToCSV()` - Data export functionality
- `stringToColor()` / `getColor()` - Dynamic color generation

### 4. API Integration (Lines 136-250)
```typescript
async function analyzeWithGemini(images, currency) {
  // Gemini AI API calls for receipt OCR
}
```

### 5. Main Application Component (Lines 251+)
```typescript
function App() {
  // State management
  const [user, setUser] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [view, setView] = useState('home')
  // ... 50+ state variables

  // Firebase initialization
  useEffect(() => {
    const app = initializeApp(firebaseConfig)
    const auth = getAuth(app)
    const db = getFirestore(app)
    // ...
  }, [])

  // Render logic with inline components
  return (
    <ErrorBoundary>
      {!user ? <LoginScreen /> : <MainApp />}
    </ErrorBoundary>
  )
}
```

### 6. View Components (Inline)
- **LoginScreen** - Google OAuth UI
- **HomeView** - Transaction summary dashboard
- **ScanView** - Camera/upload interface
- **EditView** - Transaction editor
- **HistoryView** - Paginated transaction list
- **TrendsView** - Analytics and charts
- **SettingsView** - App configuration

### 7. UI Components (Inline)
- **Header** - Top navigation bar
- **BottomNav** - Bottom tab navigation
- **Modal** - Generic modal wrapper
- **PieChart** - Custom pie chart component
- **BarChart** - Grouped bar chart component
- **LoadingSpinner** - Loading state indicator
- **ErrorAlert** - Error message display

## Key Integration Points

### Firebase Integration
- **Entry Point:** `useEffect` hook in App component
- **Services Used:**
  - Firebase Auth (Google Sign-In)
  - Firestore (Real-time database)
- **Data Path:** `/artifacts/{appId}/users/{userId}/transactions`

### Gemini AI Integration
- **Entry Point:** `analyzeWithGemini()` function
- **API Endpoint:** `generativelanguage.googleapis.com`
- **Model:** gemini-2.5-flash-preview-09-2025
- **Purpose:** Receipt OCR and structured data extraction

### State Management
- **Pattern:** React Hooks (useState, useEffect, useRef)
- **Scope:** All state in App component
- **Persistence:** Firebase Firestore (real-time sync)

## Build & Deployment

### Build Process
- **Type:** No build step (single-file SPA)
- **Execution:** Direct browser rendering of JSX/TSX
- **Dependencies:** Loaded via ESM imports from CDN or bundled

### Deployment Considerations
1. Host `main.tsx` on web server or use React build tool
2. Configure Firebase project credentials
3. Add Gemini API key
4. Set up Firebase security rules
5. Configure CORS if needed

## Directory Navigation

For AI-assisted development:
- **Main application code:** [main.tsx](../main.tsx)
- **Setup instructions:** [gemini_instructions.md](../gemini_instructions.md)
- **Feature overview:** [gemini_summary.md](../gemini_summary.md)
- **Documentation:** [docs/](./index.md)

---

*Generated by BMAD Document Project Workflow*
*Date: 2025-11-20*
