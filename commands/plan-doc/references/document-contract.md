# plan-doc Document Contract

Read this file completely before emitting the Stage 3 plan. After every
expected document is written or checkpoint-resolved, read it again immediately
before the Stage 5 conformance audit. It is the source of truth for both the
confirmed generation plan and the post-generation audit. Do not rely on
remembered templates when certifying the output.

## Fixed Output Structure

Directory: `docs/plan/<task-slug>-<YYYY-MM-DD>/`

- `<task-slug>` is stable English kebab-case without an embedded date.
- `<YYYY-MM-DD>` is the local generation date.
- Generate exactly 5 standard files or 7 files in test mode. Do not create
  nested task directories or an extra parallel-groups document.

```text
docs/plan/<task-slug>-<YYYY-MM-DD>/
├── README.md
├── 00-执行文档.md
├── 01-架构设计.md
├── 02-开发规范.md
├── 03-修复路线图.md
├── 04-测试计划.md       # test mode only
└── 05-测试用例清单.md   # test mode only
```

Write in this order: `README.md` → `00-执行文档.md` → `01` → `02` → `03`
→ (`04` → `05` in test mode). README links to every document; `00` links to
`01-03`; each numbered document includes README and previous/next navigation.

## Document Responsibilities

- `README.md`: task background, scope, product sources, document index, current
  state, and final audit result.
- `00-执行文档.md`: progress pointer, resume protocol, requirement traceability,
  subagent routing, atomic phase checklists, execution log, final audit evidence,
  and the fresh-session execution prompt.
- `01-架构设计.md`: synthesized architecture decisions, boundaries, interfaces,
  state/data flows, failure handling, and rejected alternatives. Do not copy an
  upstream audit verbatim.
- `02-开发规范.md`: mandatory/forbidden rules, stable-symbol editing guidance,
  code/test templates, and anti-patterns. It is guidance, not implementation.
- `03-修复路线图.md`: phases, dependencies, milestones, verification gates,
  rollback/recovery, and release sequencing.
- `04-测试计划.md`: environments, strategy, entry/exit criteria, coverage and
  regression scope, only in test mode.
- `05-测试用例清单.md`: requirement-linked cases, negative/boundary cases, and
  regression matrix, only in test mode.

## `00-执行文档.md` Required Structure

### Progress pointer

Wrap one YAML block inside `<!-- progress-pointer:start -->` and
`<!-- progress-pointer:end -->`. It must contain:

- `current_phase` (integer)
- `current_phase_status` (`not_started`, `planning`, `coding`, `self_testing`,
  `in_review`, `completed`, or `blocked`)
- `last_updated` (ISO 8601 UTC)
- `last_actor` (`main-agent`, `subagent:<name>`, or `human`)
- `last_commit` (git hash or `null`)
- `next_action` (one line)
- `blockers` (string array)
- `parallelizable_groups` (object array or `null`), where every object has
  `group`, `items`, and `depends_on`

Example:

```yaml
parallelizable_groups:
  - group: A
    items: [P1.1, P1.2]
    depends_on: []
  - group: C
    items: [P1.4]
    depends_on: [A]
```

Use `parallelizable_groups: null` when every item is interdependent. Never omit
the key; downstream TR/T pipelines use it to choose dispatch mode.

### Resume protocol

1. Read the progress pointer.
2. Jump to the corresponding phase checklist.
3. Continue from the first unchecked item.
4. After completion, tick the item, update the pointer, and append a reverse-
   chronological execution-log entry.
5. On a blocker, set status to `blocked`, record it, stop, and report it.
6. Switch phases only after every item and acceptance criterion is verified.

### Other mandatory sections

- Stack-specific subagent plan from `subagent-routing.md`
- Per-phase ordered checklist with `P<N>.<M>` IDs, branch, dependencies, and
  acceptance criteria
- Reverse-chronological execution log
- Requirement traceability table maintained by Stage 5, with requirement ID,
  source path + stable section, implementation items, acceptance/test evidence,
  and status
- `生成后对齐与鲁棒性审计` record with coverage counts, repairs, blockers, and
  final `PASS` or `BLOCKED`
- Fresh-session execution prompt, omitted while the audit is `BLOCKED`

## Atomic Checklist Contract

A weak / low-capability AI must execute every `P<N>.<M>` item without guessing.
Each item explicitly answers:

1. **Read what**: exact file and stable symbol/method/section to inspect first.
2. **Change what**: exact touched file and semantic insertion point, plus the
   matching template/constraint in `02-开发规范.md`.
3. **How to verify**: exact command or evidence procedure and what green means.
4. **Done criteria**: observable binary condition for checking the box.

Additional guardrails:

- `P<N>.1` is always read-and-confirm only: inspect current state and append one
  findings paragraph to the execution log; make no code change.
- Line numbers are hints, never coordinates. Pair every line hint with a stable
  symbol/section and say that line numbers drift.
- Put risky forbidden actions inline; do not expect inference from another doc.
- One item equals one reviewable change. Split anything larger than roughly one
  PR.
- Never invent a file, symbol, script, or green command. Verify it against the
  repository when available.

## Placeholders

- `{{TASK_SLUG}}`: slug without date, for descriptive references.
- `{{TASK_DIR}}`: full `<task-slug>-<YYYY-MM-DD>` directory name, for paths.
- All template path placeholders use `{{TASK_DIR}}`.

## Generation Guardrails

- Never generate before the Stage 3 confirmation.
- Do not require a redundant contract reread immediately before Stage 4 writes;
  generate from the confirmed plan and Generation Handoff, then audit the
  completed output against a fresh contract read in Stage 5.
- Never overwrite a checkpointed `00-执行文档.md`; resume it. In Stage 4 skip
  existing documents, while Stage 5 may make minimal evidence-based repairs.
- Never put architecture prose or code templates in `00`; use `01` and `02`.
- Never modify protected non-product sources during generation.
- Never trigger test mode from the slug itself.
- Never write abstract goal-only checklist items such as "实现 X" or "修复 Y".
- Never finish on file-existence checks alone; the separate Stage 5 quality gate
  must pass.
- Keep phase count at five or fewer by default; use sub-phases when necessary.
