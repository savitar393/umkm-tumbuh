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

expect_json_value() {
  local body="$1"
  local expr="$2"
  local expected="$3"
  local label="$4"

  local actual
  actual="$(printf '%s' "$body" | python3 -c "import sys,json; data=json.load(sys.stdin); print($expr)")"

  if [ "$actual" != "$expected" ]; then
    echo "❌ $label expected '$expected', got '$actual'"
    echo "$body"
    exit 1
  fi

  echo "✅ $label = $actual"
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

echo "== Logout token revocation flow =="
LOGOUT_EMAIL="logout.smoke.$RUN_ID@mail.com"
LOGOUT_PHONE="62815${RUN_ID: -9}"

RAW="$(request_with_status POST "$AUTH_URL/auth/register" "{
  \"full_name\":\"Logout Smoke User\",
  \"email\":\"$LOGOUT_EMAIL\",
  \"phone_number\":\"$LOGOUT_PHONE\",
  \"password\":\"password123\",
  \"role\":\"UMKM\"
}")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "201" "register logout smoke user"

LOGOUT_TOKEN="$(printf '%s' "$RESPONSE_BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("access_token",""))')"

if [ -z "$LOGOUT_TOKEN" ]; then
  echo "❌ logout smoke token missing"
  echo "$RESPONSE_BODY"
  exit 1
fi

RAW="$(request_with_status GET "$AUTH_URL/auth/me" "" "$LOGOUT_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "token works before logout"

RAW="$(request_with_status POST "$AUTH_URL/auth/logout" "{}" "$LOGOUT_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "logout revokes token"

RAW="$(request_with_status GET "$AUTH_URL/auth/me" "" "$LOGOUT_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "401" "revoked token should fail"
echo

echo "== Email verification and remember-me refresh token flow =="
REMEMBER_EMAIL="remember.smoke.$RUN_ID@mail.com"
REMEMBER_PASSWORD="password123"

RAW="$(request_with_status POST "$AUTH_URL/auth/register" "{
  \"full_name\":\"Remember Smoke User\",
  \"email\":\"$REMEMBER_EMAIL\",
  \"phone_number\":\"62816$MITRA_PHONE_SUFFIX\",
  \"password\":\"$REMEMBER_PASSWORD\",
  \"role\":\"UMKM\"
}")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "201" "register remember-me smoke user"

RAW="$(request_with_status POST "$AUTH_URL/auth/verify-email/request" "{
  \"email\":\"$REMEMBER_EMAIL\"
}")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "request email verification"

VERIFY_CODE="$(printf '%s' "$RESPONSE_BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("dev_code",""))')"

if [ -z "$VERIFY_CODE" ]; then
  echo "❌ email verification dev_code missing"
  echo "$RESPONSE_BODY"
  exit 1
fi

RAW="$(request_with_status POST "$AUTH_URL/auth/verify-email/confirm" "{
  \"email\":\"$REMEMBER_EMAIL\",
  \"code\":\"$VERIFY_CODE\"
}")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "confirm email verification"

RAW="$(request_with_status POST "$AUTH_URL/auth/login" "{
  \"email\":\"$REMEMBER_EMAIL\",
  \"password\":\"$REMEMBER_PASSWORD\",
  \"remember_me\":true
}")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "login with remember me"

REMEMBER_ACCESS_TOKEN="$(printf '%s' "$RESPONSE_BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("access_token",""))')"
REMEMBER_REFRESH_TOKEN="$(printf '%s' "$RESPONSE_BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("refresh_token",""))')"

if [ -z "$REMEMBER_ACCESS_TOKEN" ] || [ -z "$REMEMBER_REFRESH_TOKEN" ]; then
  echo "❌ remember-me tokens missing"
  echo "$RESPONSE_BODY"
  exit 1
fi

RAW="$(request_with_status GET "$AUTH_URL/auth/me" "" "$REMEMBER_ACCESS_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "remember access token works"

RAW="$(request_with_status POST "$AUTH_URL/auth/refresh" "{
  \"refresh_token\":\"$REMEMBER_REFRESH_TOKEN\"
}")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "refresh token rotates"

NEW_ACCESS_TOKEN="$(printf '%s' "$RESPONSE_BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("access_token",""))')"
NEW_REFRESH_TOKEN="$(printf '%s' "$RESPONSE_BODY" | python3 -c 'import sys,json; print(json.load(sys.stdin).get("refresh_token",""))')"

