# plan-doc Post-Generation Quality Gate

Read this file completely during initial workflow preparation. After every
expected execution document has been written or checkpoint-resolved, reread
both this file and `plan-doc/references/document-contract.md` immediately before
Stage 5. This gate is mandatory and cannot be replaced by a file-existence
check or the Generation Handoff. Execute the complete audit exactly once per
command invocation. Repairs must not trigger another audit pass.

## 1. Read-Back Verification

List the target directory and confirm every expected file (5 standard or 7 in
test mode) is present and non-empty. Regenerate any missing or empty file before
auditing. Print `✓ <file> (<lines> lines)` or `✗ <file> 缺失，已补写`.

## 2. Document-contract conformance audit

- Re-read `plan-doc/references/document-contract.md` from disk only after every
  expected document has been written or checkpoint-resolved.
- Audit the completed set against the fresh contract: exact file count and
  names, write-order outcomes, navigation links, document responsibilities,
  progress-pointer schema, resume protocol, subagent routing, atomic checklist
  requirements, traceability/audit sections, and fresh-session prompt rules.
- Record every mismatch as an audit finding. File existence alone is not
  contract conformance.

## 3. Fresh Product / Execution Audit

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

## 4. Robustness Audit

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

## 5. Single repair pass (mandatory; no re-audit)

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
5. Apply at most one consolidated repair pass for all findings from the single
   audit. Do not rerun, restart, or recursively invoke the document-contract,
   alignment, or robustness audit after repairs. If every confirmed finding
   from the audit was repaired, the result may be `PASS`; if any finding cannot
   be repaired confidently in that pass, record it as a blocker and return
   `BLOCKED`. State in the evidence that repairs were not re-audited because the
   workflow is intentionally single-pass.

## 6. Persist Evidence and Handoff

Update `生成后对齐与鲁棒性审计` in `00-执行文档.md` with:

- audit time and exact product-source list
- document-contract conformance result and repaired contract defects
- requirement totals, covered count, uncovered count, and justified exclusions
- applicable robustness categories and `N/A` reasons
- repairs made with affected document sections
- unresolved blockers
- final result: `PASS` or `BLOCKED`

After repairs, repeat only the structural read-back verification from section 1
(file presence, non-empty status, and line counts). This is not a second audit
and must not reopen the audit/repair cycle. Report line counts and final audit
result. Update `docs/README.md` under `计划文档 / Plan docs` when that section
exists; otherwise suggest the addition. State which protected upstream sources
were intentionally not modified.

Print the resolved execution prompt only on `PASS`. Never print it on `BLOCKED`.
