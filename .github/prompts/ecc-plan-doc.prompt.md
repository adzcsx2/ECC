---
agent: agent
description: Generate a complete task-scoped documentation set under docs/plan/<task-slug>-YYYY-MM-DD/ — README, execution log with progress pointer + subagent plan, architecture, dev guide, roadmap, and optional test docs. Use for multi-session, multi-phase work.
argument-hint: "<task-slug> [test] | [test] <task-slug>"
---

# plan-doc

Generate a complete, task-scoped documentation set so an AI can execute a multi-phase engineering task across multiple sessions without losing progress.

Difference from `plan`: `plan` produces an in-conversation plan only. `plan-doc` **persists** that plan as a set of linked markdown files under `docs/plan/<task-slug>-<YYYY-MM-DD>/`, with a machine-readable progress pointer and an embedded subagent plan.

## Language Rules

- Generated document **body** follows the host project's primary documentation language:
  - If `docs/README.md` exists and is Chinese → generate Chinese docs.
  - If `docs/README.md` is English or missing → default to the user's conversation language.
- Filenames use numbered prefixes with Chinese names (`00-执行文档.md`, `01-架构设计.md`, etc.), matching the ECC source command. `README.md` keeps its standard name.
- All generated files must be UTF-8 **without BOM**.

## When to Use

Use `plan-doc` when:
- The work item will produce 3+ linked docs (bug-fix campaign, refactor, feature rollout, audit follow-up).
- Work spans multiple sessions or multiple agents and needs a persistent progress anchor.
- The task has distinct phases that should run in order with per-phase verification.

Do NOT use when:
- The change fits in a single file / single session / single PR → just edit directly.
- The output is one doc → put it under the right top-level category (`docs/design/`, `docs/guide/`, etc.).

## Parameters

- `<task-slug>` (required unless interactive): english kebab-case, stable, no dates unless disambiguating. Examples: `ble-multi-device-fix`, `home-card-migration`.
- `test` (optional): include test plan + test cases (7 docs instead of 5).

**Implicit test-mode triggers** — if any of these appear in the invocation prompt **body** (not the slug), enable test mode automatically:
- Chinese: `测试`, `回归`, `自测`, `QA`, `验证`, `用例`
- English: `test`, `regression`, `QA`, `verification`, `test case`, `test plan`

Only inspect the prompt body. Do NOT match the slug (a slug like `foo-test-migration` must not trigger test mode).

## Execution Flow

Run these stages in order. Do NOT skip any.

### Stage 1 — Restate
Read the task description and extract: task name, core problem, affected modules, observable symptoms, related source paths, related upstream docs (reports, existing guides). If the project has an audit / bug report / PRD, read it once and summarize in 3 bullets.

### Stage 2 — Clarify (only if missing)
Ask at most 3 targeted questions, in a single batch — never one-by-one, never generic. Only clarify:
- Slug, if not provided.
- Test docs, if ambiguous (test keyword absent but task clearly touches a QA surface).
- Source files, if the description is too abstract to know what is in scope.

### Stage 3 — Emit plan + WAIT
Output the plan in this exact shape, then **STOP and wait for confirmation. Do NOT generate any files yet.**

```
# plan-doc generation plan: <task-slug>

## Output location
docs/plan/<task-slug>-<YYYY-MM-DD>/

## Documents to generate
- README.md — index
- 00-执行文档.md — execution log with progress pointer + subagent plan
- 01-架构设计.md — core decisions
- 02-开发规范.md — must/forbidden, code templates, anti-patterns
- 03-修复路线图.md — phase breakdown, milestones, rollback
- 04-测试计划.md — (only if test mode)
- 05-测试用例清单.md — (only if test mode)

## Detected stack
<flutter | android | web | python | java | generic>

## Phases detected from task description
Phase 1: ...
Phase 2: ...

## Parallel groups analysis
Independent (can run in parallel):
  - Group A: [phase items with no shared files/interfaces]
Serial (must run after dependencies):
  - Group C: [items that depend on A]
(If all items are interdependent, OMIT this entire section — do not write "N/A".)

## Upstream sources of truth (will NOT be modified)
- <list>

## Waiting for confirmation
Reply "yes" / "proceed" to start file generation.
Reply "modify: ..." to adjust the plan first.
```

### Stage 4 — Generate
Only after the user confirms:

1. Compute target dir: `docs/plan/<task-slug>-<today-date>/` (`YYYY-MM-DD` local date).
2. Scan for existing `docs/plan/<task-slug>-*/` dirs (same slug, any date) and **auto-decide**:
   - Existing dir date == today → **reuse** it (continuation). Print: `Reused <dir> (same-day regeneration)`.
   - Existing dir date != today → **create new** dated dir. Print: `Created <new-dir> (old task at <found-dir> left untouched)`.
   - Only ask when there is a destructive conflict (different content at exact same path).
