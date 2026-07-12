#!/usr/bin/env bash
set -euo pipefail

AUTH_URL="${AUTH_URL:-http://localhost:8080/api/v1}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin12345}"

RUN_ID="$(date +%s)"
APPROVE_EMAIL="approve.mailpit.${RUN_ID}@mail.com"
REJECT_EMAIL="reject.mailpit.${RUN_ID}@mail.com"

echo "== Admin review Mailpit manual test =="
echo "AUTH_URL=$AUTH_URL"
echo "Mailpit UI: http://localhost:8025"
echo

json_get() {
  python3 -c "import sys,json; data=json.load(sys.stdin); print($1)"
}

echo "== 1. Login admin =="
ADMIN_TOKEN="$(
  curl -s -X POST "$AUTH_URL/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\":\"$ADMIN_EMAIL\",
      \"password\":\"$ADMIN_PASSWORD\"
    }" \
  | json_get "data.get('access_token','')"
)"

if [ -z "$ADMIN_TOKEN" ]; then
  echo "Failed to login admin. Check ADMIN_EMAIL and ADMIN_PASSWORD."
  exit 1
fi

echo "Admin token received."
echo

echo "== 2. Register user for approval =="
APPROVE_RESPONSE="$(
  curl -s -X POST "$AUTH_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"full_name\":\"Approve Mailpit User\",
      \"email\":\"$APPROVE_EMAIL\",
      \"phone_number\":\"62819${RUN_ID: -9}\",
      \"password\":\"password123\",
      \"role\":\"UMKM\"
    }"
)"

APPROVE_USER_ID="$(printf '%s' "$APPROVE_RESPONSE" | json_get "data['user']['id']")"
echo "Approve user ID: $APPROVE_USER_ID"

curl -s -i -X PATCH "$AUTH_URL/admin/registrations/$APPROVE_USER_ID/approve" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"catatan_validasi":"Data valid untuk pengujian Mailpit."}'

echo
echo

echo "== 3. Register user for rejection =="
REJECT_RESPONSE="$(
  curl -s -X POST "$AUTH_URL/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"full_name\":\"Reject Mailpit User\",
      \"email\":\"$REJECT_EMAIL\",
      \"phone_number\":\"62820${RUN_ID: -9}\",
      \"password\":\"password123\",
      \"role\":\"MITRA\"
    }"
)"

REJECT_USER_ID="$(printf '%s' "$REJECT_RESPONSE" | json_get "data['user']['id']")"
echo "Reject user ID: $REJECT_USER_ID"

curl -s -i -X PATCH "$AUTH_URL/admin/registrations/$REJECT_USER_ID/reject" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rejection_reason":"Dokumen belum sesuai untuk pengujian Mailpit.",
    "catatan_validasi":"Mohon unggah ulang dokumen legalitas."
  }'

echo
echo
echo "Done. Open Mailpit and verify these subjects:"
echo "- Pendaftaran UMKM Tumbuh Disetujui"
echo "- Pendaftaran UMKM Tumbuh Belum Disetujui"
echo
echo "Mailpit UI: http://localhost:8025"
