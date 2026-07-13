# plan-doc Post-Generation Quality Gate

Read this file completely during initial workflow preparation, then read it
again immediately before Stage 5. Run it only after every expected execution
document has been written or checkpoint-resolved. This gate is mandatory and
cannot be replaced by a file-existence check or the Generation Handoff.

## 1. Read-Back Verification

List the target directory and confirm every expected file (5 standard or 7 in
test mode) is present and non-empty. Regenerate any missing or empty file before
auditing. Print `✓ <file> (<lines> lines)` or `✗ <file> 缺失，已补写`.

## 2. Fresh Product / Execution Audit

- Re-read every product source from disk only after all execution documents
  have been written. Do NOT rely only on the Generation Handoff; it is a
  generation aid, not final-audit evidence.
- Re-read every generated document from disk, including files skipped during
  checkpoint resume.
- Build or refresh the requirement traceability table in `00-执行文档.md`. Use
  product IDs or stable derived IDs (`REQ-001`, `REQ-002`, ...). Record source
  path + stable section, summary, implementing `P<N>.<M>` items, acceptance
  evidence, test-case IDs when present, and status.
- Audit both directions:
  - **Product → execution**: every in-scope requirement, constraint, exclusion,
    and acceptance criterion maps to executable items and binary evidence.
  - **Execution → product**: every code-changing item maps to an in-scope
    product requirement or an explicitly approved engineering enabler. Flag
    invented scope and gold-plating.
- Check cross-document integrity: phase/item IDs, progress pointer, parallel
  dependencies, paths, symbol anchors, commands, architecture decisions,
  development templates, milestones, tests, rollback, and README status agree.

## 3. Robustness Audit

Evaluate every category below. Mark an irrelevant category `N/A` with a reason:

- happy paths and failure paths
- boundary/input validation
- permissions and security
- timeouts and cancellation
- retry and idempotency
- concurrency and state consistency
- partial failure and recovery
- migration and backward compatibility
- resource cleanup
- observability and rollback

For each applicable risk require an owner checklist item, exact verification
command or manual evidence procedure, binary done criterion, and rollback or
recovery action.

When the repository is available, verify referenced files and stable symbols
exist. Verify commands against actual scripts/configuration; never invent a
green command. If the environment cannot run a command, record why and the
objective evidence the executor must collect.

## 4. Repair loop (mandatory)

1. Classify findings as `CRITICAL`, `HIGH`, `MEDIUM`, or `LOW`; cite conflicting
   product-source sections and generated-document locations.
2. Repair every confirmed defect with the smallest coherent edit. Normally
   revise generated execution documents.
3. Revise a product document only when the correction is non-semantic and
   unambiguous, such as a broken link or terminology drift with one clear source
   of truth.
4. If sources conflict or a fix would choose/change product intent, do not
   guess. Add the conflict to `blockers`, set pointer status to `blocked`, and
   ask the user for a product decision.
5. After each repair pass, Re-run the complete alignment and robustness audit
   against fresh disk reads. Continue until no confirmed defect remains or a
   genuine product-decision blocker is recorded. Do not report success while any confirmed defect remains.

## 5. Persist Evidence and Handoff

Update `生成后对齐与鲁棒性审计` in `00-执行文档.md` with:

- audit time and exact product-source list
- requirement totals, covered count, uncovered count, and justified exclusions
- applicable robustness categories and `N/A` reasons
- repairs made with affected document sections
- unresolved blockers
- final result: `PASS` or `BLOCKED`

Repeat read-back verification after repairs. Report line counts and final audit
result. Update `docs/README.md` under `计划文档 / Plan docs` when that section
exists; otherwise suggest the addition. State which protected upstream sources
were intentionally not modified.

Print the resolved execution prompt only on `PASS`. Never print it on `BLOCKED`.
