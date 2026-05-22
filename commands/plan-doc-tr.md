---
description: "Plan-Doc + TDD + auto code review (full pipeline): generate task-scoped documentation set, then execute with strict TDD, then auto code review."
argument-hint: "<task-slug> [test] e.g. /ecc:plan-doc-tr my-feature"
---

# Plan-Doc-TR: Plan-Doc + TDD + Code Review (Full Pipeline)

**Key constraint**: This command is a three-phase mandatory pipeline. All three Phases MUST be executed via real tool calls. Before outputting the final summary, it is NEVER allowed to:
- Skip Phase 2 or Phase 3
- Replace actual Agent/Skill tool calls with verbal declarations ("I've completed TDD/Review")
- Write code directly in the main conversation context (all implementation must be done by the tdd-guide agent)
- Reverse TDD order (tests MUST be written first, then implementation)

Any execution that violates the above constraints is considered a **command failure** and must be redone.

---

## Plan-Doc-TR Execution Flow

Task: $ARGUMENTS

### === Phase 1 START: Plan-Doc Generation ===

Call `/ecc:plan-doc` via Skill tool:

```
Skill tool with skill: "ecc:plan-doc", args: $ARGUMENTS
```

`ecc:plan-doc` will:
1. Restate requirements
2. Ask clarifying questions (only if critical info missing)
3. Emit a generation plan and **wait for user confirmation** ("yes"/"proceed")
4. After confirmation, output the model handoff and **proceed automatically** to file generation (no separate `继续` reply needed in default fast path)
5. Generate the full documentation set under `docs/plan/<task-slug>-YYYY-MM-DD/`

**Single confirmation gate**: User must reply "yes" / "proceed" / "confirm" / "可以" / "好的" / "同意" to approve the generation plan. After that, plan-doc → Phase 2 → Phase 3 proceed automatically with no further user input (unless errors or merge conflicts occur).

**Phase 1 completion marker**: All documentation files generated under `docs/plan/<task-slug>-YYYY-MM-DD/`. Main conversation then proceeds directly to Phase 2 in the same turn.

---

### === Phase 2 START: TDD Execution ===

**Pre-flight verification (must complete)**:
- [ ] Are all plan-doc files generated under `docs/plan/<task-slug>-*/`?
- If NO, stop and return to Phase 1. No separate "user confirmation to start TDD" is required — Phase 1 confirmation is the single gate for the whole pipeline.

**Three No's principle** (before Phase 2 starts):
- No writing any source code directly in the main conversation
- No making direct code modification decisions
- No skipping tests and jumping directly to implementation

**Parallel dispatch strategy (activate when plan items ≥ 3)**:

**Pre-dispatch checks** (run before reading parallelizable_groups):
1. Verify current directory is a git repository: `git rev-parse --is-inside-work-tree`. If not a git repo → fall back to serial mode silently.
2. Read `parallelizable_groups` from the progress pointer in `00-执行文档.md`. If the field is absent (plan-doc generation skipped the YAML step on the older version) → fall back to serial mode and warn: "parallelizable_groups not found in progress pointer — running in serial mode. Re-generate plan-doc to enable parallel dispatch."

- If `parallelizable_groups` is null or has only 1 group → **Serial mode**: single tdd-guide agent (default, see below).
- If `parallelizable_groups` has 2+ independent groups → **Parallel mode**:
  1. Identify all groups with empty `depends_on` (independent). Cap at **3 groups max** in a single parallel batch; queue the rest as serial.
  2. **Print the group preview, then dispatch immediately in the same turn** (no separate user confirmation; output below is informational only):
     ```
     Parallel groups detected — dispatching now:
       Group A: [P1.1, P1.2] (independent)
       Group B: [P1.3] (independent)
       Group C: [P1.4] — depends on A (will run after A merges)
     ```
     The preview is printed for transparency; the parallel tdd-guide tool calls follow in the same turn. If the user wants to abort, they must interrupt and reply "stop" / "串行" before the next turn — there is no timed wait.
  3. Launch one `tdd-guide` Agent tool call per independent group in a **single message** (parallel), each with `isolation: "worktree"` and a prompt scoped to that group's items only.
  4. Wait for all independent group agents to complete.
  5. **Merge independent groups first** (Worktree Merge SOP, independent groups only), then refresh baseline:
     ```bash
     git checkout <main-branch> && git pull
     ```
  6. For each dependent group, **cut a fresh worktree from the updated main branch**, launch tdd-guide serially, merge immediately after each completes before starting the next.
  7. Run a unified coverage check on the merged main branch.

