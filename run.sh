#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

if ! command -v node >/dev/null 2>&1 || ! command -v npm >/dev/null 2>&1; then
    echo "Error: Node.js and npm are required."
    echo "Install Node.js 18 or newer, then run this script again."
    exit 1
fi

if [[ ! -d node_modules ]] || [[ package-lock.json -nt node_modules/.package-lock.json ]]; then
    echo "Installing dependencies..."
    npm ci
else
    echo "Dependencies are already installed; skipping."
fi

COMPANY_DATA_DIR="$ROOT_DIR/.cache/leetcode-companywise-interview-questions"
COMPANY_DATA_REVISION_FILE="$ROOT_DIR/.cache/company-data-revision"
GENERATED_DATA_FILE="$ROOT_DIR/.cache/companyProblems.json"

rm -f "$ROOT_DIR/.cache/localProblems.json"

if ! command -v git >/dev/null 2>&1; then
    echo "Error: Git is required to download company question data."
    exit 1
fi

mkdir -p "$ROOT_DIR/.cache"

if [[ ! -d "$COMPANY_DATA_DIR/.git" ]]; then
    echo "Downloading company question data..."
    git clone --depth 1 --branch master \
        https://github.com/snehasishroy/leetcode-companywise-interview-questions.git \
        "$COMPANY_DATA_DIR"
else
    echo "Checking for company question updates..."
    if ! git -C "$COMPANY_DATA_DIR" pull --ff-only --quiet; then
        echo "Warning: Could not reach GitHub; using the cached company data."
    fi
fi

COMPANY_DATA_REVISION="$(git -C "$COMPANY_DATA_DIR" rev-parse HEAD)"
GENERATED_DATA_REVISION=""
if [[ -f "$COMPANY_DATA_REVISION_FILE" ]]; then
    GENERATED_DATA_REVISION="$(cat "$COMPANY_DATA_REVISION_FILE")"
fi

if [[ ! -f "$GENERATED_DATA_FILE" ]] ||
   [[ scripts/sync_company_data.js -nt "$GENERATED_DATA_FILE" ]] ||
   [[ "$COMPANY_DATA_REVISION" != "$GENERATED_DATA_REVISION" ]]; then
    echo "Building the latest company question catalog..."
    node scripts/sync_company_data.js "$COMPANY_DATA_DIR" "$GENERATED_DATA_FILE"
    mkdir -p "$(dirname "$COMPANY_DATA_REVISION_FILE")"
    printf '%s\n' "$COMPANY_DATA_REVISION" > "$COMPANY_DATA_REVISION_FILE"
else
    echo "Company question catalog is already current; skipping."
fi

echo
if [[ "${SETUP_ONLY:-0}" == "1" ]]; then
    echo "Company question catalog is ready."
    exit 0
fi

echo "Starting Smart Interview Grind..."

if [[ "${NO_OPEN:-0}" == "1" ]]; then
    exec npm run dev
fi

exec npm run dev -- --open
