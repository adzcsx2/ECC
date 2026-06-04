# .ai — Project AI Configuration

Canonical source for project-level AI skills and tool mirrors.

## Canonical Skills

`.ai/skills/` is the sole canonical source for project-level skills. Tool-export layers (`.claude/skills/`, `.ai/exports/`) are derived views — never edit them directly.

When the user says "summarize into a skill", the workflow is:
1. Duplicate check — does a similar skill already exist?
2. Overlap check — does it overlap with an existing skill?
3. Proposal — present the proposed skill for confirmation
4. Write — create or update the skill in `.ai/skills/`

## Configured Tool Mirrors

- claude: .claude/skills

## Mirror Refresh

If `.claude/hooks/sync-project-skills.sh` exists, Claude Code automatically triggers mirror refresh after canonical edits to `.ai/skills/`, `.ai/skills/registry.yml`, or `.ai/README.md`. The hook reads this file's `Configured Tool Mirrors` section to determine sync targets.
