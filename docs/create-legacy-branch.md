# Legacy Branch Creation Guide

## Purpose

To preserve the Next.js/Prisma implementation for future reference, we need to create a `legacy/nextjs-2025-12` branch from the current `main` branch.

## Manual Steps Required

Since the GitHub Copilot agent cannot directly push new branches to the repository, these steps must be performed manually by a repository maintainer with push access.

### Step 1: Create the legacy branch locally

```bash
# Ensure you're on the latest main branch
git checkout main
git pull origin main

# Create the legacy branch from main
git branch legacy/nextjs-2025-12

# Optional: Create a tag as well for easier reference
git tag legacy-nextjs-2025-12
```

### Step 2: Push to GitHub

```bash
# Push the legacy branch
git push origin legacy/nextjs-2025-12

# Optional: Push the tag
git push origin legacy-nextjs-2025-12
```

### Step 3: Verify

Visit the GitHub repository and confirm:
- The `legacy/nextjs-2025-12` branch appears in the branch list
- It contains the Next.js/Prisma implementation
- The branch is at the same commit as the `main` branch at the time of creation

### Step 4: Optional - Protect the branch

To prevent accidental modifications to the legacy branch:

1. Go to Settings → Branches → Add branch protection rule
2. Branch name pattern: `legacy/nextjs-2025-12`
3. Enable: "Lock branch" (read-only)
4. Save changes

## Acceptance Criteria

- ✅ `legacy/nextjs-2025-12` branch exists on GitHub
- ✅ Branch points to the `main` branch at the time of creation
- ✅ Branch contains the complete Next.js/Prisma implementation
- ✅ Issue #20 can be closed after branch creation

## Context

This is part of Sprint 0 (Issue #19) to preserve existing work while pivoting to the Google Sheets + GAS + Static LIFF architecture. See [pivot-plan.md](./pivot-plan.md) for the full migration strategy.

## Related Issues

- Meta Issue: #19 - Sprint 0 Kickoff
- This addresses: #20 - Legacy branch creation
- Architecture plan: docs/pivot-plan.md