**Worktree Merge SOP** (parallel mode only):

After all tdd-guide agents return, extract from each agent's result:
- `worktree_path` — directory of the isolated worktree
- `branch_name` — branch created inside that worktree

Then merge each branch in dependency order (independent groups first, serial groups after):

```bash
# For each group branch in order:
git merge --no-ff <branch_name> -m "merge: TDD Group <label>"
# If conflict: stop, report the conflicting files to user, do NOT auto-resolve.
```

If any merge produces a conflict, block Phase 2 completion, report to user with the conflicting file list, and ask for resolution before continuing.

Example parallel dispatch (single message, two tool calls):
```
Agent tool #1: subagent_type="tdd-guide", isolation="worktree"
  prompt: "Execute strict TDD for Group A items: [P1.1, P1.2, P1.3].
           RED→GREEN→IMPROVE→REPEAT. 80% min coverage."

Agent tool #2: subagent_type="tdd-guide", isolation="worktree"   ← same message
  prompt: "Execute strict TDD for Group B items: [P1.4, P1.5].
           RED→GREEN→IMPROVE→REPEAT. 80% min coverage."
```

**Execution** (serial mode / single group fallback):

Call the `tdd-guide` subagent via Agent tool to execute according to the plan:

```
Agent tool with subagent_type: "tdd-guide"
prompt: "Follow the plan in docs/plan/<task-slug>-*/00-执行文档.md and execute strict TDD. Must follow RED->GREEN->IMPROVE->REPEAT cycle. 80% minimum coverage."
```

**TDD mandatory flow** (executed by tdd-guide agent):

1. **RED**: Write **failing tests** FIRST for each plan item
2. **GREEN**: Write minimal code to make tests pass
3. **IMPROVE**: Refactor while keeping tests green
4. **REPEAT**: Loop through all plan items

**Coverage requirements**:
- General code: >=80%
- Security-critical / financial logic: 100%

**Phase 2 completion marker**:

Serial mode — after the single tdd-guide agent returns:
- [x] All tests passing
- [x] Coverage metric >= 80%
- [x] git log shows test files committed first

Parallel mode — after ALL group agents return AND worktrees are merged:
- [x] Every group agent reported all tests passing (aggregate: no group may have any failing test)
- [x] Unified coverage on merged main branch >= 80% (main conversation runs stack coverage command via Bash: `flutter test --coverage` / `jest --coverage` / `pytest --cov` / `go test -cover` — once after merge, not per-group)
- [x] All group merges completed without conflict
- [x] Each group's worktree-internal git log shows test commits before implementation commits (merged main branch overall order not required)

If any group's tests failed:
- **Retry that group only**: discard the old worktree, cut a fresh one from current main branch, re-run tdd-guide (`isolation: "worktree"`). Other passing groups do not re-run.
- **Maximum 3 retry rounds**. After 3 failures, stop retrying, report failure reason and recommendations (split task / revise approach / fall back to manual). Do NOT continue auto-retrying after 3 rounds.
- Do NOT mark Phase 2 complete while any group has failing tests.

---

### === Phase 3 START: Code Review Loop ===

**Pre-flight verification (must complete)**:

Serial mode:
- [ ] Was the tdd-guide agent actually called?
- [ ] All tests passing?
- [ ] Coverage >= 80%?

Parallel mode:
- [ ] Was each group's tdd-guide agent actually called? (check per group in Agent tool call history)
- [ ] Every group's tests all passing? (any group with failures → back to Phase 2 to retry that group)
- [ ] Unified coverage on merged main branch >= 80%? (Bash run result)
- [ ] All group worktrees merged to main branch?

If any item is NO, stop and go back to Phase 2 for the relevant group/issue.

**Code Review closed-loop mechanism** (must follow this loop until exit condition is met):

```
LOOP:
  1. Call code-reviewer agent to perform review
  2. Collect review report
  3. If CRITICAL or HIGH issues exist:
       → Call code-reviewer agent to fix them
       → After fix, go back to step 1 (review again)
  4. If no CRITICAL and no HIGH issues:
       → Exit loop, Phase 3 complete
```

**Exit condition** (both must be met):
- No CRITICAL issues (security vulnerabilities, hardcoded secrets, injection risks)
- No HIGH issues (large functions >50 lines, deep nesting >4 levels, missing error handling)
- MEDIUM / LOW issues are recorded (do not block exit)

**Parallel review (when parallel mode was used in Phase 2)**:

If Phase 2 ran in parallel mode, each group has its own worktree with a distinct changed-file set. Launch one `code-reviewer` agent per group in a single message (parallel):

