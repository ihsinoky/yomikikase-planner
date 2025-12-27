# ⚠️ Action Required: Push Legacy Branch and Tag

## Background
As part of Issue #3 ([Sprint0] legacy凍結), a legacy branch and tag have been created locally to preserve the Next.js/Prisma implementation before transitioning to the new architecture.

## What Has Been Done
- ✅ Created branch `legacy/nextjs-2025-12` from main
- ✅ Created tag `legacy-nextjs-2025-12` at the same commit
- ✅ Updated README.md with references to the legacy branch

## What Needs To Be Done
**Please run the following command to push the legacy branch and tag to GitHub:**

```bash
git push origin legacy/nextjs-2025-12 --tags
```

This will:
- Push the `legacy/nextjs-2025-12` branch to GitHub
- Push the `legacy-nextjs-2025-12` tag to GitHub

## Verification Steps
After pushing, verify:
1. Branch is accessible: https://github.com/ihsinoky/yomikikase-planner/tree/legacy/nextjs-2025-12
2. Tag is accessible: https://github.com/ihsinoky/yomikikase-planner/tree/legacy-nextjs-2025-12

## Optional: Branch Protection
Consider setting up branch protection for `legacy/nextjs-2025-12` to prevent accidental modifications:
1. Go to Settings → Branches → Add rule
2. Branch name pattern: `legacy/*`
3. Enable "Lock branch" (read-only)

## Note
This file can be deleted after the legacy branch and tag are successfully pushed to GitHub.
