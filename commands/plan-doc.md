---
description: 'Generate a complete task-scoped documentation set under docs/plan/<task-slug>-YYYY-MM-DD/: README, execution log with progress pointer and subagent plan, architecture design, dev guide, roadmap, and optional test docs. Prefer /ecc:plan for execution, fall back to plain-language resume prompt if declined.'
argument-hint: '<task-slug> [test] | [test] <task-slug>'
---

> Language Requirements
>
> - Generated documents follow the host project's primary documentation language
>   - If `docs/README.md` is Chinese, generate Chinese docs
>   - If `docs/README.md` is English or missing, default to the user's conversation language
> - Filenames use numbered prefixes; file body language follows the project
> - All generated files must be UTF-8 (no BOM)

# plan-doc Command

Generate a complete task-scoped documentation set in `docs/plan/<task-slug>-YYYY-MM-DD/` so an AI can execute a multi-phase engineering task across multiple sessions without losing progress.

Default execution companion is `/ecc:plan`: it handles in-conversation phase execution, while `/ecc:plan-doc` **persists** that plan as linked markdown files with a progress pointer and a subagent plan baked in.

## Trigger

```text
/ecc:plan-doc <task-slug>          # standard set (5 docs)
/ecc:plan-doc <task-slug> test     # include test plan + test cases (7 docs)
/ecc:plan-doc test <task-slug>     # same, arg order flexible
/ecc:plan-doc                      # interactive, ask for slug
```

## When to Use

- A work item will produce 3+ linked docs (bug-fix campaign, refactor, feature rollout, audit follow-up)
- Work will span multiple sessions or multiple agents and needs a persistent progress anchor
- The task has distinct phases that should be executed in order with per-phase verification
- You want a subagent plan baked into the docs rather than re-decided each session

Do NOT use when:

- The change fits in a single file / single session / single PR → just edit directly
- The output is one doc → put it under the right top-level category (`docs/design/`, `docs/guide/`, etc.) instead

## Parameters

### Positional

- `<task-slug>` (required unless interactive): english kebab-case, stable, no dates unless disambiguating. Examples: `ble-multi-device-fix`, `home-card-migration`, `auth-rewrite-2026q2`.
- `test` (optional): include test plan + test cases.

### Implicit test-mode triggers

If any of these appear in the **invocation prompt body** (not the slug), enable test mode automatically:

- Chinese: `测试`, `回归`, `自测`, `QA`, `验证`, `用例`
- English: `test`, `regression`, `QA`, `verification`, `test case`, `test plan`

Only inspect the prompt body. Do NOT match the slug (e.g. a slug like `foo-test-migration` must not trigger test mode).

## Execution Flow

Every invocation runs 6 core stages plus the Stage 2.5 execution-command resolution checkpoint and the Stage 3.5 model-switch checkpoint. Do NOT skip any of them.

### Stage 1. Restate

- Read the user's task description
- Extract: task name, core problem, affected modules, observable symptoms, related source paths, related upstream docs (reports, existing guides)
- If the project has an audit / bug report / PRD, read it once and summarize in 3 bullets

### Stage 2. Ask Clarifying (only if missing)

Ask at most 3 targeted questions. Do NOT ask generic ones.

Required clarifications:

- Slug: if not provided
- Test docs: if ambiguous (test keyword absent but task clearly touches QA surface)
- Source files: if the task description is too abstract to know which files are in scope

Use a single AskUserQuestion tool call for multiple questions. Do NOT ask one-by-one.

### Stage 2.5. Resolve execution command

Before emitting the first execution prompt, resolve the preferred plan command in this order:

1. `/ecc:plan`
2. `/everything-claude-code:plan`
3. No slash plan command available

Rules:

- Default to `/ecc:plan` when it exists.
- If `/ecc:plan` is unavailable but `/everything-claude-code:plan` exists, use `/everything-claude-code:plan`.
- If neither exists, explicitly tell the user that the generated docs work best with `/ecc:plan` or `/everything-claude-code:plan` and ask whether they want to install one.
- If the user declines installation, degrade gracefully: generate the docs anyway and print a slash-command-free resume prompt that starts directly from "请先阅读 docs/plan/.../00-执行文档.md".
- Do NOT silently swap to a degraded prompt without first offering installation.

### Stage 3. Emit Plan + WAIT for confirmation

Output a plan in this exact shape:

```
# plan-doc generation plan: <task-slug>

## Output location
docs/plan/<task-slug>-<YYYY-MM-DD>/

## Documents to generate
- README.md — index
- 00-执行文档.md — execution log with progress pointer + subagent plan
- 01-架构设计.md — core decisions
- 02-开发规范.md — dev guide (禁止/必须, code templates, anti-patterns)
- 03-修复路线图.md — phase breakdown, milestones, rollback
- 04-测试计划.md — (only if test mode)
- 05-测试用例清单.md — (only if test mode)

## Detected stack
<flutter | android | web | python | java | generic>

## Subagent plan (embedded in 00-执行文档.md)
<table of phases × roles × recommended agents, stack-specific>

## Phases detected from task description
Phase 1: ...
Phase 2: ...
...

## Parallel groups analysis
Independent (can run in parallel):
  - Group A: [phase items with no shared files/interfaces]
  - Group B: [phase items with no shared files/interfaces]
Serial (must run after dependencies):
  - Group C: [items that depend on A or B output]
Note: If all items are interdependent, omit this ENTIRE section including the heading — do NOT write "N/A" or an empty list. TR/T pipelines treat absence of this section as signal to use serial mode.

## Upstream sources of truth (will NOT be modified)
- <list of .cursor/rules/*.mdc, docs/guide/*使用规范.md, etc.>

## Waiting for confirmation
Reply "yes" / "proceed" to start file generation (pipeline continues automatically after this).
Append "wait for switch" to pause at model handoff for manual model change.
Reply "modify: ..." to adjust the plan before generating.
```

**DO NOT generate files until the user confirms.**

### Stage 3.5. Model-switch handoff (non-blocking by default)

Immediately after the user replies `yes` / `proceed`, output the generation handoff and proceed to Stage 4 in the same turn — **do NOT wait for a separate `继续` reply**.

Exception (opt-in slow path): if the Stage 3 confirmation text contains `wait for switch` / `先切模型` / `等切模型`, then pause after the handoff and wait for `继续` before continuing. Otherwise proceed automatically.

1. Build a compact `Generation Handoff` block containing:
   - `task_slug`
   - `output_dir`
   - `docs_language`
   - `test_mode`
   - `detected_stack`
   - `resolved_plan_command`
   - `upstream_sources`
   - `phase_list`
   - `doc_list`
   - `generation_risks`
2. Recommend the generation model using this routing policy:
   - Default to `haiku` for template filling, cross-linking, and straightforward markdown generation.
   - Recommend `sonnet` instead when any of the following is true:
     - test mode is enabled and the task needs nontrivial test strategy or regression matrix synthesis
     - upstream sources are numerous (`> 3`) or materially conflict with each other
     - the task is terminology-heavy, mixed-language, or architecture-heavy
     - `01-架构设计.md`, `04-测试计划.md`, or `05-测试用例清单.md` require fresh synthesis rather than direct expansion from the handoff
     - the user explicitly prefers quality over cost
3. Print the checkpoint in this exact shape:

```text
## Generation Handoff (auto-continuing to Stage 4)
建议生成模型: <haiku | sonnet>。如需切换模型，请下次调用前先切换；本次将使用当前模型继续生成。
（在 Stage 3 确认时附加 "wait for switch" 可强制暂停等待手动切换。）

### Generation Handoff
- task_slug: ...
- output_dir: ...
- docs_language: ...
- test_mode: ...
- detected_stack: ...
- resolved_plan_command: ...
- upstream_sources:
  - ...
- phase_list:
  - Phase 1: ...
  - Phase 2: ...
- parallel_groups: (from Stage 3 analysis; null if all items interdependent)
  - group: A / items: [...] / depends_on: []
  - group: C / items: [...] / depends_on: [A]
- doc_list:
  - README.md
  - 00-执行文档.md
  - ...
- generation_risks:
  - ...
```

4. **Default (fast path)**: after printing the handoff, immediately proceed to Stage 4 in the same turn — no separate user reply needed.
5. **Slow path (opt-in)**: only if Stage 3 confirmation contained `wait for switch` / `先切模型` / `等切模型`, append "切换完成后请输入：继续" and wait for that exact reply.
6. If the user changes the task before Stage 4 completes, go back to Stage 1 or Stage 2 as needed.

### Stage 4. Generate

Only after Stage 3 confirmation (Stage 3.5 wait is skipped in default fast path):

