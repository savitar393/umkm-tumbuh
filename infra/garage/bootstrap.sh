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

echo ">>> Creating Garage S3 key..."

# Delete existing keys to start clean
EXISTING_KEYS=$(curl -sf "$BASE/v2/ListKeys" -H "$AUTH" || echo '[]')
for key_id in $(echo "$EXISTING_KEYS" | jq -r '.[] | .id // empty'); do
  echo "Deleting old key: $key_id"
  curl -sf -X POST "$BASE/v2/DeleteKey?id=$key_id" -H "$AUTH" -d '{}' \
    || echo "Failed to delete $key_id (might be in use), lanjut..."
done

# Create new key
KEY_RESULT=$(curl -sf -X POST "$BASE/v2/CreateKey" \
  -H "$AUTH" -H "$JSON" \
  -d '{"name":"UMKM App Key"}')

ACCESS_KEY_ID=$(echo "$KEY_RESULT" | jq -r '.accessKeyId')
SECRET_KEY=$(echo "$KEY_RESULT" | jq -r '.secretAccessKey')
KEY_NAME=$(echo "$KEY_RESULT" | jq -r '.name // empty')

if [ -z "$ACCESS_KEY_ID" ] || [ "$ACCESS_KEY_ID" = "null" ]; then
  echo "ERROR: Gagal membuat key Garage."
  echo "$KEY_RESULT"
  exit 1
fi

echo "Key berhasil dibuat:"
echo "  Name:            $KEY_NAME"
echo "  Access Key ID:   $ACCESS_KEY_ID"
echo "  Secret Key:      $SECRET_KEY"

# Write credentials to file for other services to use
CREDS_DIR="/var/lib/garage/creds"
mkdir -p "$CREDS_DIR"
cat > "$CREDS_DIR/garage.env" << EOF
OBJECT_STORAGE_ACCESS_KEY=$ACCESS_KEY_ID
OBJECT_STORAGE_SECRET_KEY=$SECRET_KEY
EOF
echo "Credentials saved to $CREDS_DIR/garage.env"

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
      -d "{\"bucketId\":\"$BID\",\"accessKeyId\":\"$ACCESS_KEY_ID\",\"permissions\":{\"read\":true,\"write\":true,\"owner\":true}}" \
      || echo "Allow sudah diatur untuk $bucket, lanjut..."
  else
    echo "WARNING: bucket id untuk $bucket tidak ditemukan."
  fi
done

echo "========================================"
echo "  Garage bootstrap selesai!"
echo "  Access Key ID: $ACCESS_KEY_ID"
echo "  Secret Key:    $SECRET_KEY"
echo "========================================"
