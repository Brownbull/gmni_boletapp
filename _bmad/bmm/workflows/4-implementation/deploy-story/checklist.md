# Deploy Story Validation Checklist

## Pre-Deployment Checks

### Story Readiness
- [ ] Story status is "done"
- [ ] All acceptance criteria marked as implemented
- [ ] Code review has been approved
- [ ] All tests passing
- [ ] No uncommitted changes in working directory

### Git State
- [ ] Current branch identified
- [ ] Origin is reachable
- [ ] No merge conflicts anticipated

### Atlas Validation
- [ ] Atlas memory loaded
- [ ] Workflow chains identified for this story
- [ ] Architectural alignment verified
- [ ] No critical conflicts detected

## Deployment Pipeline Checks

### Develop Branch (Step 1/3)
- [ ] Feature branch merged to develop
- [ ] Push to origin successful
- [ ] Vercel deployment triggered
- [ ] Develop environment accessible
- [ ] Basic functionality verified

### Staging Branch (Step 2/3)
- [ ] Develop merged to staging
- [ ] Push to origin successful
- [ ] Vercel deployment triggered
- [ ] Staging environment accessible
- [ ] Pre-production testing complete

### Production Branch (Step 3/3)
- [ ] Staging merged to main
- [ ] Push to origin successful
- [ ] Vercel deployment triggered
- [ ] Production environment accessible
- [ ] Production health check passed

## Post-Deployment Checks

### Branch Cleanup
- [ ] Feature branch deleted locally (if applicable)
- [ ] Feature branch deleted from origin (if applicable)

### Knowledge Sync
- [ ] Atlas memory updated with deployment nugget
- [ ] Sprint status file updated
- [ ] Story marked as "deployed"

### Verification
- [ ] Production URL responds correctly
- [ ] No errors in Vercel logs
- [ ] User can access deployed feature

## Rollback Considerations

If deployment fails at any stage:
1. **Develop fails:** Feature branch still exists, no action needed
2. **Staging fails:** Develop is clean, can debug in isolation
3. **Production fails:** Staging is clean, can revert main to previous commit

### Emergency Rollback Commands
```bash
# Revert production to previous commit
git checkout main
git revert HEAD
git push origin main

# Or hard reset (destructive)
git checkout main
git reset --hard HEAD~1
git push origin main --force
```

## Deployment Frequency Guidelines

| Scenario | Recommendation |
|----------|----------------|
| Single story completed | Deploy immediately |
| Multiple stories ready | Deploy individually or batch |
| End of sprint | Ensure all done stories deployed |
| Hotfix needed | Deploy directly to main (emergency) |

## Atlas Integration Notes

Atlas participates in deployment by:
1. **Pre-validation:** Checking for architectural conflicts
2. **Workflow analysis:** Identifying affected user journeys
3. **Knowledge capture:** Recording deployment to memory
4. **Future reference:** Enabling questions like "When was X deployed?"