1. Read the Stage 3.5 `Generation Handoff` block first and use it as the primary input for generation.
   - Do NOT repeat the full audit if the handoff already contains enough information.
   - Only reread upstream sources when the handoff is missing details, the sources conflict, or the user changed the task.
2. Compute the target directory: `docs/plan/<task-slug>-<today-date>/` where `<today-date>` is the local date in `YYYY-MM-DD` format at generation time.
   - Scan for existing directories matching `docs/plan/<task-slug>-*/` (same slug, any date). **Auto-decide**:
     - Existing dir's date == today's date → **auto-reuse** (write into the same dir, treating as a continuation). Print one line: `已复用 <found-dir>（同日重生成）`.
     - Existing dir's date != today's date → **auto-create new** dated dir. Print one line: `已创建 <new-dir>（旧任务保留在 <found-dir>，未修改）`.
     - If target dir already exists with content matching today's date AND user explicitly wrote `force-new` in Stage 3 confirmation → create new with date suffix `-2`.
   - Only ask the user when there is a destructive conflict (different content under exact same path).

   **Checkpoint resume (断点恢复)**: After resolving the target directory, check whether `00-执行文档.md` already exists inside it:
   - If it exists and contains a `<!-- progress-pointer:start -->` block:
     1. Read the progress pointer YAML.
     2. Print one line: `检测到进度快照：Phase <current_phase> / <current_phase_status>`
     3. **Do NOT regenerate any doc that already exists on disk**. Only generate missing files (e.g. if `03-修复路线图.md` is absent, generate it; skip files that are present).
     4. Jump directly to the phase indicated by `current_phase`: append to the execution log in `00-执行文档.md` instead of overwriting it.
     5. Skip all file-generation steps for documents that are already present; output `已跳过（已存在）` for each skipped file.
   - If `00-执行文档.md` does not exist, proceed with full generation as normal.

3. **Before writing `00-执行文档.md`**: translate the "Parallel groups analysis" from the Stage 3.5 `Generation Handoff` into a structured YAML array and embed it in the progress pointer under the `parallelizable_groups` key. The YAML format is:
   ```yaml
   parallelizable_groups:
     - group: A
       items: [P1.1, P1.2]
       depends_on: []
     - group: B
       items: [P1.3]
       depends_on: []
     - group: C
       items: [P1.4]
       depends_on: [A]
   ```
   If the Stage 3 analysis was omitted (all items interdependent), set `parallelizable_groups: null`. Do NOT leave this field absent — TR/T pipelines require it to be present (even if null) to decide dispatch mode.
4. Write the docs in this order: `README.md` → `00-执行文档.md` → `01` → `02` → `03` → (`04` → `05` if test)
5. Cross-link documents (README links to all; `00` links to `01-03`; each numbered doc has prev/next links)

### Stage 5. Post-generation

After writing all files:

1. **Read-back verification (防丢失)**: after all Write calls, list the target directory and confirm every expected file (5 standard, or 7 in test mode) is present on disk with non-empty content. If any file is missing or empty (e.g. dropped by a formatter / sync hook / failed write), regenerate the missing file before proceeding. Print one line per file: `✓ <file> (<lines> lines)` or `✗ <file> 缺失，已补写`.
2. Report total line count per file
3. Append an entry to `docs/README.md` under its `计划文档 / Plan docs` section linking to the new task subdir (if such a section exists; otherwise suggest adding one)
4. Remind the user that `.cursor/rules/*` and top-level usage guides were NOT modified
5. Print the first execution prompt the user should give the AI, after applying Stage 2.5 command resolution

## Output Structure

目录命名规则：`docs/plan/<task-slug>-<YYYY-MM-DD>/`

- `<task-slug>`：用户提供的英文 kebab-case 标识符
- `<YYYY-MM-DD>`：生成当天的本地日期，例如 `2026-05-06`
- 示例：`docs/plan/ble-multi-device-fix-2026-05-06/`

```
docs/plan/<task-slug>-<YYYY-MM-DD>/
├── README.md                  # required - task index, background, doc list, task status
├── 00-执行文档.md             # required - progress pointer, subagent plan, checklists
├── 01-架构设计.md             # required - core architectural decisions
├── 02-开发规范.md             # required - coding rules, must/forbidden, templates, anti-patterns
├── 03-修复路线图.md           # required - phase breakdown, milestones, rollback
├── 04-测试计划.md             # optional - test strategy (entry/exit criteria, environment)
└── 05-测试用例清单.md         # optional - structured test cases, regression matrix
```

