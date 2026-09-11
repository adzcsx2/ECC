---
name: code-review-loop
description: "Repeatedly run ECC's complete code review over the entire current change set, fix every CRITICAL, HIGH, and MEDIUM finding, and start a fresh full-scope review until none remain. Use for CodeReviewLoop, review-fix-review loops, or 反复审查并修复; do not use for review-only requests or automatic PR publishing."
license: MIT
metadata:
  origin: ECC
---

# Code Review Loop

Run a bounded review-fix-review loop around `$ecc-code-review`. The review
rubric still comes from that skill; this skill owns the scope, repair cycle,
and completion gate.

## When to Activate

Use this skill when the user asks to:

- run CodeReviewLoop or a review-fix-review cycle;
- fix review findings and then review all current changes again;
- keep reviewing until no blocking or medium-severity findings remain.

For a single report with no repairs, use `$ecc-code-review` directly.

## Non-Negotiable Invariants

1. **One immutable baseline.** Capture the base revision before the first
   review and keep it unchanged for the entire loop.
2. **Whole-scope review on every pass.** Recompute the complete current change
   set from that baseline. Read every changed file in full, not only the fixes
   or files named by the previous report.
3. **Fresh verdict.** Invoke `$ecc-code-review` as a fresh review pass each
   time. Rebuild evidence before consulting earlier findings.
4. **Strict gate.** Success requires zero `CRITICAL`, zero `HIGH`, and zero
   `MEDIUM` findings in a fresh pass, plus all applicable validation checks
   passing. `LOW` findings are non-blocking, although safe and in-scope LOW
   fixes should still be made.
5. **Finite fallback.** Use a maximum of 5 review passes unless the user sets a
   different finite limit before the loop starts.

## Establish the Review Scope

Choose exactly one baseline recipe before the first review pass. For local
changes, verify that the current directory is a Git worktree and assign the
current revision to the immutable baseline variable:

```bash
git rev-parse --show-toplevel
BASE_REV="$(git rev-parse HEAD)"
git status --short
```

