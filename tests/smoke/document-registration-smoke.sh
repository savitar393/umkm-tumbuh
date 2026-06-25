#!/usr/bin/env bash
set -euo pipefail

AUTH_URL="${AUTH_URL:-http://localhost:8080/api/v1}"
USER_URL="${USER_URL:-http://localhost:8081/api/v1}"
DOCUMENT_URL="${DOCUMENT_URL:-http://localhost:8083/api/v1}"

RUN_ID="$(date +%s%N)"
PASSWORD="password123"

read -r RUN_LAST_8 RUN_LAST_13 RUN_LAST_16 <<EOF_IDS
$(python3 - <<'PY'
import random
print(
    random.randint(10_000_000, 99_999_999),
    random.randint(1_000_000_000_000, 9_999_999_999_999),
    random.randint(1_000_000_000_000_000, 9_999_999_999_999_999),
)
PY
)
EOF_IDS

read -r UMKM_PHONE_SUFFIX MITRA_PHONE_SUFFIX <<EOF_PHONES
$(python3 - <<'PY'
import random
print(
    random.randint(10_000_000, 99_999_999),
    random.randint(10_000_000, 99_999_999),
)
PY
)
EOF_PHONES

RUN_NPWP="$(python3 - <<'PY'
import random
digits = f"{random.randint(0, 10**15 - 1):015d}"
print(f"{digits[0:2]}.{digits[2:5]}.{digits[5:8]}.{digits[8]}-{digits[9:12]}.{digits[12:15]}")
PY
)"

UMKM_EMAIL="smoke.doc.umkm.${RUN_ID}@mail.com"
MITRA_EMAIL="smoke.doc.mitra.${RUN_ID}@mail.com"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

PDF_FILE="$TMP_DIR/smoke-document.pdf"
PNG_FILE="$TMP_DIR/smoke-photo.png"

printf '%s\n' '%PDF-1.4' '1 0 obj <<>> endobj' 'trailer <<>>' '%%EOF' > "$PDF_FILE"

python3 - <<PY
import base64
png = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgwJ/lUZ3WQAAAABJRU5ErkJggg=="
open("$PNG_FILE", "wb").write(base64.b64decode(png))
PY

json_get() {
  python3 -c "import sys,json; data=json.load(sys.stdin); print($1)"
}

expect_status() {
  local actual="$1"
  local expected="$2"
  local label="$3"

  if [ "$actual" != "$expected" ]; then
    echo "❌ $label expected HTTP $expected, got $actual" >&2
    echo "$RESPONSE_BODY" >&2
    exit 1
  fi

  echo "✅ $label HTTP $actual" >&2
}

split_response() {
  local raw="$1"
  RESPONSE_BODY="$(printf "%s" "$raw" | sed '$d')"
  RESPONSE_STATUS="$(printf "%s" "$raw" | tail -n1)"
}

request_json() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local token="${4:-}"

  local headers=(-H "Content-Type: application/json")

  if [ -n "$token" ]; then
    headers+=(-H "Authorization: Bearer $token")
  fi

  if [ -n "$body" ]; then
    curl -sS -w "\n%{http_code}" -X "$method" "$url" "${headers[@]}" -d "$body"
  else
    curl -sS -w "\n%{http_code}" -X "$method" "$url" "${headers[@]}"
  fi
}

upload_document() {
  local token="$1"
  local category="$2"
  local file_path="$3"
  local mime_type="$4"
  local label="$5"

  local raw
  raw="$(curl -sS -w "\n%{http_code}" -X POST "$DOCUMENT_URL/documents/upload" \
    -H "Authorization: Bearer $token" \
    -F "category=$category" \
    -F "file=@$file_path;type=$mime_type")"

  split_response "$raw"
  expect_status "$RESPONSE_STATUS" "201" "$label"

  local document_id
  document_id="$(printf "%s" "$RESPONSE_BODY" | python3 -c '
import sys,json
data=json.load(sys.stdin)
candidates = [
    data.get("id"),
    data.get("document_id"),
    data.get("document", {}).get("id") if isinstance(data.get("document"), dict) else None,
    data.get("document", {}).get("document_id") if isinstance(data.get("document"), dict) else None,
    data.get("data", {}).get("id") if isinstance(data.get("data"), dict) else None,
    data.get("data", {}).get("document_id") if isinstance(data.get("data"), dict) else None,
]
print(next((str(x) for x in candidates if x), ""))
')"

  if [ -z "$document_id" ]; then
    echo "❌ $label did not return document id" >&2
    echo "$RESPONSE_BODY" >&2
    exit 1
  fi

  echo "✅ $label document_id=$document_id" >&2
  printf "%s" "$document_id"
}

echo "== Document registration smoke test =="
echo "AUTH_URL=$AUTH_URL"
echo "USER_URL=$USER_URL"
echo "DOCUMENT_URL=$DOCUMENT_URL"
echo