3. **Checkpoint resume** — if `00-执行文档.md` already exists and contains a `<!-- progress-pointer:start -->` block:
   - Read the pointer YAML, print `Detected progress snapshot: Phase <n> / <status>`.
   - Do NOT regenerate any doc that already exists on disk; print `Skipped (exists)` for each.
   - Only generate missing files. Append to the execution log instead of overwriting it.
4. Write docs in order: `README.md` → `00-执行文档.md` → `01-架构设计.md` → `02-开发规范.md` → `03-修复路线图.md` → (`04-测试计划.md` → `05-测试用例清单.md` if test).
5. Cross-link: README links to all; `00` links to `01-03`; each numbered doc has prev/next links.

### Stage 5 — Post-generation
1. Report total line count per file.
2. Append a link to the new task subdir under the `Plan docs` section of `docs/README.md` (if such a section exists; otherwise suggest adding one).
3. Remind the user that `.cursor/rules/*` and top-level usage guides were NOT modified.
4. Print the first execution prompt the user should give a fresh AI session.

## Output Structure

```
docs/plan/<task-slug>-<YYYY-MM-DD>/
├── README.md              # required — task index, background, doc list, status
├── 00-执行文档.md         # required — progress pointer, subagent plan, checklists, log
├── 01-架构设计.md         # required — core architectural decisions
├── 02-开发规范.md         # required — must/forbidden, templates, anti-patterns
├── 03-修复路线图.md       # required — phase breakdown, milestones, rollback
├── 04-测试计划.md         # optional — strategy (entry/exit criteria, environment)
└── 05-测试用例清单.md     # optional — structured cases, regression matrix
```

## Key File: 00-执行文档.md

This is what makes `plan-doc` different from `plan`. It MUST contain:

1. **Progress pointer** wrapped in `<!-- progress-pointer:start -->` / `<!-- progress-pointer:end -->` HTML comments, with a YAML block:
   - `current_phase` (int)
   - `current_phase_status` (not_started | planning | coding | self_testing | in_review | completed | blocked)
   - `last_updated` (ISO 8601 UTC)
   - `last_actor` (main-agent | subagent:<name> | human)
   - `last_commit` (git hash or null)
   - `next_action` (one line)
   - `blockers` (string array)
   - `parallelizable_groups` (object array, nullable): each entry has `group`, `items` (P<N>.<M> list), `depends_on` (group label array). Set to `null` if all items are interdependent — never leave the field absent.

2. **Resume protocol** (mandatory reading for any AI entering the task):
   read pointer → jump to matching Phase checklist → continue from first unchecked item → on completion tick checkbox + update pointer + append to log → on blocker set status=blocked and stop → switch phase only after all items verified.

3. **Subagent plan** (stack-specific table, see below) with a Parallel Group column.

4. **Per-phase checklists** with ordered atomic items (P<N>.<M>), branch name, acceptance criteria.

5. **Execution log** (reverse-chronological table, appended on every state change).

6. **Execution prompt template** to hand to a fresh AI session.

### Forbidden in 00-执行文档.md
- Do not leave the progress pointer outside the HTML comment anchors (tools rely on them).
- Do not omit the resume protocol.
- Do not put architectural content here (→ 01-架构设计.md) or code templates here (→ 02-开发规范.md).

## Subagent Plan (Stack-Specific)

Detection: `pubspec.yaml`+`lib/main.dart`→Flutter; `settings.gradle[.kts]`+`AndroidManifest.xml`→Android; `package.json`+`next/vite config`→Web; `pyproject.toml`/`requirements.txt`→Python; `pom.xml`/`build.gradle` with `src/main/java`→Java.

The embedded subagent table must include a `Parallel Group` column. Items sharing a label can dispatch simultaneously; items with `depends_on` wait for dependencies.

| Stack | Coding | Build fix | Review | E2E/Test |
|-------|--------|-----------|--------|----------|
| Flutter | main-agent | `dart-build-resolver` (serial) | `flutter-reviewer` | `e2e-runner` (serial; real-device stays human) |
| Android | main-agent | `kotlin-build-resolver` / `java-build-resolver` (serial) | `kotlin-reviewer` / `java-reviewer` | — |
| Web/React | main-agent | `build-error-resolver` (serial) | `typescript-reviewer` | `e2e-runner` (serial) |
| Python | main-agent | — | `python-reviewer` | `tdd-guide` |
| Java/Spring | main-agent | `java-build-resolver` (serial) | `java-reviewer` | — |
| Generic | main-agent | — | `code-reviewer` | `security-reviewer` (serial) |

**Forbidden subagent uses (universal):** do not delegate progress-pointer updates, phase-switch decisions, or core logic touching upstream sources of truth.

## Relationship With Other Prompts
- `plan` — in-conversation plan, no file output. Use for quick decisions.
- `plan-doc` (this) — persists the plan as a file set with a progress pointer. Use for multi-session work.

Apply ECC coding standards throughout: immutable patterns, small focused files, explicit error handling.
