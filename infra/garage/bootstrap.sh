#!/bin/sh
set -eu

apk add --no-cache curl jq >/dev/null 2>&1

BASE="http://garage:3903"
AUTH="Authorization: Bearer ${GARAGE_ADMIN_TOKEN:-CHANGE_ME_LOCAL_GARAGE_ADMIN_TOKEN}"
JSON="Content-Type: application/json"

echo "Menunggu Garage siap..."
for i in $(seq 1 30); do
  if curl -sf "$BASE/v2/GetClusterStatus" -H "$AUTH" >/tmp/garage_status.json; then
    break
  fi

  echo "Garage belum siap, retry $i/30..."
  sleep 2
done

if [ ! -s /tmp/garage_status.json ]; then
  echo "ERROR: Garage admin API tidak siap."
  exit 1
fi

echo ">>> Configure cluster layout..."

NODE_ID="$(jq -r '.nodes[0].id // empty' /tmp/garage_status.json)"
LAYOUT_VERSION="$(jq -r '.layoutVersion // 0' /tmp/garage_status.json)"
NODE_ROLE="$(jq -r '.nodes[0].role // empty' /tmp/garage_status.json)"

if [ -z "$NODE_ID" ]; then
  echo "ERROR: gagal membaca node id dari GetClusterStatus."
  cat /tmp/garage_status.json
  exit 1
fi

echo "Node ID: $NODE_ID"
echo "Layout version: $LAYOUT_VERSION"

if [ -z "$NODE_ROLE" ] || [ "$NODE_ROLE" = "null" ]; then
  echo ">>> Stage layout changes..."
  curl -sf -X POST "$BASE/v2/UpdateClusterLayout" \
    -H "$AUTH" -H "$JSON" \
    -d "{\"roles\":[{\"id\":\"$NODE_ID\",\"zone\":\"dc1\",\"capacity\":1073741824000,\"tags\":[]}],\"parameters\":{\"zoneRedundancy\":{\"atLeast\":1}}}" \
    || echo "Layout staging gagal atau sudah terkonfigurasi, lanjut..."

  NEXT_VERSION=$((LAYOUT_VERSION + 1))

  echo ">>> Apply layout version $NEXT_VERSION..."
  curl -sf -X POST "$BASE/v2/ApplyClusterLayout" \
    -H "$AUTH" -H "$JSON" \
    -d "{\"version\":$NEXT_VERSION}" \
    || echo "Layout apply gagal atau sudah dilakukan, lanjut..."
else
  echo "Node sudah punya role/layout, skip layout setup."
fi

echo ">>> Ensure Garage key..."

ACCESS_KEY_ID="${OBJECT_STORAGE_ACCESS_KEY:-umkm_garage_access_key}"
SECRET_KEY="${OBJECT_STORAGE_SECRET_KEY:-umkm_garage_secret_key}"

curl -sf -X POST "$BASE/v2/ImportKey" \
  -H "$AUTH" -H "$JSON" \
  -d "{\"accessKeyId\":\"$ACCESS_KEY_ID\",\"secretAccessKey\":\"$SECRET_KEY\",\"name\":\"UMKM App Key\"}" \
  || echo "Key mungkin sudah ada atau ImportKey tidak menerima format ini, lanjut..."

KEYS_JSON="$(curl -sf "$BASE/v2/ListKeys" -H "$AUTH" || echo '{"keys":[]}')"

KEY_ID="$(echo "$KEYS_JSON" | jq -r --arg ACCESS_KEY_ID "$ACCESS_KEY_ID" '
  [
    .. | objects
    | select((.accessKeyId? == $ACCESS_KEY_ID) or (.id? == $ACCESS_KEY_ID))
    | (.accessKeyId? // .id?)
  ][0] // empty
')"

if [ -z "$KEY_ID" ]; then
  echo "ERROR: Garage key matching OBJECT_STORAGE_ACCESS_KEY was not found."
  echo "Expected access key: $ACCESS_KEY_ID"
  echo "$KEYS_JSON"
  exit 1
fi

echo "Key ID: $KEY_ID"

echo ">>> Create buckets..."
for bucket in documents certificates product-images partnership-files; do
  curl -sf -X POST "$BASE/v2/CreateBucket" \
    -H "$AUTH" -H "$JSON" \
    -d "{\"globalAlias\":\"$bucket\"}" \
    || echo "Bucket $bucket mungkin sudah ada, lanjut..."
done

echo ">>> Grant key permissions to buckets..."
for bucket in documents certificates product-images partnership-files; do
  BUCKET_INFO="$(curl -sf "$BASE/v2/GetBucketInfo?globalAlias=$bucket" -H "$AUTH" || echo '{}')"
  BID="$(echo "$BUCKET_INFO" | jq -r '.id // empty')"

  if [ -n "$BID" ]; then
    curl -sf -X POST "$BASE/v2/AllowBucketKey" \
      -H "$AUTH" -H "$JSON" \
      -d "{\"bucketId\":\"$BID\",\"accessKeyId\":\"$KEY_ID\",\"permissions\":{\"read\":true,\"write\":true,\"owner\":true}}" \
      || echo "Allow sudah diatur untuk $bucket, lanjut..."
  else
    echo "WARNING: bucket id untuk $bucket tidak ditemukan."
  fi
done

echo "========================================"
echo "  Garage bootstrap selesai!"
echo "  Access Key ID: $KEY_ID"
echo "========================================"
