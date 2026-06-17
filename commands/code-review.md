---
description: Code review — local uncommitted changes or GitHub PR (pass PR number/URL for PR mode)
argument-hint: [pr-number | pr-url | blank for local review]
---

# Code Review

> PR review mode adapted from PRPs-agentic-eng by Wirasm. Part of the PRP workflow series.

**Input**: $ARGUMENTS

---

## Mode Selection

If `$ARGUMENTS` contains a PR number, PR URL, or `--pr`:
→ Jump to **PR Review Mode** below.

Otherwise:
→ Use **Local Review Mode**.

---

## Active Remediation Policy

Code review is not passive. After identifying findings, actively fix issues
when the correct change is clear from the code, tests, project rules, or user
request:

- Fix CRITICAL issues before continuing whenever they are safely fixable.
- Fix HIGH issues proactively; do not stop at reporting them.
- Fix MEDIUM issues proactively when the fix is local, low-risk, and aligned
  with existing project patterns.
- Leave LOW issues as comments unless they are trivial and already in the
  touched area.

Ask the user before fixing only when the change requires a product decision,
an architectural tradeoff, a public API/data-model change, a potentially
destructive migration, secret rotation, a broad refactor, or interpretation of
unclear intended behavior.

After each remediation pass, run the relevant validation checks and repeat the
review from the appropriate gather/fetch phase. Continue this review → fix →
validate → review loop until no CRITICAL or HIGH findings remain and remaining
MEDIUM findings are either fixed, explicitly deferred with a reason, or judged
low-risk enough that further automatic fixes would not materially improve the
change. If the same finding or validation failure persists after repeated fix
attempts, stop and ask the user for direction with the smallest concrete
decision needed.

Preserve unrelated user changes. Do not revert or rewrite files outside the
review scope unless that is required to fix a finding and the reason is clear.

---

## Local Review Mode

Comprehensive security and quality review of uncommitted changes.

### Phase 1 — GATHER

```bash
git diff --name-only HEAD
git status --short
```

If no changed files, stop: "Nothing to review."
Include tracked changes, deleted files, renamed files, and untracked files
reported by `git status --short`. Do not assume `git diff --name-only HEAD`
is complete, because it omits untracked files.

### Phase 2 — REVIEW

Read applicable project instructions before reviewing code:
- Root and nearest `AGENTS.md`, `AGENTS.override.md`, `CLAUDE.md`, or `AGENT.md`
- Project `.ai/rules/` files that match the touched area
- User/global rules only as lower-precedence defaults

When project rules explicitly conflict with global rules, follow the project
rules. For private repositories that explicitly allow committed configuration
or secret fields, skip secret-security checks unless the user asks for a
security audit.

Read each changed file in full. Check for:

**Security Issues (CRITICAL):**
- Hardcoded credentials, API keys, tokens
- SQL injection vulnerabilities
- XSS vulnerabilities
- Missing input validation
- Insecure dependencies
- Path traversal risks

**Code Quality (HIGH):**
- Functions > 50 lines
- Files > 800 lines
- Nesting depth > 4 levels
- Missing error handling
- console.log statements
- TODO/FIXME comments
- Missing JSDoc for public APIs

**Best Practices (MEDIUM):**
- Mutation patterns (use immutable instead)
- Emoji usage in code/comments
- Missing tests for new code
- Accessibility issues (a11y)

### Phase 3 — REPORT

Generate report with:
- Severity: CRITICAL, HIGH, MEDIUM, LOW
- File location and line numbers
- Issue description
- Suggested fix

Do not stop after reporting fixable CRITICAL, HIGH, or MEDIUM issues. Apply
the **Active Remediation Policy** first.

### Phase 4 — REMEDIATE AND RE-REVIEW

For each finding:

1. Fix CRITICAL and HIGH issues that have a clear, safe correction.
2. Fix MEDIUM issues when the fix is straightforward and consistent with the
   local code style.
3. Ask the user only for findings that need a decision or have unclear intent.
4. Run the smallest relevant validation command first, then broader project
   checks when the change touches shared behavior.
