# Fork Sync Guide

This repository is a personal fork of [affaan-m/ECC](https://github.com/affaan-m/ECC).
Use the instructions below to pull upstream changes while keeping local modifications.

## Syncing Upstream

Always use the preconfigured alias:

```bash
git pull-upstream
```

This is equivalent to:

```bash
git fetch upstream
git merge upstream/main -X ours
```

The `-X ours` flag means: **when a merge conflict occurs, keep the local version**.
Changes in upstream that do not conflict with local edits are merged normally.

## What `-X ours` Does (and Does Not Do)

| Scenario | Result |
|---|---|
| Upstream adds a new file you have not touched | Merged in normally |
| Upstream edits a file you have not modified | Merged in normally |
| Upstream edits a file you have also edited — no overlapping lines | Both sets of changes merged |
| Upstream edits a file you have also edited — same lines conflict | **Local version wins** |

`-X ours` is a conflict-resolution strategy, not a file-level lock.
If you want to completely exclude a file from upstream changes, you must manually
revert it after each merge.

## Restoring the Alias After a Fresh Clone

The alias is stored in `.git/config` and is not committed to the repository.
After cloning on a new machine:

```bash
# Add the upstream remote (if missing)
git remote add upstream https://github.com/affaan-m/ECC.git

# Register the alias
git config --local alias.pull-upstream '!git fetch upstream && git merge upstream/main -X ours'
```

## Checking the Current Alias

```bash
git config --local alias.pull-upstream
# Expected: !git fetch upstream && git merge upstream/main -X ours
```

## Common Situations

**Upstream introduced changes you want to keep:**
Run `git pull-upstream` as usual. Non-conflicting changes come in automatically.

**Upstream changed a line you also changed, but you want upstream's version this time:**
After running `git pull-upstream`, manually edit the file to accept the upstream content,
then commit the result.

**You want to preview what upstream changed before merging:**
```bash
git fetch upstream
git log HEAD..upstream/main --oneline
git diff HEAD...upstream/main
```

**After a merge, verify your local changes are intact:**
```bash
git diff main..HEAD -- path/to/your/file
```
