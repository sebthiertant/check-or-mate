#!/usr/bin/env bash
# Runs once when the devcontainer is first created.
set -euo pipefail

echo "→ Installing uv..."
curl -LsSf https://astral.sh/uv/install.sh | sh
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
export PATH="$HOME/.local/bin:$PATH"

echo "→ Installing pnpm..."
npm install -g pnpm

echo "→ Installing Stockfish 16..."
apt-get update -qq
apt-get install -y -qq stockfish

echo "✓ Devcontainer setup complete."
