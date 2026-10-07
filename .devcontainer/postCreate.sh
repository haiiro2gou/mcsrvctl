#!/usr/bin/env bash
set -euo pipefail

# Named volumes come up root-owned on first use. Only chown the volume roots:
# -R would hit any bind mounts layered inside ~/.claude and ~/.codex.
sudo chown "$(id -u):$(id -g)" "$HOME/.claude" "$HOME/.codex" node_modules

# Personal setup runs before the shared one, so it can lay out ~/.claude first
# (e.g. a symlinked settings.json the plugin install below would otherwise create).
if [ -f .devcontainer/postCreate.local.sh ]; then
    bash .devcontainer/postCreate.local.sh
fi

# Claude Code (official native installer) and Codex CLI, plus the plugin that lets
# Claude Code delegate to Codex. Logging in is a one-time step per container volume.
curl -fsSL https://claude.ai/install.sh | bash
npm install -g @openai/codex@0.155.1
# Skipped when the plugin already sits in the claude-config volume: the install writes
# settings.json, which a postCreate.local.sh may have linked to a read-only file.
if ! "$HOME/.local/bin/claude" plugin list | grep -q 'codex@openai-codex'; then
    "$HOME/.local/bin/claude" plugin marketplace add openai/codex-plugin-cc
    "$HOME/.local/bin/claude" plugin install codex@openai-codex
fi

npm ci
