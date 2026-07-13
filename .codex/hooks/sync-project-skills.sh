#!/usr/bin/env bash
# sync-project-skills.sh — mirror canonical .ai/skills/ to configured tool directories
# Triggered by PostToolUse hook on Edit|Write. Fail-open: never blocks the editor.
set -euo pipefail

# Read hook JSON from stdin
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // ""')

# Guard: only act on canonical source changes
if [[ ! "$FILE_PATH" =~ ^.*/\.ai/skills/ ]] && [[ "$FILE_PATH" != */.ai/README.md ]]; then
  exit 0
fi

# Guard: ignore mirror-layer edits to avoid loops
if [[ "$FILE_PATH" =~ ^.*/\.claude/skills/ ]] || [[ "$FILE_PATH" =~ ^.*/\.ai/exports/ ]]; then
  exit 0
fi

# Guard: ignore .updates/ proposals
if [[ "$FILE_PATH" =~ ^.*/\.ai/skills/\.updates/ ]]; then
  exit 0
fi

PROJECT_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "")
if [[ -z "$PROJECT_ROOT" ]]; then
  exit 0
fi

AI_README="$PROJECT_ROOT/.ai/README.md"
if [[ ! -f "$AI_README" ]]; then
  exit 0
fi

# Check if claude mirror is configured
if ! grep -q '^- claude:' "$AI_README" 2>/dev/null; then
  exit 0
fi

# Sync each skill from canonical source to claude mirror
CANONICAL_DIR="$PROJECT_ROOT/.ai/skills"
MIRROR_DIR="$PROJECT_ROOT/.claude/skills"

for SKILL_DIR in "$CANONICAL_DIR"/*/; do
  SKILL_NAME=$(basename "$SKILL_DIR")
  # Skip .updates/ and other non-skill directories
  if [[ "$SKILL_NAME" == ".updates" ]]; then
    continue
  fi
  SKILL_FILE="$SKILL_DIR/SKILL.md"
  if [[ -f "$SKILL_FILE" ]]; then
    mkdir -p "$MIRROR_DIR/$SKILL_NAME"
    cp "$SKILL_FILE" "$MIRROR_DIR/$SKILL_NAME/SKILL.md"
  fi
done

exit 0