5. Restart at **Phase 1 — GATHER** and repeat until the review reaches an
   acceptable residual-risk state.

Block commit if CRITICAL or HIGH issues remain after the remediation loop or
if the user has not yet decided an ambiguous required fix.
Never approve code with security vulnerabilities.

---

## PR Review Mode

Comprehensive GitHub PR review — fetches diff, reads full files, runs validation, posts review.

### Phase 1 — FETCH

Parse input to determine PR:

| Input | Action |
|---|---|
| Number (e.g. `42`) | Use as PR number |
| URL (`github.com/.../pull/42`) | Extract PR number |
| Branch name | Find PR via `gh pr list --head <branch>` |

```bash
gh pr view <NUMBER> --json number,title,body,author,baseRefName,headRefName,changedFiles,additions,deletions
gh pr diff <NUMBER>
```

If PR not found, stop with error. Store PR metadata for later phases.

### Phase 2 — CONTEXT

Build review context:

1. **Project rules** — Read `CLAUDE.md`, `.claude/docs/`, and any contributing guidelines
2. **Planning artifacts** — Check `.claude/prds/`, `.claude/plans/`, `.claude/reviews/`, and legacy `.claude/PRPs/{prds,plans,reports,reviews}/` for context related to this PR
3. **PR intent** — Parse PR description for goals, linked issues, test plans
4. **Changed files** — List all modified files and categorize by type (source, test, config, docs)

### Phase 3 — REVIEW

Read each changed file **in full** (not just the diff hunks — you need surrounding context).

For PR reviews, fetch the full file contents at the PR head revision:
```bash
gh pr diff <NUMBER> --name-only | while IFS= read -r file; do
  gh api "repos/{owner}/{repo}/contents/$file?ref=<head-branch>" --jq '.content' | base64 -d
done
```

Apply the review checklist across 7 categories:

| Category | What to Check |
|---|---|
| **Correctness** | Logic errors, off-by-ones, null handling, edge cases, race conditions |
| **Type Safety** | Type mismatches, unsafe casts, `any` usage, missing generics |
| **Pattern Compliance** | Matches project conventions (naming, file structure, error handling, imports) |
| **Security** | Injection, auth gaps, secret exposure, SSRF, path traversal, XSS |
| **Performance** | N+1 queries, missing indexes, unbounded loops, memory leaks, large payloads |
| **Completeness** | Missing tests, missing error handling, incomplete migrations, missing docs |
| **Maintainability** | Dead code, magic numbers, deep nesting, unclear naming, missing types |

Assign severity to each finding:

| Severity | Meaning | Action |
|---|---|---|
| **CRITICAL** | Security vulnerability or data loss risk | Must fix before merge |
| **HIGH** | Bug or logic error likely to cause issues | Should fix before merge |
| **MEDIUM** | Code quality issue or missing best practice | Fix recommended |
| **LOW** | Style nit or minor suggestion | Optional |

### Phase 4 — VALIDATE

Run available validation commands:

Detect the project type from config files (`package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`, etc.), then run the appropriate commands:

**Node.js / TypeScript** (has `package.json`):
```bash
npm run typecheck 2>/dev/null || npx tsc --noEmit 2>/dev/null  # Type check
npm run lint                                                    # Lint
npm test                                                        # Tests
npm run build                                                   # Build
```

**Rust** (has `Cargo.toml`):
```bash
cargo clippy -- -D warnings  # Lint
cargo test                   # Tests
cargo build                  # Build
```

**Go** (has `go.mod`):
```bash
go vet ./...    # Lint
go test ./...   # Tests
go build ./...  # Build
```

**Python** (has `pyproject.toml` / `setup.py`):
```bash
pytest  # Tests
```

Run only the commands that apply to the detected project type. Record pass/fail for each.

### Phase 5 — DECIDE

Form recommendation based on findings:

| Condition | Decision |
|---|---|
| Zero CRITICAL/HIGH issues, validation passes | **APPROVE** |
| Only MEDIUM/LOW issues, validation passes | **APPROVE** with comments |
| Any HIGH issues or validation failures | **REQUEST CHANGES** |
| Any CRITICAL issues | **BLOCK** — must fix before merge |

