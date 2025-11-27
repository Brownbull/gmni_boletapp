# Deployment Quick Reference - Boletapp

**Last Updated:** 2025-11-26 (Story 4.2 - Cloud Functions Added)

## Quick Deploy Checklist

### Prerequisites ✓
- [ ] Firebase project on **Blaze Plan**
- [ ] Gemini API key configured
- [ ] Firebase CLI installed (`npm install -g firebase-tools`)
- [ ] Logged in to Firebase (`firebase login`)

---

## Production Deployment

### Full Stack Deploy (Hosting + Functions)

```bash
# 1. Build the application
npm run build

# 2. Deploy everything
firebase deploy --only hosting,functions

# 3. Verify deployment
firebase functions:list
curl -I https://YOUR-PROJECT.web.app
```

**Time:** ~3-5 minutes

---

### Deploy Only Hosting (Frontend Updates)

```bash
# When you've only changed client code
npm run build
firebase deploy --only hosting
```

**Time:** ~1-2 minutes
**Use when:** Updating UI, fixing frontend bugs, changing styles

---

### Deploy Only Functions (Backend Updates)

```bash
# When you've only changed Cloud Functions
cd functions
npm run build
cd ..
firebase deploy --only functions
```

**Time:** ~2-3 minutes
**Use when:** Updating API logic, changing Gemini prompts, modifying auth

---

## First-Time Setup

### 1. Enable Blaze Plan
```bash
# Check current plan
firebase projects:list

# Upgrade at:
# https://console.firebase.google.com/project/YOUR_PROJECT/usage/details
```

### 2. Configure Gemini API Key
```bash
# Set in Firebase Functions config
firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"

# Create local runtime config for testing
cat > functions/.runtimeconfig.json << EOF
{
  "gemini": {
    "api_key": "YOUR_GEMINI_API_KEY"
  }
}
EOF
```

### 3. Initialize Functions
```bash
# Install dependencies
cd functions
npm install
npm run build
cd ..
```

### 4. Deploy
```bash
firebase deploy
```

---

## Common Scenarios

### Scenario: Hotfix Deployment (Urgent Bug Fix)

```bash
# 1. Fix the bug in code
# 2. Test locally
npm run dev

# 3. Build and deploy immediately
npm run build
firebase deploy --only hosting

# 4. Verify fix
curl https://YOUR-PROJECT.web.app
```

**Time:** 2-3 minutes

---

### Scenario: API Key Rotation

```bash
# 1. Get new Gemini API key from Google AI Studio

# 2. Update Firebase Functions config
firebase functions:config:set gemini.api_key="NEW_API_KEY"

# 3. Redeploy functions
firebase deploy --only functions

# 4. Test receipt scanning
# (No client changes needed - key is server-side only)
```

**Time:** 3-4 minutes

---

### Scenario: Rollback to Previous Version

```bash
# Option 1: Hosting Rollback
firebase hosting:channel:list
firebase hosting:rollback

# Option 2: Redeploy from Git
git checkout <previous-commit>
npm run build
firebase deploy --only hosting
git checkout develop  # Return to current branch
```

**Time:** 3-5 minutes

---

## Verification Commands

### Check What's Deployed

```bash
# List deployed functions
firebase functions:list

# Check hosting URL
firebase hosting:channel:list

# Get latest deployment info
firebase projects:list
```

### Test Deployment

```bash
# Test hosting
curl -I https://YOUR-PROJECT.web.app
# Should return: HTTP/2 200

# Check bundle for security issues
curl -s "https://YOUR-PROJECT.web.app/assets/index-*.js" | grep -c "GEMINI_API_KEY"
# Should return: 0 (API key should NOT be in bundle)

# View function logs
firebase functions:log --only analyzeReceipt
```

---

## Deployment URLs

### Production
- **Hosting:** https://boletapp-d609f.web.app
- **Console:** https://console.firebase.google.com/project/boletapp-d609f
- **Functions:** us-central1 region

### Staging (Optional)
```bash
# Create staging channel
firebase hosting:channel:deploy staging --expires 7d

# Will output URL like:
# https://boletapp-d609f--staging-xyz123.web.app
```

---

## Cost Monitoring

### Check Current Usage
```bash
# In Firebase Console:
# https://console.firebase.google.com/project/YOUR_PROJECT/usage/details

# Monitor:
# - Hosting bandwidth
# - Function invocations
# - Firestore reads/writes
```

### Set Budget Alerts
1. Go to Firebase Console → Usage
2. Click "Details & Settings"
3. Set up billing budgets
4. Configure email alerts

**Recommended Budgets:**
- Small project: $10/month
- Medium project: $50/month
- Large project: $200/month

---

## File Structure Reference

```
boletapp/
├── dist/                      # Built frontend (deploy this)
│   ├── index.html
│   └── assets/
│       └── index-*.js
│
├── functions/                 # Cloud Functions
│   ├── src/
│   │   ├── analyzeReceipt.ts # Receipt scanning logic
│   │   └── index.ts          # Function exports
│   ├── lib/                   # Compiled JS (generated)
│   ├── package.json
│   └── .runtimeconfig.json    # Local config (git-ignored)
│
├── firebase.json              # Firebase config
└── .firebaserc               # Project aliases
```

---

## Environment Variables

### Client (via .env - git-ignored)
```bash
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456
VITE_FIREBASE_APP_ID=1:123456:web:abc123

# NOTE: No VITE_GEMINI_API_KEY - it's server-side only!
```

### Server (Firebase Functions Config)
```bash
# Set via CLI (not in files)
firebase functions:config:set gemini.api_key="AIza..."

# Check current config
firebase functions:config:get
```

---

## Troubleshooting

### Build Fails
```bash
# Clean and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Functions Deploy Fails
```bash
# Check Blaze plan status
firebase projects:list

# Rebuild functions
cd functions
rm -rf lib node_modules
npm install
npm run build
cd ..
firebase deploy --only functions
```

### API Key Not Working
```bash
# Verify config is set
firebase functions:config:get

# If empty, set it
firebase functions:config:set gemini.api_key="YOUR_KEY"

# Redeploy
firebase deploy --only functions
```

### "Permission Denied" on Firestore
- Check Firestore security rules in Firebase Console
- Ensure user is authenticated
- Verify userId matches in request

---

## Security Checklist

Before deploying to production:

- [ ] No API keys in client bundle
- [ ] Firestore security rules tested
- [ ] Firebase Auth configured with correct domains
- [ ] Cloud Function requires authentication
- [ ] `.env` file is git-ignored
- [ ] `.runtimeconfig.json` is git-ignored
- [ ] Budget alerts configured

---

## Need Help?

- **Full Guide:** [deployment-guide.md](./deployment-guide.md)
- **Architecture:** [../architecture/architecture.md](../architecture/architecture.md)
- **Security:** [../security/secrets-scan-report.md](../security/secrets-scan-report.md)
- **CI/CD:** [../ci-cd/README.md](../ci-cd/README.md)

---

*Generated: 2025-11-26*
*Story: 4.2 - Gemini API Protection*
*Last Deploy: Includes Cloud Functions for secure receipt scanning*
