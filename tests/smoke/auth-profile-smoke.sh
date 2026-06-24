#!/usr/bin/env bash
set -euo pipefail

AUTH_URL="${AUTH_URL:-http://localhost:8080/api/v1}"
USER_URL="${USER_URL:-http://localhost:8081/api/v1}"

RUN_ID="$(date +%s%N)"
PASSWORD="password123"

read -r UMKM_PHONE_SUFFIX MITRA_PHONE_SUFFIX RUN_NIK RUN_NIB <<EOF_IDS
$(python3 - <<'PY'
import random
print(
    random.randint(10_000_000, 99_999_999),
    random.randint(10_000_000, 99_999_999),
    random.randint(1_000_000_000_000_000, 9_999_999_999_999_999),
    random.randint(1_000_000_000_000, 9_999_999_999_999),
)
PY
)
EOF_IDS

RUN_NPWP="$(python3 - <<'PY'
import random
digits = f"{random.randint(0, 10**15 - 1):015d}"
print(f"{digits[0:2]}.{digits[2:5]}.{digits[5:8]}.{digits[8]}-{digits[9:12]}.{digits[12:15]}")
PY
)"

UMKM_EMAIL="smoke.umkm.${RUN_ID}@mail.com"
MITRA_EMAIL="smoke.mitra.${RUN_ID}@mail.com"

echo "== UMKM Tumbuh smoke test =="
echo "AUTH_URL=$AUTH_URL"
echo "USER_URL=$USER_URL"
echo

json_get() {
  python3 -c "import sys,json; data=json.load(sys.stdin); print($1)"
}

expect_status() {
  local actual="$1"
  local expected="$2"
  local label="$3"

  if [ "$actual" != "$expected" ]; then
    echo "❌ $label expected HTTP $expected, got $actual"
    exit 1
  fi

  echo "✅ $label HTTP $actual"
}

request_with_status() {
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

split_response() {
  local raw="$1"
  RESPONSE_BODY="$(printf "%s" "$raw" | sed '$d')"
  RESPONSE_STATUS="$(printf "%s" "$raw" | tail -n1)"
}

echo "== 1. Invalid login should return 401 =="
RAW="$(request_with_status POST "$AUTH_URL/auth/login" \
  '{"email":"notfound@example.com","password":"wrongpass"}')"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "401" "invalid login"
echo

echo "== 2. Password reset flow =="
RESET_EMAIL="reset.smoke.$RUN_ID@mail.com"
RESET_OLD_PASSWORD="password123"
RESET_NEW_PASSWORD="newpassword123"

RAW="$(request_with_status POST "$AUTH_URL/auth/register" "{
  \"full_name\":\"Reset Smoke User\",
  \"email\":\"$RESET_EMAIL\",
  \"phone_number\":\"62814$UMKM_PHONE_SUFFIX\",
  \"password\":\"$RESET_OLD_PASSWORD\",
  \"role\":\"UMKM\"
}")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "201" "register reset smoke user"

RAW="$(request_with_status POST "$AUTH_URL/auth/password/request-reset" "{
  \"email\":\"$RESET_EMAIL\"
}")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "request password reset"

RESET_CODE="$(printf '%s' "$RESPONSE_BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("dev_code",""))')"

if [ -z "$RESET_CODE" ]; then
  echo "❌ password reset dev_code missing"
  echo "$RESPONSE_BODY"
  exit 1
fi

RAW="$(request_with_status POST "$AUTH_URL/auth/password/reset" "{
  \"email\":\"$RESET_EMAIL\",
  \"code\":\"$RESET_CODE\",
  \"new_password\":\"$RESET_NEW_PASSWORD\"
}")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "reset password"

RAW="$(request_with_status POST "$AUTH_URL/auth/login" "{
  \"email\":\"$RESET_EMAIL\",
  \"password\":\"$RESET_OLD_PASSWORD\"
}")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "401" "old password should fail"

RAW="$(request_with_status POST "$AUTH_URL/auth/login" "{
  \"email\":\"$RESET_EMAIL\",
  \"password\":\"$RESET_NEW_PASSWORD\"
}")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "403" "new password should pass password check but fail email verification"
echo

echo "== 2. Register UMKM =="
RAW="$(request_with_status POST "$AUTH_URL/auth/register" "{
  \"full_name\": \"Smoke UMKM\",
  \"email\": \"$UMKM_EMAIL\",
  \"phone_number\": \"62812$UMKM_PHONE_SUFFIX\",
  \"password\": \"$PASSWORD\",
  \"role\": \"UMKM\"
}")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "201" "register UMKM"

