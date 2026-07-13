---
description: 'Generate and post-audit a task-scoped documentation set under docs/plan/<task-slug>-YYYY-MM-DD/: README, execution log, architecture, dev guide, roadmap, and optional test docs. Reconcile product requirements with executable steps and repair confirmed documentation defects before handoff.'
argument-hint: '<task-slug> [test] | [test] <task-slug>'
---

> Language Requirements
>
> - Follow the host project's primary documentation language.
> - If `docs/README.md` is Chinese, write Chinese. If it is English or missing,
>   default to the user's conversation language.
> - Keep numbered filenames as specified by the document contract.
> - Write UTF-8 without BOM.

# plan-doc Command

Create and quality-gate a persistent multi-session engineering plan under
`docs/plan/<task-slug>-YYYY-MM-DD/`. The default execution companion is
`/ecc:execute-doc`, which consumes `00-执行文档.md` directly.

## Trigger

```text
/ecc:plan-doc <task-slug>
/ecc:plan-doc <task-slug> test
/ecc:plan-doc test <task-slug>
/ecc:plan-doc
```

Use this workflow when a task needs 3+ linked documents, multiple sessions or
agents, ordered phases, persistent progress, and per-phase verification. Do not
use it for a single-file, single-session, or one-document change.

## Parameters

- `<task-slug>`: required unless interactive; stable English kebab-case without
  a date unless needed for disambiguation.
- `test`: optional; adds `04-测试计划.md` and `05-测试用例清单.md`.

Enable test mode when the invocation body (never the slug) includes Chinese
`测试`, `回归`, `自测`, `QA`, `验证`, `用例`, or English `test`, `regression`,
`QA`, `verification`, `test case`, `test plan`.

## Mandatory Reference Loading

This file is the lean orchestrator. The references below are part of the command
contract and must be read by the main agent, not delegated or summarized by a
subagent. Paths are relative to `commands/`.

1. Before Stage 3, read completely:
   - `plan-doc/references/document-contract.md`
   - `plan-doc/references/subagent-routing.md`
2. During initial preparation, read completely:
   - `plan-doc/references/post-generation-quality-gate.md`
3. Before Stage 4 writes any file, reread
   `plan-doc/references/document-contract.md` completely.
4. Before Stage 5, reread
   `plan-doc/references/post-generation-quality-gate.md` completely. Read it again immediately before Stage 5; never certify from memory or the Generation Handoff.

If a mandatory reference is missing or empty, stop before generation and report
a broken installation. Do not silently degrade the contract.

## Execution Flow

Run all five stages plus Stage 2.5 and Stage 3.5. Do not skip a stage, including
on checkpoint resume.

### Stage 1. Restate and inventory sources

- Extract task name, problem, affected modules, observable symptoms, source
  paths, and related reports/guides.
- Discover and read all relevant product sources: PRDs, requirement documents,
  accepted designs, issue acceptance criteria, audit/bug reports, and product
  guides.
- Record exact source paths and stable section headings. When product sources
  lack IDs, derive deterministic reading-order IDs (`REQ-001`, `REQ-002`, ...).
- Summarize intent, exclusions, and unresolved conflicts in 3-7 bullets. Never
  silently choose between conflicting requirements.
- Separately identify protected non-product rules/policies that generation must
  not modify.

### Stage 2. Clarify only material gaps

Ask at most three targeted questions in one grouped prompt. Ask only when needed:

- slug is missing;
- test mode is genuinely ambiguous;
- task scope is too abstract to identify source files or product sources;
- conflicting product intent prevents a safe plan.

Do not ask generic or one-by-one questions. In runtimes without a structured
question tool, ask the same concise grouped question in plain text.

### Stage 2.5. Resolve execution command

Resolve in order:

1. `/ecc:execute-doc`
2. `/ecc:plan`
3. `/everything-claude-code:plan`
4. plain-language resume prompt

Prefer `/ecc:execute-doc` because it consumes `00-执行文档.md`. If none exists,
offer installation before degrading. If declined, still generate documents and
use a prompt beginning `请先阅读 docs/plan/.../00-执行文档.md`.

### Stage 3. Emit plan and wait for confirmation

First read the document contract and subagent-routing reference. Then output:

```text
# plan-doc generation plan: <task-slug>

## Output location
docs/plan/<task-slug>-<YYYY-MM-DD>/

## Documents to generate
- README.md
- 00-执行文档.md
- 01-架构设计.md
- 02-开发规范.md
- 03-修复路线图.md
- 04-测试计划.md (test mode only)
- 05-测试用例清单.md (test mode only)

## Detected stack
<flutter | android | web | python | java | generic>

## Subagent plan
<phase × role × installed agent × parallel group>

## Phases
Phase 1: ...
Phase 2: ...

## Parallel groups analysis
Independent:
- Group A: [items with no shared files/interfaces]
Serial after dependencies:
- Group C: [items depending on A]

## Product sources of truth (re-read in Stage 5)
- <path + stable section>

## Protected non-product sources (will NOT be modified)
- <rules, policies, top-level usage guides>

## Waiting for confirmation
Reply "yes" / "proceed" to generate and audit.
Append "wait for switch" to pause at the model handoff.
Reply "modify: ..." to revise this plan.
```

If all work is interdependent, omit the entire `Parallel groups analysis`
section. Do not write `N/A`; downstream pipelines use absence as serial mode.

Do not create files before confirmation.

### Stage 3.5. Generation handoff

After `yes` / `proceed`, print a compact handoff and continue to Stage 4 in the
same turn by default. Pause only if confirmation included `wait for switch`,
`先切模型`, or `等切模型`; then wait for `继续`.

```text
## Generation Handoff (auto-continuing to Stage 4)
建议生成模型: <haiku | sonnet>。本次使用当前模型继续生成。

### Generation Handoff
- task_slug: ...
- output_dir: ...
- docs_language: ...
- test_mode: ...
- detected_stack: ...
- resolved_execution_command: ...
- product_sources:
  - ...
- protected_sources:
  - ...
- phase_list:
  - Phase 1: ...
- parallel_groups: <array or null>
- doc_list:
  - README.md
  - 00-执行文档.md
- generation_risks:
  - ...
```

Recommend `haiku` only for straightforward template expansion. Recommend
`sonnet` when test strategy, architecture synthesis, conflicts, terminology, or
more than three upstream sources require substantial reasoning. Never claim the
runtime switched models automatically.

### Stage 4. Generate or resume

1. Reread `plan-doc/references/document-contract.md` completely and use the
   handoff as the primary generation input. Reread upstream sources here only
   when the handoff is incomplete/conflicting or the task changed; Stage 5 will
   independently reread product sources.
2. Resolve `docs/plan/<task-slug>-<local-YYYY-MM-DD>/`:
   - same slug and today's date: reuse;
   - same slug with an older date: create today's directory, preserve the old;
   - `force-new` with an occupied same-day target: use suffix `-2`;
   - ask only before an exact-path destructive conflict.
3. If `00-执行文档.md` contains the progress-pointer anchors:
   - parse and report the pointer snapshot;
   - do not overwrite it or regenerate existing docs during Stage 4;
   - generate missing files only and append to the execution log;
   - Stage 5 may still minimally revise existing docs to repair confirmed
     alignment or robustness defects.
4. Convert Stage 3 parallel groups into the progress pointer:

   ```yaml
   parallelizable_groups:
     - group: A
       items: [P1.1, P1.2]
       depends_on: []
     - group: C
       items: [P1.4]
       depends_on: [A]
   ```

   Use `parallelizable_groups: null` when all work is interdependent. Never omit
   the key.
5. Generate in the exact order and structure from `document-contract.md`.

### Stage 5. Post-generation quality gate

After every expected file is written or checkpoint-resolved, reread
`plan-doc/references/post-generation-quality-gate.md` from disk and execute it
completely. It owns read-back verification, fresh product/execution reads,
bidirectional traceability, robustness checks, repair/re-audit, persisted audit
evidence, and the `PASS` / `BLOCKED` handoff.

Stage 5 is mandatory on new generation and checkpoint resume. Never print an
execution prompt until the gate returns `PASS`.

## Related Commands

- `/ecc:plan`: in-conversation planning without persistent artifacts.
- `/ecc:execute-doc`: preferred executor for the generated progress document.
- `/ecc:prp-plan` / `/ecc:prp-implement`: PRD-driven artifact workflow.

## Non-Negotiable Guardrails

- Plan and user confirmation precede writes.
- References are loaded at their checkpoints, especially the fresh Stage 5 read.
- Existing progress pointers are resumed, never overwritten.
- Protected sources are not modified during generation.
- Subagents never update pointers, decide phase transitions, certify Stage 5, or
  resolve product-intent conflicts.
- The final status is `PASS` only when no confirmed documentation defect remains;
  otherwise it is `BLOCKED` with a recorded product-decision blocker.
