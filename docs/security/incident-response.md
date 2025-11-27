# Security Incident Response Plan

**Project:** Boletapp - Smart Expense Tracker
**Version:** 1.0
**Last Updated:** 2025-11-27
**Epic:** 4 - Security Hardening & Penetration Testing

---

## Purpose

This document defines procedures for responding to security incidents affecting Boletapp. It provides guidelines for identifying, containing, eradicating, and recovering from security events.

---

## Severity Levels

### Level 1 - Critical

**Definition:** Immediate threat to user data, system availability, or financial impact.

**Examples:**
- Confirmed data breach
- Production credentials exposed
- Unauthorized access to user accounts
- Service completely unavailable

**Response Time:** Immediate (within 1 hour)

### Level 2 - High

**Definition:** Significant security risk requiring urgent attention.

**Examples:**
- Vulnerability actively being exploited
- API key exposed in public repository
- HIGH/CRITICAL dependency vulnerability with known exploit
- Authentication bypass discovered

**Response Time:** Within 4 hours

### Level 3 - Medium

**Definition:** Security issue requiring attention but not immediately exploitable.

**Examples:**
- Security misconfiguration discovered
- Moderate dependency vulnerability
- Unusual activity patterns detected
- Pre-commit hook disabled by contributor

**Response Time:** Within 24 hours

### Level 4 - Low

**Definition:** Minor security concern or improvement opportunity.

**Examples:**
- Security best practice not followed
- Documentation gap identified
- Low-severity vulnerability in dev dependency
- Security tool update available

**Response Time:** Within 1 week

---

## Incident Response Team

### Primary Contacts

| Role | Responsibility |
|------|----------------|
| Project Owner | Final decision authority, external communication |
| Lead Developer | Technical investigation and remediation |
| Security Lead | Security assessment and guidance |

### Escalation Path

```
1. Discoverer → Lead Developer
2. Lead Developer → Project Owner (if Level 1-2)
3. Project Owner → External parties (if required)
```

---

## Response Procedures

### Phase 1: Identification

**Objective:** Confirm the incident and assess severity.

**Actions:**

1. **Receive Report**
   - Document source of report (automated, user, external)
   - Record initial details and timestamp

2. **Verify Incident**
   - Confirm the security event is real
   - Distinguish between false positive and actual incident

3. **Assess Severity**
   - Determine severity level (1-4)
   - Identify affected systems and data
   - Estimate scope of impact

4. **Document**
   - Create incident ticket/issue
   - Record all findings with timestamps

### Phase 2: Containment

**Objective:** Limit the damage and prevent further impact.

**Actions by Incident Type:**

#### Exposed Credentials

1. **Immediate:**
   - Rotate the exposed credential
   - Revoke any active sessions using the credential
   - Check for unauthorized usage

2. **Firebase API Key:**
   ```bash
   # Add domain restriction in Firebase Console
   # Settings > General > Web API Key > Add restriction
   ```

3. **Gemini API Key:**
   ```bash
   # Regenerate key in Google Cloud Console
   # Update Firebase Functions config
   firebase functions:config:set gemini.api_key="NEW_KEY"
   firebase deploy --only functions
   ```

#### Data Breach

1. **Immediate:**
   - Identify affected users
   - Preserve evidence (logs, access records)
   - Consider temporary service suspension if ongoing

2. **Firestore:**
   - Review recent access patterns
   - Check security rules for gaps
   - Identify compromised data scope

#### Unauthorized Access

1. **Immediate:**
   - Disable compromised account
   - Revoke active sessions
   - Enable additional security if available

2. **Investigation:**
   - Review authentication logs
   - Check for pattern of access
   - Identify entry point

### Phase 3: Eradication

**Objective:** Remove the threat and fix the underlying vulnerability.

**Actions:**

1. **Root Cause Analysis**
   - Identify how the incident occurred
   - Document the vulnerability or failure

2. **Fix Implementation**
   - Develop and test the fix
   - Peer review security changes
   - Deploy to production

3. **Verification**
   - Confirm the vulnerability is resolved
   - Test that fix doesn't introduce new issues

### Phase 4: Recovery

**Objective:** Restore normal operations and monitor for recurrence.

**Actions:**

