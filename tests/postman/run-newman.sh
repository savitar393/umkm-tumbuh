#!/usr/bin/env bash
set -euo pipefail

COLLECTION="tests/postman/umkm-tumbuh-current-progress.postman_collection.json"
ENVIRONMENT="tests/postman/local.postman_environment.json"
REPORT_DIR="tests/postman/reports"
REPORT_HTML="$REPORT_DIR/backend-current-progress-report.html"

mkdir -p "$REPORT_DIR"

newman run "$COLLECTION"   -e "$ENVIRONMENT"   -r cli,htmlextra   --reporter-htmlextra-export "$REPORT_HTML"   --timeout-request 15000   --delay-request 100