```
Agent tool #1: subagent_type="code-reviewer"
  prompt: "In worktree-A directory, run `git diff main...HEAD --name-only` to get changed files.
           Review those files. CRITICAL/HIGH/MEDIUM/LOW.
           Fix CRITICAL and HIGH. Output [REVIEW_PASS] or [REVIEW_FAIL: ...]."

Agent tool #2: subagent_type="code-reviewer"   ← same message
  prompt: "In worktree-B directory, run `git diff main...HEAD --name-only` to get changed files.
           Review those files. CRITICAL/HIGH/MEDIUM/LOW.
           Fix CRITICAL and HIGH. Output [REVIEW_PASS] or [REVIEW_FAIL: ...]."
```

Collect all results. If any group returns `[REVIEW_FAIL]`:
- **Retry that group only**: re-launch code-reviewer in that group's worktree directory, using `git diff main...HEAD --name-only` for file scope. Do NOT use `git diff HEAD` (would return empty if all changes are committed).
- **Maximum 3 retry rounds per group**. After 3 failures, stop the loop, report remaining issues to user for manual decision.
- Groups that already returned `[REVIEW_PASS]` do NOT re-run.

**Each review round execution** (serial mode / single group):

Call the `code-reviewer` subagent via Agent tool:

```
Agent tool with subagent_type: "code-reviewer"
prompt: "Review all changed files in git diff HEAD. Check security (CRITICAL), structure (HIGH), patterns (MEDIUM), style (LOW).
Fix all CRITICAL and HIGH issues. After fixing, output: [REVIEW_PASS] if no CRITICAL/HIGH remain, or [REVIEW_FAIL: <issue list>] if issues still exist."
```

**Code review coverage**:
1. Run `git diff --name-only HEAD` to identify modified files
2. Review file by file:
   - **CRITICAL**: Security vulnerabilities, hardcoded secrets, injection risks
   - **HIGH**: Large functions (>50 lines), deep nesting (>4 levels), missing error handling
   - **MEDIUM**: Mutation patterns, missing tests, complexity issues
   - **LOW**: Naming inconsistencies, formatting issues
3. Output structured review report (with severity level + file:line)
4. **Fix** CRITICAL and HIGH issues
5. End report with `[REVIEW_PASS]` or `[REVIEW_FAIL: ...]`

**Loop record** (main conversation must maintain):

Serial mode:
| Round | CRITICAL | HIGH | MEDIUM | LOW | Result |
|-------|----------|------|--------|-----|--------|
| #1 | ? | ? | ? | ? | PASS/FAIL |
| #2 (if needed) | ? | ? | ? | ? | PASS/FAIL |

Parallel mode — one sub-table per group, independently tracked:
| Group | Round | CRITICAL | HIGH | MEDIUM | LOW | Result |
|-------|-------|----------|------|--------|-----|--------|
| A | #1 | ? | ? | ? | ? | PASS/FAIL |
| A | #2 (retry if needed) | ? | ? | ? | ? | PASS/FAIL |
| B | #1 | ? | ? | ? | ? | PASS/FAIL |

**Phase 3 completion marker**:
- Serial: last code-reviewer returns `[REVIEW_PASS]`, loop record shows no CRITICAL/HIGH.
- Parallel: **every group** in the loop record shows `[REVIEW_PASS]` in its last round. Phase 3 is NOT complete while any group still has an open `[REVIEW_FAIL]`.

---

## Final Self-Check Report (mandatory output)

Before fully ending, output the following table to verify all three Phases were correctly executed:

| Phase | Status | Evidence |
|-------|--------|----------|
| **Phase 1: Plan-Doc** | ✅/❌ | User confirmation text + generated doc directory path |
| **Phase 2: TDD** | ✅/❌ | tdd-guide agent call ID + final test pass count + coverage % |
| **Phase 3: Review Loop** | ✅/❌ | Total rounds + CRITICAL/HIGH count per round + final [REVIEW_PASS] marker |

**Acceptance criteria**:
- If any item in the table is ❌, the command is considered **failed**
- All items must be ✅ before outputting the final summary
- If there is a ❌, redo the corresponding Phase until it becomes ✅

---

## Final Summary (output only after all Phases are ✅)

Summarize:
- What functionality was implemented / what problem was solved
- Final test results (passed / total) + coverage %
- Code Review loop: total rounds, which CRITICAL/HIGH issues were fixed per round
- Final status: [REVIEW_PASS], no remaining CRITICAL or HIGH issues
- Remaining MEDIUM/LOW issues list (for future reference)
