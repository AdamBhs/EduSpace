#!/bin/bash

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "Starting Docker infrastructure..."
cd "$PROJECT_ROOT/docker" && docker compose up -d
cd "$PROJECT_ROOT"

echo "Installing dependencies..."
pnpm install

echo "Starting all services..."
pnpm dev