UMKM_TOKEN="$(printf "%s" "$RESPONSE_BODY" | json_get "data.get('access_token','')")"

if [ -z "$UMKM_TOKEN" ]; then
  echo "❌ register UMKM did not return access_token"
  echo "$RESPONSE_BODY"
  exit 1
fi

echo "✅ UMKM token received"
echo

echo "== 3. Save UMKM profile =="
RAW="$(request_with_status PUT "$USER_URL/profiles/me" "{
  \"business_name\": \"Smoke UMKM Store\",
  \"business_category\": \"FASHION\",
  \"jenis_umkm_id\": \"FASHION\",
  \"business_description\": \"Smoke test UMKM profile\",
  \"owner_name\": \"Smoke UMKM Owner\",
  \"phone_number\": \"62812$UMKM_PHONE_SUFFIX\",
  \"nik\": \"$RUN_NIK\",
  \"address\": \"Jl Smoke Test UMKM\",
  \"city\": \"Sleman\",
  \"province\": \"DI Yogyakarta\",
  \"products\": \"Produk Smoke\"
}" "$UMKM_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "save UMKM profile"
echo

echo "== 4. Get UMKM profile =="
RAW="$(request_with_status GET "$USER_URL/profiles/me" "" "$UMKM_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "get UMKM profile"

UMKM_NAME="$(printf "%s" "$RESPONSE_BODY" | json_get "data.get('profile',{}).get('business_name','')")"
if [ "$UMKM_NAME" != "Smoke UMKM Store" ]; then
  echo "❌ UMKM profile name mismatch: $UMKM_NAME"
  exit 1
fi

echo "✅ UMKM profile verified"
echo

echo "== 5. Submit UMKM registration =="
RAW="$(request_with_status POST "$USER_URL/register/submit" \
  '{"action":"submit"}' \
  "$UMKM_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "submit UMKM registration"
echo

echo "== 6. Register Mitra =="
RAW="$(request_with_status POST "$AUTH_URL/auth/register" "{
  \"full_name\": \"Smoke Mitra\",
  \"email\": \"$MITRA_EMAIL\",
  \"phone_number\": \"62813$MITRA_PHONE_SUFFIX\",
  \"password\": \"$PASSWORD\",
  \"role\": \"MITRA\"
}")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "201" "register Mitra"

MITRA_TOKEN="$(printf "%s" "$RESPONSE_BODY" | json_get "data.get('access_token','')")"

if [ -z "$MITRA_TOKEN" ]; then
  echo "❌ register Mitra did not return access_token"
  echo "$RESPONSE_BODY"
  exit 1
fi

echo "✅ Mitra token received"
echo

echo "== 7. Save Mitra profile =="
RAW="$(request_with_status PUT "$USER_URL/profiles/me" "{
  \"organization_name\": \"Smoke Mitra Organization\",
  \"organization_type\": \"Inkubator Bisnis\",
  \"legal_name\": \"Smoke Mitra Organization\",
  \"nib\": \"$RUN_NIB\",
  \"npwp\": \"$RUN_NPWP\",
  \"description\": \"Smoke test Mitra profile\",
  \"support_description\": \"Smoke test deskripsi tujuan kemitraan\",
  \"address\": \"Jl Smoke Test Mitra\",
  \"city\": \"Surakarta\",
  \"province\": \"Jawa Tengah\",
  \"contact_person\": \"Smoke PIC\",
  \"contact_person_title\": \"Manager\",
  \"phone_number\": \"62813$MITRA_PHONE_SUFFIX\",
  \"operational_area\": \"Jawa Tengah\",
  \"cooperation_scale\": \"Provinsi\",
  \"partnership_field\": \"Pelatihan\",
  \"support_type\": \"Pendampingan\"
}" "$MITRA_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "save Mitra profile"
echo

echo "== 8. Get Mitra profile =="
RAW="$(request_with_status GET "$USER_URL/profiles/me" "" "$MITRA_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "get Mitra profile"

MITRA_NAME="$(printf "%s" "$RESPONSE_BODY" | json_get "data.get('profile',{}).get('organization_name','')")"
if [ "$MITRA_NAME" != "Smoke Mitra Organization" ]; then
  echo "❌ Mitra profile name mismatch: $MITRA_NAME"
  exit 1
fi

echo "✅ Mitra profile verified"
echo

echo "== 9. Submit Mitra registration =="
RAW="$(request_with_status POST "$USER_URL/register/submit" \
  '{"action":"submit"}' \
  "$MITRA_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "submit Mitra registration"
echo

echo "🎉 Smoke test passed."