## Key Design: 00-执行文档.md

This is the file that makes `plan-doc` different from a plain execution command like `/ecc:plan`.

### Must contain

1. **Progress pointer** wrapped in `<!-- progress-pointer:start -->` / `<!-- progress-pointer:end -->` HTML comments, containing a YAML block with:
   - `current_phase` (int)
   - `current_phase_status` (enum: not_started / planning / coding / self_testing / in_review / completed / blocked)
   - `last_updated` (ISO 8601 UTC)
   - `last_actor` (main-agent / subagent:<name> / human)
   - `last_commit` (git hash or null)
   - `next_action` (one-line)
   - `blockers` (string array)
   - `parallelizable_groups` (object array, nullable): each entry has `group` (string label), `items` (P<N>.<M> list), `depends_on` (group label array, empty = independent). Populated during plan-doc generation; used by TR/T pipelines to decide parallel dispatch.

2. **Resume protocol** (mandatory reading for any AI entering the task):
   - Step 1: read progress pointer
   - Step 2: jump to corresponding Phase checklist
   - Step 3: continue from first unchecked item
   - Step 4: on completion, tick checkbox + update pointer + append to execution log
   - Step 5: on blocker, set status=blocked, stop, report to user
   - Step 6: phase switch only after all checklist items verified

3. **Subagent plan** (stack-specific, see below)

4. **Per-phase checklists** with ordered atomic items (P<N>.<M> format), branch name, acceptance criteria

5. **Execution log** (reverse chronological table, AI appends every state change)

6. **Execution prompt template** users can hand to a fresh AI session

### Checklist item granularity (low-capability-AI safe)

The single most important quality bar for `00-执行文档.md` is that a **weak / low-capability AI can execute each item without guessing**. A checklist item like "实现 BLE 自愈" is a FAILURE — it is a goal, not an executable step.

Every `P<N>.<M>` item MUST be written so it answers all four of these, explicitly:

1. **读什么 (Read what)** — the exact file(s) and the symbol / method / section to read first (e.g. "通读 `lib/core/audio/ble_audio_source.dart` 的 `start()` 与 `_rawAudioSubscription`"). Never assume the AI already knows the code.
2. **改什么 (Change what)** — the precise insertion point described **semantically** (method name, neighboring field, "放在 `start()` 之后、`stop()` 之前"), plus a pointer to the matching template in `02-开发规范.md`. State which file is touched.
3. **怎么验证 (How to verify)** — the exact command(s) to run (e.g. `flutter analyze <files>` / `flutter test <dir>`) and what "green" looks like.
4. **完成判据 (Done criteria)** — an observable, binary condition that decides whether the box can be ticked (e.g. "analyze 0 error 且模拟丢流后日志出现『重订阅完成』").

Additional low-capability-AI guardrails the generator MUST bake in:

- **Line numbers are hints, not coordinates.** Every reference to a line number MUST be paired with a stable anchor (method/symbol/section name) and an explicit note that line numbers drift — the executor must locate by symbol, never blind-edit by line.
- **First item of every phase is always a read-and-confirm item** (`P<N>.1`): read current state, write one paragraph of findings into the execution log. No code change in the first item.
- **List forbidden actions inline** where a step is risky ("不要重连蓝牙", "不要删 try/finally"), do not rely on the AI to infer them.
- **One item = one reviewable change.** If a step needs more than ~1 PR worth of edits, split it into `P<N>.<M>` sub-items.

### Placeholder conventions

- `{{TASK_SLUG}}` — slug only, no date, used for descriptive task name references
- `{{TASK_DIR}}` — full directory name `<task-slug>-<YYYY-MM-DD>`, used for file path references
- All path placeholders in templates use `{{TASK_DIR}}`

### Forbidden in 00-执行文档.md

- Do not leave the progress pointer outside the HTML comment anchors (other tools rely on the anchors)
- Do not omit the resume protocol
- Do not put architectural content here (put in 01)
- Do not put code templates here (put in 02)

## Subagent Plan (Stack-Specific)

Stack detection signals:

- `pubspec.yaml` + `lib/main.dart` → Flutter
- `settings.gradle[.kts]` + `AndroidManifest.xml` → Android
- `package.json` + `next.config.*` / `vite.config.*` → Web
- `pyproject.toml` / `requirements.txt` → Python
- `pom.xml` / `build.gradle[.kts]` with `src/main/java` → Java

