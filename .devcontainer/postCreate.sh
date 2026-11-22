#!/usr/bin/env bash
set -euo pipefail

# Named volumes come up root-owned on first use. Only chown the volume roots:
# -R would hit any bind mounts layered inside ~/.claude.
sudo chown "$(id -u):$(id -g)" "$HOME/.claude" node_modules

# Personal setup (e.g. Codex and Claude Code plugins) lives in the untracked postCreate.local.sh.
# It runs before the shared one, so it can lay out ~/.claude first.
if [ -f .devcontainer/postCreate.local.sh ]; then
    bash .devcontainer/postCreate.local.sh
fi

# Claude Code (official native installer). Logging in is a one-time step per container volume.
curl -fsSL https://claude.ai/install.sh | bash

npm ci