echo "== 1. Register UMKM =="
RAW="$(request_json POST "$AUTH_URL/auth/register" "{
  \"full_name\": \"Smoke Document UMKM\",
  \"email\": \"$UMKM_EMAIL\",
  \"phone_number\": \"62812$UMKM_PHONE_SUFFIX\",
  \"nik\": \"$RUN_LAST_16\",
  \"password\": \"$PASSWORD\",
  \"role\": \"UMKM\"
}")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "201" "register UMKM"

UMKM_TOKEN="$(printf "%s" "$RESPONSE_BODY" | json_get "data.get('access_token','')")"

echo
echo "== 2. Upload UMKM documents =="
UMKM_PHOTO_ID="$(upload_document "$UMKM_TOKEN" "PRODUCT_IMAGE" "$PNG_FILE" "image/png" "upload UMKM photo")"
echo
UMKM_LEGAL_ID="$(upload_document "$UMKM_TOKEN" "GENERAL_DOCUMENT" "$PDF_FILE" "application/pdf" "upload UMKM legal document")"
echo

echo "== 3. Save UMKM profile with document IDs =="
RAW="$(request_json PUT "$USER_URL/profiles/me" "{
  \"business_name\": \"Smoke Document UMKM Store\",
  \"business_category\": \"FASHION\",
  \"jenis_umkm_id\": \"FASHION\",
  \"business_description\": \"Smoke test UMKM profile with documents\",
  \"owner_name\": \"Smoke UMKM Owner\",
  \"phone_number\": \"62812$UMKM_PHONE_SUFFIX\",
  \"nik\": \"$RUN_LAST_16\",
  \"address\": \"Jl Smoke Document UMKM\",
  \"city\": \"Sleman\",
  \"province\": \"DI Yogyakarta\",
  \"products\": \"Produk Smoke\",
  \"photo_document_id\": \"$UMKM_PHOTO_ID\",
  \"legal_document_id\": \"$UMKM_LEGAL_ID\"
}" "$UMKM_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "save UMKM profile with docs"
echo

echo "== 4. Register Mitra =="
RAW="$(request_json POST "$AUTH_URL/auth/register" "{
  \"full_name\": \"Smoke Document Mitra\",
  \"email\": \"$MITRA_EMAIL\",
  \"phone_number\": \"62813$RUN_LAST_8\",
  \"password\": \"$PASSWORD\",
  \"role\": \"MITRA\"
}")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "201" "register Mitra"

MITRA_TOKEN="$(printf "%s" "$RESPONSE_BODY" | json_get "data.get('access_token','')")"

echo
echo "== 5. Upload Mitra documents =="
MITRA_LEGAL_ID="$(upload_document "$MITRA_TOKEN" "GENERAL_DOCUMENT" "$PDF_FILE" "application/pdf" "upload Mitra legal document")"
echo
MITRA_COMMITMENT_ID="$(upload_document "$MITRA_TOKEN" "GENERAL_DOCUMENT" "$PDF_FILE" "application/pdf" "upload Mitra commitment document")"
echo
MITRA_PROFILE_ID="$(upload_document "$MITRA_TOKEN" "GENERAL_DOCUMENT" "$PDF_FILE" "application/pdf" "upload Mitra company profile document")"
echo

echo "== 6. Save Mitra profile with document IDs =="
RAW="$(request_json PUT "$USER_URL/profiles/me" "{
  \"organization_name\": \"Smoke Document Mitra Organization\",
  \"organization_type\": \"Inkubator Bisnis\",
  \"legal_name\": \"Smoke Document Mitra Organization\",
  \"nib\": \"$RUN_LAST_13\",
  \"npwp\": \"$RUN_NPWP\",
  \"description\": \"Smoke test Mitra profile with documents\",
  \"support_description\": \"Smoke test deskripsi tujuan kemitraan with documents\",
  \"address\": \"Jl Smoke Document Mitra\",
  \"city\": \"Surakarta\",
  \"province\": \"Jawa Tengah\",
  \"contact_person\": \"Smoke PIC\",
  \"contact_person_title\": \"Manager\",
  \"phone_number\": \"62813$RUN_LAST_8\",
  \"operational_area\": \"Jawa Tengah\",
  \"cooperation_scale\": \"Provinsi\",
  \"partnership_field\": \"Pelatihan\",
  \"support_type\": \"Pendampingan\",
  \"legal_document_id\": \"$MITRA_LEGAL_ID\",
  \"commitment_document_id\": \"$MITRA_COMMITMENT_ID\",
  \"company_profile_document_id\": \"$MITRA_PROFILE_ID\"
}" "$MITRA_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "save Mitra profile with docs"
echo

echo "🎉 Document registration smoke test passed."
