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
SOLUTION_SOURCE_DIR="$ROOT_DIR/.cache/walkccc-leetcode"
SOLUTION_DATA_REVISION_FILE="$ROOT_DIR/.cache/solution-data-revision"
GENERATED_SOLUTION_FILE="$ROOT_DIR/.cache/solutions.json"
GENERATED_VIDEO_FILE="$ROOT_DIR/.cache/videos.json"

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

if [[ ! -d "$SOLUTION_SOURCE_DIR/.git" ]]; then
    echo "Downloading walkccc solution data..."
    if ! git clone --depth 1 \
        https://github.com/walkccc/LeetCode.git \
        "$SOLUTION_SOURCE_DIR"; then
        echo "Warning: Could not reach GitHub and no source checkout is cached."
        if [[ -f "$GENERATED_SOLUTION_FILE" ]]; then
            echo "Using the previously generated solution catalog."
        else
            echo "Solutions will be unavailable for this run."
        fi
    fi
else
    echo "Checking for walkccc solution updates..."
    if ! git -C "$SOLUTION_SOURCE_DIR" pull --ff-only --quiet; then
        echo "Warning: Could not reach GitHub; using the cached walkccc solutions."
    fi
fi

if [[ -d "$SOLUTION_SOURCE_DIR/.git" ]]; then
    SOLUTION_SOURCE_REVISION="$(git -C "$SOLUTION_SOURCE_DIR" rev-parse HEAD)"
    SOLUTION_IMPORTER_REVISION="$(node -p \
        "require('crypto').createHash('sha256').update(require('fs').readFileSync('scripts/sync_solution_data.js')).digest('hex')")"
    SOLUTION_CATALOG_REVISION="$SOLUTION_SOURCE_REVISION:$SOLUTION_IMPORTER_REVISION"
    GENERATED_SOLUTION_CATALOG_REVISION=""
    if [[ -f "$SOLUTION_DATA_REVISION_FILE" ]]; then
        GENERATED_SOLUTION_CATALOG_REVISION="$(cat "$SOLUTION_DATA_REVISION_FILE")"
    fi

    if [[ ! -f "$GENERATED_SOLUTION_FILE" ]] ||
       [[ "$SOLUTION_CATALOG_REVISION" != "$GENERATED_SOLUTION_CATALOG_REVISION" ]]; then
        echo "Building the local solution catalog..."
        node scripts/sync_solution_data.js \
            "$SOLUTION_SOURCE_DIR" \
            "$GENERATED_SOLUTION_FILE" \
            "$SOLUTION_SOURCE_REVISION"
        printf '%s\n' "$SOLUTION_CATALOG_REVISION" > "$SOLUTION_DATA_REVISION_FILE"
    else
        echo "Solution catalog is already current; skipping."
    fi
fi

echo "Refreshing YouTube explanation links..."
if ! node scripts/fetch_youtube_videos.js "$GENERATED_VIDEO_FILE"; then
    if [[ -f "$GENERATED_VIDEO_FILE" ]]; then
        echo "Warning: Could not refresh YouTube playlists; using the cached video catalog."
    else
        echo "Warning: Could not refresh YouTube playlists; video explanations will be unavailable."
    fi
fi

echo
if [[ "${SETUP_ONLY:-0}" == "1" ]]; then
    echo "Local question, solution, and video catalogs are ready."
    exit 0
fi

echo "Starting Smart Interview Grind..."

if [[ "${NO_OPEN:-0}" == "1" ]]; then
    exec npm run dev
fi

exec npm run dev -- --open