The subagent plan embedded in `00-执行文档.md` must include a `Parallel Group` column so TR/T pipelines can dispatch agents in bulk. Use the group labels from the "Parallel groups analysis" section in Stage 3. Items with no group dependency share the same label and can be dispatched simultaneously; items with `depends_on` must wait for their dependencies.

### Flutter recommended subagents

| Role                   | Recommended                                     | Parallel Group              |
| ---------------------- | ----------------------------------------------- | --------------------------- |
| Coding                 | main-agent                                      | `<group label, e.g. A / B>` |
| Build fix              | `ecc:dart-build-resolver`                       | serial — do not parallelize |
| Review                 | `ecc:flutter-reviewer`                          | `<group label, e.g. A / B>` |
| E2E test orchestration | `ecc:e2e-runner` (real-device tests stay human) | serial — do not parallelize |

### Android recommended subagents

| Role      | Recommended                                              | Parallel Group              |
| --------- | -------------------------------------------------------- | --------------------------- |
| Coding    | main-agent                                               | `<group label, e.g. A / B>` |
| Build fix | `ecc:kotlin-build-resolver` or `ecc:java-build-resolver` | serial — do not parallelize |
| Review    | `ecc:kotlin-reviewer` or `ecc:java-reviewer`             | `<group label, e.g. A / B>` |

### Web / Node / React

| Role      | Recommended                | Parallel Group              |
| --------- | -------------------------- | --------------------------- |
| Coding    | main-agent                 | `<group label, e.g. A / B>` |
| Build fix | `ecc:build-error-resolver` | serial — do not parallelize |
| Review    | `ecc:typescript-reviewer`  | `<group label, e.g. A / B>` |
| E2E       | `ecc:e2e-runner`           | serial — do not parallelize |

### Python

| Role    | Recommended           | Parallel Group              |
| ------- | --------------------- | --------------------------- |
| Coding  | main-agent            | `<group label, e.g. A / B>` |
| Review  | `ecc:python-reviewer` | `<group label, e.g. A / B>` |
| Testing | `ecc:tdd-guide`       | `<group label, e.g. A / B>` |

### Java / Spring Boot

| Role      | Recommended               | Parallel Group              |
| --------- | ------------------------- | --------------------------- |
| Coding    | main-agent                | `<group label, e.g. A / B>` |
| Build fix | `ecc:java-build-resolver` | serial — do not parallelize |
| Review    | `ecc:java-reviewer`       | `<group label, e.g. A / B>` |

### Generic (unknown stack)

| Role     | Recommended             | Parallel Group              |
| -------- | ----------------------- | --------------------------- |
| Coding   | main-agent              | `<group label, e.g. A / B>` |
| Review   | `ecc:code-reviewer`     | `<group label, e.g. A / B>` |
| Security | `ecc:security-reviewer` | serial — do not parallelize |

Forbidden subagent uses (apply universally):

- Do not delegate progress pointer updates to subagents
- Do not delegate phase switching decisions
- Do not delegate core logic touching upstream sources of truth

## Relationship With Other Commands

- **`/ecc:plan`** — in-conversation plan, no file output. Use for quick decisions.
- **`/ecc:plan-doc`** — persists plan as file set with progress pointer. Use for multi-session work.
- **`/ecc:prp-plan`** / **`/ecc:prp-implement`** — PRD-driven artifact planning; use when the task starts from a product spec rather than an engineering problem.

## Model Routing Policy

`plan-doc` separates expensive reasoning from cheaper document generation.

- Stages 1-3: use the current stronger model to restate the task, clarify gaps, resolve execution command, and design the phase plan.
- Stage 3.5: stop and explicitly tell the user which model to switch to for document generation.
- Stage 4: resume only after the user switches model manually and replies `继续`.

Routing rules:

- Default recommendation: `haiku`
- Recommend `sonnet` when the generation work still needs substantial synthesis, conflict resolution, or complex test/architecture writing
- Never auto-switch silently; always ask the user to switch manually
- Never ask the cheaper model to redo the full audit unless the handoff is incomplete or the user changed requirements

When in doubt:

- One-shot change → just edit
- Single-session multi-file → `/ecc:plan`
- Multi-session with phases → `/ecc:plan-doc`
- PRD → `/ecc:prp-plan`

