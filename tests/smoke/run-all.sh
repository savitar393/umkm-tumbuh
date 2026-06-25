#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

AUTH_URL="${AUTH_URL:-http://localhost:8080/api/v1}"
USER_URL="${USER_URL:-http://localhost:8081/api/v1}"
DOCUMENT_URL="${DOCUMENT_URL:-http://localhost:8083/api/v1}"

echo "== UMKM Tumbuh smoke suite =="
echo "AUTH_URL=$AUTH_URL"
echo "USER_URL=$USER_URL"
echo "DOCUMENT_URL=$DOCUMENT_URL"
echo

run_test() {
  local label="$1"
  local script="$2"

  echo "------------------------------------------------------------"
  echo "▶ $label"
  echo "------------------------------------------------------------"

  AUTH_URL="$AUTH_URL" \
  USER_URL="$USER_URL" \
  DOCUMENT_URL="$DOCUMENT_URL" \
  "$script"

  echo
  echo "✅ $label passed"
  echo
}

run_test "Auth + profile smoke test" "$ROOT_DIR/tests/smoke/auth-profile-smoke.sh"
run_test "Document registration smoke test" "$ROOT_DIR/tests/smoke/document-registration-smoke.sh"

echo "🎉 All smoke tests passed."