Special cases:
- Draft PR → Always use **COMMENT** (not approve/block)
- Only docs/config changes → Lighter review, focus on correctness
- Explicit `--approve` or `--request-changes` flag → Override decision (but still report all findings)

### Phase 6 — REMEDIATE AND RE-REVIEW

Before publishing a review, apply the **Active Remediation Policy**:

1. If the PR branch is checked out locally or can be safely checked out, fix
   clear CRITICAL, HIGH, and straightforward MEDIUM issues in the PR worktree.
2. Run the relevant validation commands for the files changed by the fix.
3. Re-run the PR review from **Phase 1 — FETCH** so the final decision reflects
   the post-fix state.
4. If the branch cannot be edited locally, the push target is unavailable, or
   the fix requires a maintainer/product decision, stop and report the concrete
   blocker instead of silently publishing stale findings.

Do not publish `REQUEST CHANGES` solely for fixable HIGH or MEDIUM issues until
the remediation loop has either fixed them or reached a decision/blocker that
requires the user.

### Phase 7 — REPORT

Create review artifact at `.claude/reviews/pr-<NUMBER>-review.md` unless the repo already uses legacy `.claude/PRPs/reviews/` for this workstream:

```markdown
# PR Review: #<NUMBER> — <TITLE>

**Reviewed**: <date>
**Author**: <author>
**Branch**: <head> → <base>
**Decision**: APPROVE | REQUEST CHANGES | BLOCK

## Summary
<1-2 sentence overall assessment>

## Findings

### CRITICAL
<findings or "None">

### HIGH
<findings or "None">

### MEDIUM
<findings or "None">

### LOW
<findings or "None">

## Validation Results

| Check | Result |
|---|---|
| Type check | Pass / Fail / Skipped |
| Lint | Pass / Fail / Skipped |
| Tests | Pass / Fail / Skipped |
| Build | Pass / Fail / Skipped |

## Files Reviewed
<list of files with change type: Added/Modified/Deleted>
```

### Phase 8 — PUBLISH

Post the review to GitHub:

```bash
# If APPROVE
gh pr review <NUMBER> --approve --body "<summary of review>"

# If REQUEST CHANGES
gh pr review <NUMBER> --request-changes --body "<summary with required fixes>"

# If COMMENT only (draft PR or informational)
gh pr review <NUMBER> --comment --body "<summary>"
```

For inline comments on specific lines, use the GitHub review comments API:
```bash
gh api "repos/{owner}/{repo}/pulls/<NUMBER>/comments" \
  -f body="<comment>" \
  -f path="<file>" \
  -F line=<line-number> \
  -f side="RIGHT" \
  -f commit_id="$(gh pr view <NUMBER> --json headRefOid --jq .headRefOid)"
```

Alternatively, post a single review with multiple inline comments at once:
```bash
gh api "repos/{owner}/{repo}/pulls/<NUMBER>/reviews" \
  -f event="COMMENT" \
  -f body="<overall summary>" \
  --input comments.json  # [{"path": "file", "line": N, "body": "comment"}, ...]
```

### Phase 9 — OUTPUT

Report to user:

```
PR #<NUMBER>: <TITLE>
Decision: <APPROVE|REQUEST_CHANGES|BLOCK>

Issues: <critical_count> critical, <high_count> high, <medium_count> medium, <low_count> low
Validation: <pass_count>/<total_count> checks passed

Artifacts:
  Review: .claude/reviews/pr-<NUMBER>-review.md
  GitHub: <PR URL>

Next steps:
  - <contextual suggestions based on decision>
```

---

## Edge Cases

- **No `gh` CLI**: Fall back to local-only review (read the diff, skip GitHub publish). Warn user.
- **Diverged branches**: Suggest `git fetch origin && git rebase origin/<base>` before review.
- **Large PRs (>50 files)**: Warn about review scope. Focus on source changes first, then tests, then config/docs.