## Anti-Patterns

- Generating docs before user confirmation (violates the plan-first workflow)
- Overwriting an existing `00-执行文档.md` that already has a progress pointer — always treat an existing pointer as a checkpoint and resume from it rather than starting over
- Regenerating docs that already exist on disk when resuming from a checkpoint — check for file existence before each Write call and skip files that are present
- Generating docs immediately after `yes` / `proceed` without first stopping at the Stage 3.5 model-switch checkpoint
- Writing test docs by default when user didn't ask or the task doesn't involve QA
- Hardcoding subagent names that don't exist in the host's installed agents
- Putting code changes in 02-开发规范.md (it's a guide, not an implementation)
- Omitting the progress pointer anchors or using a different marker
- Copying the original audit/report content verbatim into 01 (01 should synthesize decisions, not restate evidence)
- Generating more than 7 files under `docs/plan/<task-slug>-<YYYY-MM-DD>/` — the fixed structure is the contract
- Creating a separate `06-并行分组.md` file for the parallel groups analysis — it must be embedded in `00-执行文档.md` progress pointer as `parallelizable_groups` YAML, never as a standalone file
- Modifying `.cursor/rules/*.mdc` or top-level `docs/guide/*使用规范.md` during generation
- Omitting the date suffix from the directory name
- Embedding a date inside the slug itself to work around the suffix rule (results in double-date)
- Silently creating a new dated directory when a same-slug directory already exists — always prompt the user to choose between reuse and new task first
- Matching `test` keyword inside the slug (slug is not prompt body)
- Creating nested task subdirs
- Letting the generation model re-read every audit source by default instead of using the Stage 3.5 `Generation Handoff`
- Defaulting to `sonnet` for routine template filling that `haiku` can handle
- Defaulting to `haiku` when the task still needs substantial synthesis for architecture or QA documents
- Writing abstract / goal-level checklist items (e.g. "实现 X", "修复 Y") instead of executable `读什么/改什么/怎么验证/完成判据` items — a low-capability AI must be able to run each step without guessing
- Referencing line numbers in checklists or templates without pairing them with a stable symbol/section anchor and a "line numbers drift" note
- Skipping the read-and-confirm first item (`P<N>.1`) of a phase and jumping straight to code changes
- Finishing generation without the Stage 5 read-back verification — never assume a Write succeeded just because the tool returned; a formatter or sync hook can drop a file (observed: `00-执行文档.md` silently disappearing)

## Examples

### Example 1: Bug fix campaign with test docs

```
User: /ecc:plan-doc ble-multi-device-fix test
      based on docs/reports/bluetooth-audit.md

Agent:
# plan-doc generation plan: ble-multi-device-fix

## Output location
docs/plan/ble-multi-device-fix-2026-05-06/
...
(emits 7-doc plan, waits for confirmation)

User: yes

Agent:
## Model switch checkpoint
已完成审计和写文档准备。下一步建议切换到 sonnet 再继续生成文档。
...
切换完成后请输入：继续

User: 继续

Agent:
(generates 7 files + first execution prompt)
```

### Example 2: Implicit test trigger from prompt

```
User: /ecc:plan-doc home-card-migration
      需要完整测试计划和回归用例

Agent: (detects "测试计划" + "用例" in prompt body -> test mode on)
# plan-doc generation plan: home-card-migration
... includes 04 and 05 ...
```

### Example 3: Standard feature rollout (no test docs)

```
User: /ecc:plan-doc realtime-notifications

Agent:
# plan-doc generation plan: realtime-notifications
... 5 docs (no 04/05) ...

User: yes

Agent:
## Model switch checkpoint
已完成审计和写文档准备。下一步建议切换到 haiku 再继续生成文档。
...
切换完成后请输入：继续

User: 继续

Agent:
(generates 5 files + first execution prompt)
```

## Best Practices

1. Always restate in your own words before asking clarifying questions
2. Keep phase count <= 5 by default; if task truly needs more, group into sub-phases under a parent phase
3. Each phase checklist item should be atomic (one PR can complete it) and verifiable
4. Cross-link every doc to README and prev/next
5. Reserve `00-` prefix exclusively for the execution log — never use it for content docs
6. When the task does NOT produce code (e.g. pure research), still generate `00-执行文档.md`; set subagent plan accordingly (reviewer-only roles)