Keep the resolved commit ID in working memory for the entire loop. Do not
recompute or overwrite `BASE_REV`. For a PR, skip this local recipe and use the
fixed merge-base recipe in [Pull Request Boundary](#pull-request-boundary).
When shell sessions are not persistent, substitute the recorded literal commit
ID for `$BASE_REV`, or reassign that exact value before each command; never
derive it from the moving working tree again.

At the start of every pass, rebuild the file inventory against that same
baseline. Include staged changes, unstaged changes, untracked files, and files
created by repairs:

```bash
git diff --name-status "$BASE_REV"
git ls-files --others --exclude-standard
```

Use `git diff "$BASE_REV"` for changed hunks. Read every changed file in full
when it still exists and is textual. For a deleted file, inspect both its diff
and its baseline contents. Inspect binary, generated, or vendored changes only
to the level appropriate for their format and project rules.

Do not commit during the loop: a moving `HEAD` silently changes the scope.
Never reset, discard, overwrite, or revert pre-existing user changes.

## Review-Fix-Review Cycle

### 1. Run a Fresh Complete Review

At the beginning of every review pass, load and invoke `$ecc-code-review` as a
fresh full-scope review. If the Codex bridge is unavailable in another harness,
use the equivalent `/ecc:code-review` command or the authoritative workflow in
`commands/code-review.md`; do not substitute a lighter checklist.

For this loop, replace the default `git diff --name-only HEAD` discovery with
the immutable-baseline inventory above. Apply the complete seven-category
rubric from `$ecc-code-review`'s PR Review Mode to both local and PR changes:

- `Correctness`
- `Type Safety`
- `Pattern Compliance`
- `Security`
- `Performance`
- `Completeness`
- `Maintainability`

This is a scope-and-rubric override, not permission to run PR side effects.
During the loop, use the command's context, review, validation, and decision
guidance, but do not create or update a review artifact and do not publish a
GitHub review. This keeps committed PR changes and earlier repairs inside every
pass without narrowing the review to the smaller local checklist.

Give the review pass the immutable baseline and current full file inventory.
Apply every review category from `$ecc-code-review`, reread the project rules,
and reread all changed files in full. The reviewer must derive findings from
the current code without being told to verify only previous findings.

A fresh pass means fresh evidence collection and a new verdict. It does not
require a different model, but use isolated reviewer context when the harness
provides it and doing so is within the current task's authorization.

### 2. Evaluate the Gate

Normalize the report into unique, evidence-backed findings with severity,
file, line, description, and suggested fix.

- If the pass reports any `CRITICAL`, `HIGH`, or `MEDIUM` finding, continue to
  repairs.
- Success requires zero `CRITICAL`, zero `HIGH`, and zero `MEDIUM` findings. At
  that point, run all applicable project validation: targeted tests, then the
  available type check, lint, test, and build commands.
- If a validation failure is caused by the current review scope, repair it and
  start a fresh complete review.
- If a validation failure is pre-existing or out-of-scope, stop immediately
  with `BLOCKED` and preserve its evidence.
- If available evidence cannot determine causality safely, stop with `BLOCKED`
  instead of guessing or modifying unrelated code.
- If the fresh pass is clean and every validation check passes, stop
  successfully.

Diagnose each distinct validation failure once. Do not start another review
pass unless a reviewed file or the review scope changed. A failed command by
itself is not progress and must not consume the remaining pass budget
repeatedly.

Snapshot the reviewed scope immediately before validation. If validation
changes the reviewed scope or creates a new non-ignored file, start another
fresh complete review. The successful review must occur after the final file
mutation, regardless of whether that mutation came from a formatter, snapshot
update, generator, test, or build.

Tests alone never satisfy this gate. The loop must not claim success without a
final fresh, full-scope `$ecc-code-review` pass.

### 3. Repair the Current Findings

Fix every actionable `CRITICAL`, `HIGH`, and `MEDIUM` finding from the current
pass. Fix `LOW` findings when the change is safe, unambiguous, and stays within
scope; LOW findings do not force another repair by themselves.

For each repair batch:

- make the smallest coherent production fix;
- add or update tests when behavior changes;
- run the narrowest relevant tests immediately;
- preserve public behavior unless the finding proves that behavior is wrong;
- record the finding, changed files, and test result in an in-memory pass
  ledger.

The repair step must not weaken or delete tests merely to make the loop pass.
It must not change the review rubric or severity definitions, suppress a
validator, reduce coverage thresholds, hide errors, or exclude files from the
review scope. Legitimate test changes must preserve or strengthen their ability
to detect the reviewed defect.

### 4. Discard the Verdict and Repeat

Keep the pass ledger only for progress reporting. Do not reuse its verdict as
evidence that a finding is fixed. Increment the pass count, recompute the full
change set from the immutable baseline, and invoke another fresh complete
review beginning at step 1.

The next pass covers all current changes, including original changes, prior
repairs, newly added tests, and new files. It is explicitly not a review of only
the latest repair diff or previously reported locations.

## Stop Conditions

Stop with **success** only when both are true:

- the latest fresh full-scope pass contains no `CRITICAL`, no `HIGH`, and no
  `MEDIUM` findings;
- all applicable validation checks pass.

Stop with **blocked**, preserve the working tree, and report the evidence when:

- the configured maximum review pass count is reached before a clean
  confirmation pass;
- two consecutive passes make no material progress on the same findings;
- a safe fix requires a product decision, unavailable credential, destructive
  migration, secret rotation, or authority outside the user's request;
- a required validation failure is pre-existing, out-of-scope, or cannot be
  attributed safely;
- the review workflow or required validator is unavailable and no equivalent
  local check can establish the gate.

Do not commit, push, publish, approve, or merge as part of this skill. Do not
silently turn a blocked stop into success.

## Pull Request Boundary

Do not repeatedly publish GitHub reviews. When the change originates from a
PR, check out the PR branch, resolve the remote that tracks the PR's base
repository, and capture the merge base once before the first pass:

```bash
PR_NUMBER="<PR number>"
gh pr checkout "$PR_NUMBER"
BASE_REF="$(gh pr view "$PR_NUMBER" --json baseRefName --jq .baseRefName)"
BASE_REMOTE="<remote for the PR base repository, usually origin>"
git fetch "$BASE_REMOTE" "$BASE_REF"
BASE_REV="$(git merge-base HEAD FETCH_HEAD)"
```

Resolve the placeholders before executing the recipe and verify that
`BASE_REV` is a commit. Do not fetch again or recompute it during the loop.
Run every pass locally against this fixed merge base. Skip `$ecc-code-review`'s
artifact and publish phases during intermediate passes. Publish one final PR
review only when the user explicitly requests it after the loop is clean.

## Final Report

Report:

- immutable baseline and final reviewed file count;
- each pass number with `CRITICAL`, `HIGH`, `MEDIUM`, and `LOW` counts;
- repairs made and validation commands run;
- final status: `CLEAN` or `BLOCKED`;
- any remaining LOW findings or blockers.

Do not report `CLEAN` if the final result came only from targeted rechecks,
tests, or an earlier verdict.