1. **Service Restoration**
   - Restore any suspended services
   - Verify all systems functioning normally

2. **User Communication** (if affected)
   - Notify affected users if required
   - Provide guidance on protective actions

3. **Monitoring**
   - Increase monitoring for related issues
   - Watch for signs of recurrence

### Phase 5: Post-Incident

**Objective:** Learn from the incident and improve defenses.

**Actions:**

1. **Incident Report**
   - Document complete timeline
   - Record root cause and resolution
   - Note lessons learned

2. **Process Improvement**
   - Update procedures if needed
   - Add new monitoring/alerts
   - Consider additional security controls

3. **Training**
   - Share learnings with team
   - Update security documentation

---

## Specific Procedures

### Credential Rotation

#### Firebase API Key

1. The Firebase API key is safe if exposed (domain-restricted)
2. Add additional restrictions in Firebase Console if needed
3. Monitor for unexpected API usage

#### Gemini API Key (Cloud Functions)

```bash
# 1. Generate new key in Google Cloud Console
# 2. Update Firebase Functions config
firebase functions:config:set gemini.api_key="NEW_API_KEY"

# 3. Verify config
firebase functions:config:get

# 4. Deploy updated function
firebase deploy --only functions

# 5. Delete old key in Google Cloud Console
```

#### Firebase Service Account

If a service account key is compromised:

1. Go to Google Cloud Console → IAM → Service Accounts
2. Delete the compromised key
3. Generate a new key if needed
4. Update any systems using the key
5. Review access logs for unauthorized usage

### Data Breach Response

1. **Identify Scope**
   - Which users affected?
   - What data exposed?
   - How long was access possible?

2. **Evidence Preservation**
   - Export relevant Firestore access logs
   - Save Cloud Function invocation logs
   - Document timeline

3. **Notification Requirements**
   - Assess legal notification requirements
   - Prepare user notification if required
   - Document all communications

### Dependency Vulnerability Response

1. **Assessment**
   ```bash
   # Run npm audit
   npm audit

   # Check if vulnerability is exploitable
   # Review advisory for affected versions and fix
   ```

2. **Remediation**
   ```bash
   # Attempt automatic fix
   npm audit fix

   # For breaking changes
   npm audit fix --force

   # Manual update if needed
   npm update <package>
   ```

3. **Verification**
   ```bash
   # Confirm fix
   npm audit --audit-level=high

   # Run tests
   npm run test:all
   ```

---

## Contact Information

### Internal

| Role | Contact Method |
|------|----------------|
| Project Owner | GitHub repository |
| Lead Developer | GitHub repository |

### External Resources

| Resource | Purpose |
|----------|---------|
| [Firebase Support](https://firebase.google.com/support) | Firebase service issues |
| [Google Cloud Support](https://cloud.google.com/support) | Cloud Functions, API issues |
| [GitHub Security](https://github.com/security) | Repository security |

---

## Incident Log Template

```markdown
## Incident Report: [Brief Title]

**Date:** YYYY-MM-DD
**Severity:** Level X
**Status:** Open/Resolved

### Summary
[Brief description of the incident]

### Timeline
- HH:MM - [Event]
- HH:MM - [Event]
- HH:MM - [Event]

### Impact
- Users affected: [Number/scope]
- Data affected: [Description]
- Duration: [Time period]

### Root Cause
[Description of what caused the incident]

### Resolution
[What was done to fix it]

### Lessons Learned
- [Lesson 1]
- [Lesson 2]

### Action Items
- [ ] [Action 1]
- [ ] [Action 2]
```

---

## Appendix: Security Monitoring

### Firebase Console

- Authentication → Usage → Monitor for unusual patterns
- Firestore → Usage → Monitor read/write volumes
- Functions → Logs → Monitor for errors and unusual calls

### GitHub

- Security → Dependabot alerts
- Security → Code scanning alerts
- Insights → Traffic → Monitor for unusual activity

### CI/CD

- Actions → Workflow runs → Monitor for failures
- Security steps (gitleaks, npm audit) → Check for blocked PRs

---

**Document Version:** 1.0
**Created:** 2025-11-27
**Review Frequency:** Annually or after significant incidents
**Epic:** 4 - Security Hardening & Penetration Testing
**Story:** 4.4 - Security Documentation
