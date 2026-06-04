---
agent: agent
description: Create a phased implementation plan before writing any code. WAIT for explicit confirmation before touching any code.
argument-hint: "[feature description | path/to/*.prd.md]"
---

# Implementation Planner

Before writing any code for this feature/task, produce a structured plan.
Accepts either a free-form requirement or a PRD markdown file path.

> **CRITICAL — WAIT for confirmation.** After presenting the plan, STOP. Do NOT
> write, edit, or scaffold any code until the user explicitly approves (e.g.
> "yes" / "proceed"). If the user replies with changes, revise the plan and wait again.

## Steps

1. **Clarify the goal** — restate the requirement in one sentence; flag any ambiguities.
2. **Research first** — identify existing utilities, libraries, or patterns in the codebase that can be reused. Do not reinvent what already exists.
3. **Identify dependencies** — list external packages, APIs, environment variables, or database changes needed.
4. **Break into phases** — structure work as ordered phases, each independently shippable:
   - Phase 1: Core data model / schema changes
   - Phase 2: Business logic + unit tests
   - Phase 3: API / integration layer + integration tests
   - Phase 4: UI / consumer layer + E2E tests
5. **Identify risks** — note anything that could block progress or cause regressions.
6. **Define done** — list the exact acceptance criteria (tests passing, coverage ≥ 80%, no lint errors, docs updated).
7. **Wait for confirmation** — present the plan and STOP. Get explicit user approval before writing any code.

## Output Format

```
## Goal
[One-sentence summary]

## Reuse Opportunities
- [Existing utility/pattern]

## Dependencies
- [Package / API / env var]

## Phases
### Phase 1 — [Name]
- [ ] Task A
- [ ] Task B

### Phase 2 — [Name]
...

## Risks
- [Risk and mitigation]

## Definition of Done
- [ ] All tests pass (≥80% coverage)
- [ ] No new lint errors
- [ ] Docs updated if public API changed
```

Apply ECC coding standards throughout: immutable patterns, small focused files, explicit error handling.
