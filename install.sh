#!/usr/bin/env bash
# install.sh — Legacy shell entrypoint for the ECC installer.
#
# This wrapper resolves the real repo/package root when invoked through a
# symlinked npm bin, then delegates to the Node-based installer runtime.
# Codex command syncing installs skill wrappers by default. Prompt aliases stay
# disabled unless the caller explicitly sets ECC_SYNC_CODEX_PROMPTS=1.

set -euo pipefail

SCRIPT_PATH="$0"
while [ -L "$SCRIPT_PATH" ]; do
    link_dir="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"
    SCRIPT_PATH="$(readlink "$SCRIPT_PATH")"
    [[ "$SCRIPT_PATH" != /* ]] && SCRIPT_PATH="$link_dir/$SCRIPT_PATH"
done
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"

# Auto-install Node dependencies when running from a git clone
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
    echo "[ECC] Installing dependencies..."
    (cd "$SCRIPT_DIR" && npm install --no-audit --no-fund --loglevel=error)
fi

# On MSYS2/Git Bash, convert the POSIX path to a Windows path so Node.js
# (a native Windows binary) receives a valid path instead of a doubled one
# like G:\g\projects\... that results from Git Bash's auto path conversion.
if command -v cygpath &>/dev/null; then
    NODE_SCRIPT="$(cygpath -w "$SCRIPT_DIR/scripts/install-apply.js")"
else
    NODE_SCRIPT="$SCRIPT_DIR/scripts/install-apply.js"
fi

export ECC_SYNC_CODEX_PROMPTS="${ECC_SYNC_CODEX_PROMPTS:-0}"

exec node "$NODE_SCRIPT" "$@"
