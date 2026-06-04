---
name: project-skills
description: Canonical project-local skill governance.
---

# project-skills

- Canonical source: `.ai/skills/`
- Do not hand-edit `.claude/skills/` or other exports
- If `.claude/hooks/sync-project-skills.sh` exists, Claude triggers mirror refresh after canonical edits
- Configured tool mirrors are recorded in `.ai/README.md`
- When the user says "summarize into a skill": duplicate-check -> overlap-check -> proposal -> confirm -> write
