#!/bin/bash
# pre-push hook — Direct push prevention
# Blocks pushes directly to protected branches.
# D-002 gate: "NEVER push directly to develop or main — use gh pr create + gh pr merge"

PROTECTED="main develop master"

while read local_ref local_sha remote_ref remote_sha; do
  branch=$(echo "$remote_ref" | sed 's|refs/heads/||')
  for pb in $PROTECTED; do
    if [ "$branch" = "$pb" ]; then
      echo "[HOOK] Direct push to '$branch' blocked."
      echo "  Use a PR workflow: gh pr create && gh pr merge"
      echo "  Or merge via: gh pr merge --merge --auto <PR_NUMBER>"
      exit 1
    fi
  done
done

exit 0
