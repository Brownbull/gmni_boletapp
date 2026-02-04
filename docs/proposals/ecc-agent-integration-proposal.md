# Proposal: ECC-Inspired Specialized Agents for BMAD

**Date:** 2026-02-02
**Status:** Draft
**Source Analysis:** [Everything Claude Code Repository](https://github.com/affaan-m/everything-claude-code)

---

## Executive Summary

This proposal outlines the integration of four specialized agents from the Everything Claude Code (ECC) repository into BMAD. These agents fill operational gaps in the current BMAD agent roster, providing focused expertise for security, database optimization, build error resolution, and code cleanup.

**Key Benefits:**
- Proactive security analysis before production deployment
- Database-specific expertise for Firestore/PostgreSQL optimization
- Faster build error resolution with minimal code changes
- Systematic dead code removal and bundle size optimization

---

## 1. Gap Analysis: Current BMAD vs Proposed Additions

### Current BMAD Agents

| Agent | Primary Role | Operational Coverage |
|-------|-------------|---------------------|
| **pm** | Product Manager | Requirements, PRD creation |
| **architect** | Architect | System design, tech decisions |
| **dev** | Developer | Story implementation, code |
| **tea** | Test Architect | Test strategy, quality gates |
| **sm** | Scrum Master | Sprint management, workflows |
| **analyst** | Business Analyst | Research, documentation |
| **ux-designer** | UX Designer | User experience, wireframes |
| **tech-writer** | Tech Writer | Documentation |

### Identified Gaps

| Gap Area | Current Coverage | Proposed Solution |
|----------|-----------------|-------------------|
| **Security Analysis** | None | `security-reviewer` agent |
| **Database Optimization** | Partial (architect) | `database-reviewer` agent |
| **Build Error Fixing** | Implicit (dev) | `build-error-resolver` agent |
| **Code Cleanup** | None | `refactor-cleaner` agent |

---

## 2. Proposed Agents

### 2.1 Security Reviewer Agent

**Purpose:** Proactive security vulnerability detection and remediation specialist.

**BMAD Integration Points:**
- **code-review workflow** - Add security review step
- **dev-story workflow** - Automated security check post-implementation
- **deploy-story workflow** - Security gate before deployment

**When to Invoke (Proactive):**
- After writing code that handles user input
- Changes to authentication/authorization
- API endpoints accepting external data
- Database queries with user parameters
- File upload handlers
- Payment/financial code

**Proposed Menu Items:**
```
[SR] Security Review - Run OWASP Top 10 analysis on current changes
[SA] Security Audit - Full codebase security scan
```

**Knowledge Fragments Required:**
```
_bmad/bmm/security-reviewer/knowledge/
├── owasp-top-10.md          # OWASP checklist and detection patterns
├── secrets-detection.md      # Hardcoded secrets patterns
├── firebase-security.md      # Firebase/Firestore security rules
├── api-security.md           # API endpoint security patterns
└── remediation-patterns.md   # Fix templates for common vulnerabilities
```

**Tool Requirements:**
- Read, Write, Edit, Bash, Grep, Glob
- npm audit, eslint-plugin-security (external)

**Workflow Integration:**

```yaml
# In code-review/workflow.yaml, add step:
- step: "Security Review"
  action: "Invoke security-reviewer agent for OWASP analysis"
  gate: "Block if CRITICAL or HIGH issues found"
  output: "security-review-report.md"
```

---

### 2.2 Database Reviewer Agent

**Purpose:** Database design, query optimization, and security specialist.

**BMAD Integration Points:**
- **architect workflows** - Database schema review during architecture
- **code-review workflow** - Query performance analysis
- **dev-story workflow** - Automatic index recommendations

**When to Invoke (Proactive):**
- Schema migrations
- New database queries
- Firestore security rules changes
- N+1 query patterns detected
- Performance-critical code

**Proposed Menu Items:**
```
[DR] Database Review - Analyze queries and schema in current changes
[DI] Index Analysis - Recommend missing indexes
[DS] Schema Review - Review database schema design
```

**Knowledge Fragments Required:**
```
_bmad/bmm/database-reviewer/knowledge/
├── firestore-patterns.md     # Firestore best practices
├── security-rules.md         # Firestore security rules patterns
├── query-optimization.md     # Query performance patterns
├── index-patterns.md         # Indexing strategies
├── data-modeling.md          # Data modeling for NoSQL
└── migration-patterns.md     # Safe migration strategies
```

**Firestore-Specific Adaptations:**
The ECC database-reviewer is PostgreSQL/Supabase focused. For Boletapp, adapt to:
- Firestore composite indexes
- Security rules optimization
- Subcollection vs. root collection decisions
- Query denormalization patterns

---

### 2.3 Build Error Resolver Agent

**Purpose:** TypeScript/build error resolution with minimal diffs.

**BMAD Integration Points:**
- **dev-story workflow** - Call when build fails
- Standalone for build debugging sessions

**When to Invoke (Proactive):**
- `npm run build` fails
- TypeScript errors blocking development
- CI pipeline failures
- Module resolution errors

**Proposed Menu Items:**
```
[BF] Build Fix - Analyze and fix current build errors
[TF] Type Fix - Fix TypeScript errors with minimal changes
```

**Knowledge Fragments Required:**
```
_bmad/bmm/build-error-resolver/knowledge/
├── typescript-errors.md      # Common TS error patterns and fixes
├── react-errors.md           # React/hooks error patterns
├── vite-errors.md            # Vite bundler specific errors
├── firebase-build.md         # Firebase Functions build issues
└── minimal-diff-strategy.md  # Philosophy for minimal changes
```

**Key Philosophy:**
```
DO:
✅ Add type annotations where missing
✅ Add null checks where needed
✅ Fix imports/exports
✅ Add missing dependencies

DON'T:
❌ Refactor unrelated code
❌ Change architecture
❌ Rename variables (unless causing error)
❌ Add new features
❌ Improve code style
```

---

### 2.4 Refactor Cleaner Agent

**Purpose:** Dead code cleanup and codebase consolidation.

**BMAD Integration Points:**
- **retrospective workflow** - Post-epic cleanup pass
- Standalone for maintenance sessions

**When to Invoke:**
- After epic completion
- Before major releases
- Technical debt sprints
- Bundle size concerns

**Proposed Menu Items:**
```
[RC] Refactor Clean - Run dead code analysis and cleanup
[DC] Dependency Check - Find unused npm dependencies
[DU] Duplicate Detection - Find and consolidate duplicates
```

**Knowledge Fragments Required:**
```
_bmad/bmm/refactor-cleaner/knowledge/
├── detection-tools.md        # knip, depcheck, ts-prune usage
├── deletion-log-format.md    # Tracking removed code
├── safety-checklist.md       # Pre-removal validation
├── dynamic-import-patterns.md # Detecting non-obvious usage
└── bundle-analysis.md        # Analyzing bundle size impact
```

**Deletion Log Template:**
```markdown
## [YYYY-MM-DD] Cleanup Session

### Unused Dependencies Removed
- package-name@version - Reason: Never imported

### Unused Files Deleted
- src/old-component.tsx - Replaced by: src/new-component.tsx

### Impact
- Files deleted: 15
- Dependencies removed: 5
- Bundle size reduction: ~45 KB
```

---

## 3. Architecture Integration

### 3.1 File Structure

```
_bmad/bmm/agents/
├── existing agents...
├── security-reviewer.md      # NEW
├── database-reviewer.md      # NEW
├── build-error-resolver.md   # NEW
└── refactor-cleaner.md       # NEW

_bmad/bmm/security-reviewer/
├── knowledge/
│   ├── owasp-top-10.md
│   ├── secrets-detection.md
│   └── ...
└── index.csv                 # Knowledge fragment index

_bmad/bmm/database-reviewer/
├── knowledge/
│   └── ...
└── index.csv

_bmad/bmm/build-error-resolver/
├── knowledge/
│   └── ...
└── index.csv

_bmad/bmm/refactor-cleaner/
├── knowledge/
│   └── ...
└── index.csv
```

### 3.2 Agent Format Decision

**Option A: Full BMAD XML Format (Recommended)**
- Consistent with existing BMAD agents
- Menu-driven interaction
- Workflow integration via handlers
- Memory system for context

**Option B: Simplified ECC Format**
- YAML frontmatter + Markdown body
- Direct invocation without menu
- Tool-focused, operational
- Faster for quick tasks

**Recommendation:** Use Option A for consistency, but add a "Quick Mode" flag that bypasses menu for direct operation when invoked from other workflows.

### 3.3 Invocation Patterns

**Manual Invocation:**
```
/bmad:bmm:agents:security-reviewer
```

**Automatic Invocation (from workflows):**
```yaml
# In code-review workflow
- step: "Security Analysis"
  invoke: "security-reviewer"
  mode: "quick"  # Bypass menu, execute directly
  output: "security-report.md"
```

---

## 4. Workflow Integration Matrix

| Workflow | Security | Database | Build | Refactor |
|----------|----------|----------|-------|----------|
| dev-story | Post-impl check | Query review | On failure | - |
| code-review | **REQUIRED** | On DB changes | - | - |
| deploy-story | Security gate | - | - | - |
| retrospective | - | - | - | Cleanup pass |
| create-architecture | - | Schema review | - | - |
| testarch-automate | - | - | - | - |

### 4.1 Code Review Enhancement

Current code-review workflow focuses on:
- Code quality
- Test coverage
- Architecture compliance

**Add these phases:**
1. **Security Review Phase** (security-reviewer)
   - OWASP Top 10 check
   - Secrets detection
   - Input validation verification

2. **Database Review Phase** (database-reviewer) - *conditional*
   - Only when DB-related files changed
   - Query performance analysis
   - Index recommendations

### 4.2 Dev Story Enhancement

Add automatic checks:
```yaml
# Post-implementation hooks
post_implementation:
  - name: "Build Check"
    on_failure: invoke build-error-resolver

  - name: "Security Check"
    condition: "files_changed_match('**/api/**', '**/auth/**', '**/services/**')"
    invoke: security-reviewer
    mode: quick
```

---

## 5. Knowledge Base Extraction

### From ECC security-reviewer (highest value):

**OWASP Top 10 Checklist:**
```markdown
1. Injection - Are queries parameterized?
2. Broken Authentication - Passwords hashed? JWT validated?
3. Sensitive Data Exposure - HTTPS enforced? Secrets in env?
4. XXE - XML parsers configured securely?
5. Broken Access Control - Auth checked on every route?
6. Security Misconfiguration - Debug mode disabled?
7. XSS - Output escaped/sanitized?
8. Insecure Deserialization - User input deserialized safely?
9. Using Vulnerable Components - npm audit clean?
10. Insufficient Logging - Security events logged?
```

**Vulnerability Patterns with Fixes:**
- Hardcoded secrets → Environment variables
- SQL injection → Parameterized queries
- XSS → Content escaping / DOMPurify
- SSRF → URL whitelisting
- Race conditions → Atomic transactions

### From ECC database-reviewer:

**Firebase/Firestore Adaptations:**
- Security rules patterns
- Composite index strategies
- Denormalization patterns
- Subcollection query optimization

### From ECC build-error-resolver:

**TypeScript Error Pattern Library:**
- Type inference failures → Add annotations
- Null/undefined errors → Optional chaining
- Import errors → Path resolution
- React hooks errors → Hook rules compliance

### From ECC refactor-cleaner:

**Tool Integration:**
```bash
# Dead code detection
npx knip                    # Unused exports/files/deps
npx depcheck                # Unused npm dependencies
npx ts-prune                # Unused TypeScript exports
```

---

## 6. Implementation Phases

### Phase 1: Security Reviewer (Week 1)
- Create agent file
- Extract OWASP knowledge
- Integrate with code-review workflow
- Test on recent PRs

### Phase 2: Database Reviewer (Week 2)
- Create agent file
- Adapt PostgreSQL patterns to Firestore
- Add index analysis workflow
- Integrate with architect workflows

### Phase 3: Build Error Resolver (Week 3)
- Create agent file
- Extract TypeScript error patterns
- Add quick-fix mode
- Integrate with dev-story failure handling

### Phase 4: Refactor Cleaner (Week 4)
- Create agent file
- Extract cleanup workflows
- Add deletion log system
- Integrate with retrospective workflow

---

## 7. Success Metrics

| Metric | Target |
|--------|--------|
| Security issues caught pre-deploy | 90%+ |
| Build error resolution time | < 5 min |
| Dead code removed per epic | > 500 LOC |
| Database query optimizations | 2+ per story |

---

## 8. Risk Assessment

| Risk | Mitigation |
|------|------------|
| Agent overload (too many agents) | Use "quick mode" for automatic invocation |
| Inconsistent with BMAD style | Follow XML persona format strictly |
| Knowledge fragmentation | Centralize in agent-specific knowledge/ folders |
| False positives in security | Tuned thresholds, human review required |

---

## 9. Appendix: ECC Source References

### Files to Reference:
- [security-reviewer.md](~/projects/ecc/agents/security-reviewer.md) - Full OWASP coverage
- [database-reviewer.md](~/projects/ecc/agents/database-reviewer.md) - PostgreSQL patterns
- [build-error-resolver.md](~/projects/ecc/agents/build-error-resolver.md) - TS error patterns
- [refactor-cleaner.md](~/projects/ecc/agents/refactor-cleaner.md) - Cleanup workflows
- [tdd-guide.md](~/projects/ecc/agents/tdd-guide.md) - TDD patterns (for reference)
- [e2e-runner.md](~/projects/ecc/agents/e2e-runner.md) - E2E patterns (for TEA enhancement)

---

## 10. Approval & Next Steps

**Approval Required From:** [Project Owner]

**Next Steps After Approval:**
1. Create security-reviewer agent (highest priority)
2. Test integration with code-review workflow
3. Iterate and adjust based on feedback
4. Proceed with remaining agents

---

*Proposal created by analyzing ECC repository patterns and mapping to BMAD architecture.*