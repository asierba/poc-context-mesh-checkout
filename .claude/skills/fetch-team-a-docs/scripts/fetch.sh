#!/usr/bin/env bash
set -euo pipefail

REPO_URL="file:///Users/asier/dev/ai/context-mesh-prototype/producer-team-a-docs"
CACHE_DIR="$HOME/.cache/context-mesh/team-a-docs"

if [ -d "$CACHE_DIR/.git" ]; then
  git -C "$CACHE_DIR" pull --ff-only --quiet
else
  mkdir -p "$(dirname "$CACHE_DIR")"
  git clone --quiet "$REPO_URL" "$CACHE_DIR"
fi

echo "$CACHE_DIR"