if [ -z "$NEW_ACCESS_TOKEN" ] || [ -z "$NEW_REFRESH_TOKEN" ]; then
  echo "❌ rotated tokens missing"
  echo "$RESPONSE_BODY"
  exit 1
fi

RAW="$(request_with_status POST "$AUTH_URL/auth/refresh" "{
  \"refresh_token\":\"$REMEMBER_REFRESH_TOKEN\"
}")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "401" "old refresh token should be revoked"

RAW="$(request_with_status GET "$AUTH_URL/auth/me" "" "$NEW_ACCESS_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "new access token works"
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

echo "== 2b. UMKM registration status before profile =="
RAW="$(request_with_status GET "$USER_URL/register/status" "" "$UMKM_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "UMKM registration status before profile"
expect_json_value "$RESPONSE_BODY" "data.get('profile_complete')" "False" "UMKM profile_complete before profile"
expect_json_value "$RESPONSE_BODY" "data.get('submitted')" "False" "UMKM submitted before profile"
expect_json_value "$RESPONSE_BODY" "data.get('next_route')" "/register/umkm/details" "UMKM next_route before profile"
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

echo "== 3b. UMKM registration status after profile save =="
RAW="$(request_with_status GET "$USER_URL/register/status" "" "$UMKM_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "UMKM registration status after profile save"
expect_json_value "$RESPONSE_BODY" "data.get('profile_complete')" "True" "UMKM profile_complete after profile save"
expect_json_value "$RESPONSE_BODY" "data.get('submitted')" "False" "UMKM submitted after profile save"
expect_json_value "$RESPONSE_BODY" "data.get('next_route')" "/register/umkm/review" "UMKM next_route after profile save"
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

echo "== 5b. UMKM registration status after submit =="
RAW="$(request_with_status GET "$USER_URL/register/status" "" "$UMKM_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "UMKM registration status after submit"
expect_json_value "$RESPONSE_BODY" "data.get('submitted')" "True" "UMKM submitted after submit"
expect_json_value "$RESPONSE_BODY" "data.get('next_route')" "/register/pending" "UMKM next_route after submit"

RAW="$(request_with_status POST "$USER_URL/register/submit" \
  '{"action":"submit"}' \
  "$UMKM_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "409" "duplicate UMKM submit should fail"
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

echo "== 6b. Mitra registration status before profile =="
RAW="$(request_with_status GET "$USER_URL/register/status" "" "$MITRA_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "Mitra registration status before profile"
expect_json_value "$RESPONSE_BODY" "data.get('profile_complete')" "False" "Mitra profile_complete before profile"
expect_json_value "$RESPONSE_BODY" "data.get('submitted')" "False" "Mitra submitted before profile"
expect_json_value "$RESPONSE_BODY" "data.get('next_route')" "/register/mitra/details" "Mitra next_route before profile"
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

echo "== 7b. Mitra registration status after profile save =="
RAW="$(request_with_status GET "$USER_URL/register/status" "" "$MITRA_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "Mitra registration status after profile save"
expect_json_value "$RESPONSE_BODY" "data.get('profile_complete')" "True" "Mitra profile_complete after profile save"
expect_json_value "$RESPONSE_BODY" "data.get('submitted')" "False" "Mitra submitted after profile save"
expect_json_value "$RESPONSE_BODY" "data.get('next_route')" "/register/mitra/review" "Mitra next_route after profile save"
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

echo "== 9b. Mitra registration status after submit =="
RAW="$(request_with_status GET "$USER_URL/register/status" "" "$MITRA_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "200" "Mitra registration status after submit"
expect_json_value "$RESPONSE_BODY" "data.get('submitted')" "True" "Mitra submitted after submit"
expect_json_value "$RESPONSE_BODY" "data.get('next_route')" "/register/pending" "Mitra next_route after submit"

RAW="$(request_with_status POST "$USER_URL/register/submit" \
  '{"action":"submit"}' \
  "$MITRA_TOKEN")"
split_response "$RAW"
expect_status "$RESPONSE_STATUS" "409" "duplicate Mitra submit should fail"
echo

echo "🎉 Smoke test passed."
